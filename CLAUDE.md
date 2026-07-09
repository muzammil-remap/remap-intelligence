# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js version warning

This project runs **Next.js 16** (`next@16.2.9`) with React 19 and Turbopack. As `AGENTS.md` states, this version has breaking changes vs. older Next.js — **read the relevant guide in `node_modules/next/dist/docs/` before writing App Router / API-route code.** Notable conventions already in use here:

- API route handlers export individual method functions (`export async function POST`, or `export const { GET, POST, PUT } = serve(...)`).
- Dynamic route params are a **Promise**: `{ params }: { params: Promise<{ scanId: string }> }` — you must `await params`.

## Commands

```bash
npm run dev      # next dev (Turbopack)
npm run build    # next build
npm run start    # next start (production)
npm run lint     # eslint

# Database migrations (see supabase/README.md — Postgres is NOT directly
# reachable; the runner goes through the Kong /pg/query endpoint)
npm run db:migration:new -- <name>   # create supabase/migrations/<ts>_<name>.sql
npm run db:migrate                   # apply pending migrations
npm run db:migrate:status            # applied vs pending

# Manual test scripts (no test framework configured). Node 22+ strips TS types inline.
node --experimental-strip-types scripts/test-scanners.mjs <domain>   # validate all 5 live scanners
node scripts/test-pdf.mjs                                            # PDF generation
node scripts/test-sendgrid.mjs                                       # email delivery (SendGrid)
```

Set `DEV_MODE=1` in `.env` for local development — it disables rate limiting in `checkAndLogRateLimit` and unlocks the dev-only `/api/dev/sample-pdf` route. Background work (scanning, PDF generation) runs in-process via fire-and-forget async pipelines, so no separate worker/dev-server is needed alongside `next dev`.

There is **no automated test suite** — the `scripts/*.mjs` files are ad-hoc validation harnesses run by hand.

## Architecture

This is a lead-gen tool: a prospect submits their website, the app scans it, asks a short questionnaire, then generates a scored PDF "AI Intelligence Report" and emails it. The whole thing is a **state machine driven by two fire-and-forget async pipelines** (`lib/pipeline/`), each kicked off (not awaited) from an API route. The DB row's `status` column is the single source of truth; the frontend polls for it.

### The scan lifecycle (follow the `ScanStatus` enum in `types/scan.ts`)

`pending → scanning → questions_pending → questions_received → generating_pdf → complete` (or `failed`).

1. **`POST /api/initiate`** validates input, creates a `scans` row (status `pending`), then calls `runScanPipeline(scanId, domain)` **without awaiting it** and returns `{ scanId }` immediately.
2. **`lib/pipeline/runScan.ts`** (`runScanPipeline`) runs all scanners (`runFullScan`) → saves results → status `questions_pending`. On error it marks the row `failed` with the message.
3. **`POST /api/scan/[scanId]/submit-answers`** persists questionnaire answers (status `questions_received`), then calls `generateReportPipeline(scanId)` **without awaiting it** and returns immediately. Because answers are durably saved *before* the pipeline runs, there is no race and no DB polling/waiting is needed (this is what the old Inngest job's 15-min DB poll worked around).
4. **`lib/pipeline/generateReport.ts`** (`generateReportPipeline`) computes scores → opportunities → routing, generates the PDF, uploads it, emails it, saves everything → status `complete`. On error it marks the row `failed` with the message.
5. **`GET /api/scan/[scanId]/status`** is polled by the frontend for a progress bar (maps status → percentage).

Both pipelines set status `failed` **with** the error message on any failure (so the completion screen fails fast instead of polling for 2 min). They swallow the error after recording it — since they run detached, there is no caller to re-throw to.

> **Fire-and-forget caveat:** background work runs in the same Node process as the request. This is fine for a self-hosted / long-lived server (`next start`) but will NOT survive on serverless platforms that freeze the function after the response (e.g. Vercel functions without `waitUntil`). If deploying serverless, wrap the `void <pipeline>()` calls in `after()` from `next/server` (or reintroduce a real queue).

### Scanners — `lib/scanners/`

`runFullScan(domain)` fans out with `Promise.allSettled` so one scanner failing never fails the scan (rejected → `null`). Five **live** scanners: `homepage`, `mxRecord`, `sitemap`, `crtsh`, `wayback`. Everything under `lib/scanners/stubs/` (`apollo`, `apify`, `metaAds`, `googlePlaces`, `pageSpeed`) is **Phase 2 — intentionally returns `null`**; the types exist (`type ApolloResult = null`) but they are not called. Don't wire them up unless implementing Phase 2.

### Scoring & opportunities — `lib/scoring/`, `lib/opportunities/`

- `computeAllScores(scan)` produces a `ScoreSet` (aeo, geo, readiness, opportunity, icp — all 0–10 — plus a `signal` headline). Each dimension is its own file in `lib/scoring/`.
- `computeOpportunities(scan, scores)` matches the scan+answers against the declarative `OPPORTUNITY_MAP` array in `opportunityEngine.ts` — each entry has a `check()` predicate and copy. To add/change a recommendation, edit that array. Results are sorted by impact (HIGH→MED→LOW).
- `computeRouting(scan)` decides `growth` vs `efficiency` from the Q2 capacity ratio (≥0.85 utilisation ⇒ efficiency).
- Questionnaire answers are stored as flat `q1_..q5_` columns; `parseAnswers()` normalises them back into a `ScanAnswers` object. **Q3 is multi-select, stored as a JSON string** with a legacy comma-joined fallback on parse.

### Persistence — `lib/db/`

Single Supabase table `scans` (one row per scan, holds raw scanner JSON, answers, computed scores, opportunities, and PDF metadata). `client.ts` exposes two clients:
- `supabasePublic` — anon key, browser-safe.
- `getSupabaseAdmin()` — **service-role key, server-only, bypasses RLS. Never import into a Client Component.**

All queries live in `queries.ts` and are imported as `import * as db`. PDFs go to the public `reports` storage bucket (`uploadPDF`), keyed by `<scanId>.pdf`.

Schema changes go through versioned migrations in `supabase/migrations/`, applied with `npm run db:migrate` — **read `supabase/README.md` first** (self-hosted instance; new tables need explicit `service_role` grants or the app gets `permission denied`).

### PDF & email

- `lib/pdf/generatePDF.tsx` uses `@react-pdf/renderer`. This package is listed in `serverExternalPackages` in `next.config.ts` — it pulls in native deps (fontkit/yoga) that break if bundled. Don't remove that.
- `lib/email/sendReport.ts` sends via **SendGrid only** (`SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL`; the From domain must be authenticated in the SendGrid account). The earlier Resend/Gmail transports and the `EMAIL_TRANSPORT` switch were removed.

### Frontend

Client-heavy App Router pages. `app/page.tsx` has two states: **pre-scan** shows a hero (headline + `components/HeroVisual.tsx` sample-report card + stat row) over the intake form and a 3-card feature strip; **post-scan** switches to a two-column journey — an animated left-rail checklist (`components/JourneyRail.tsx` — details → scan sources → questions → manual tasks → compile) beside the question flow. All client-side with `fetch` to the API routes. Components under `components/` are the UI (`Dashboard`, `QuestionFlow`, `ScoreRing`, etc.). `app/dashboard/[view]/` is a Phase 2 shell (sub-views locked).

**Theming:** the app has light + dark modes. All design tokens live as CSS custom properties in `app/globals.css` (`:root` = dark default, `[data-theme="light"]` overrides), and `lib/constants.ts` exposes them as the `T` object whose values are `var(--…)` strings — **use `T`/the variables, never hardcode colors** (except in emails/PDF, which can't use CSS vars: the PDF uses the separate `PDF` palette in `constants.ts`). The theme is applied before paint by an inline script in `app/layout.tsx` (localStorage `remap-theme`, falling back to the OS preference) and toggled by `components/ThemeToggle.tsx`; `components/Logo.tsx` renders both logo PNGs and CSS picks one per theme. Fonts are Manrope (UI, `--font-manrope`) and Space Grotesk (display headings via the `.h-display` class), self-hosted through `next/font`.

### Config notes

- `@/*` path alias maps to the repo root (`tsconfig.json`).
- `next.config.ts` pins CORS/CSP to `https://remap.ai` (the report is embedded there) and pins the Turbopack root to `__dirname`.
