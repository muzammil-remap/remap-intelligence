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

# Manual test scripts (no test framework configured). Node 22+ strips TS types inline.
node --experimental-strip-types scripts/test-scanners.mjs <domain>   # validate all 5 live scanners
node scripts/test-pdf.mjs                                            # PDF generation
node scripts/test-resend.mjs / test-sendgrid.mjs / test-gmail.mjs    # email transports
```

Local dev requires `INNGEST_DEV=1` in `.env` (forces the Inngest SDK into dev mode; also disables rate limiting in `checkAndLogRateLimit`). Run the Inngest dev server alongside `next dev` to execute background jobs.

There is **no automated test suite** — the `scripts/*.mjs` files are ad-hoc validation harnesses run by hand.

## Architecture

This is a lead-gen tool: a prospect submits their website, the app scans it, asks a short questionnaire, then generates a scored PDF "AI Intelligence Report" and emails it. The whole thing is a **state machine driven by a single Inngest background job**.

### The scan lifecycle (follow the `ScanStatus` enum in `types/scan.ts`)

`pending → scanning → questions_pending → questions_received → generating_pdf → complete` (or `failed`).

1. **`POST /api/initiate`** validates input, creates a `scans` row (status `pending`), and fires the `scan.initiated` Inngest event.
2. **`lib/inngest/scanJob.ts`** (the one long-running function) does everything:
   - runs all scanners (`runFullScan`) → saves results → status `questions_pending`
   - **polls the DB every 5s (up to 15 min) waiting for the user to answer questions.** It deliberately does *not* use `step.waitForEvent` alone, because a fast user can submit answers before the wait is registered and the event would be missed — see the long comment in that file. The `scan.answers-submitted` event exists but the DB poll is the race-proof source of truth.
   - once answered: computes scores → opportunities → routing, generates the PDF, uploads it, emails it, saves everything → status `complete`.
3. **`POST /api/scan/[scanId]/submit-answers`** persists questionnaire answers (status `questions_received`) — this is what the poll above detects.
4. **`GET /api/scan/[scanId]/status`** is polled by the frontend for a progress bar (maps status → percentage).
5. **`app/api/inngest/route.ts`** is the Inngest webhook endpoint that registers `scanJob`.

Errors inside the final step set status `failed` **with** the error message (so the completion screen fails fast instead of polling for 2 min) and re-throw so Inngest also marks the run failed.

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

### PDF & email

- `lib/pdf/generatePDF.tsx` uses `@react-pdf/renderer`. This package is listed in `serverExternalPackages` in `next.config.ts` — it pulls in native deps (fontkit/yoga) that break if bundled. Don't remove that.
- `lib/email/sendReport.ts` supports **three interchangeable transports** selected by the `EMAIL_TRANSPORT` env var (`resend` default, `sendgrid`, `gmail`). Switching is a one-line env change. See the header comment for the account/verification caveats (SendGrid account has reputation issues; Resend falls back to the `onboarding@resend.dev` sandbox sender until `remap.ai` is verified there).

### Frontend

Client-heavy App Router pages. `app/page.tsx` is the intake form → scan tracker → question flow, all client-side with `fetch` to the API routes. Components under `components/` are the UI (`Dashboard`, `QuestionFlow`, `ScoreRing`, etc.). **All design tokens (dark theme colors) live in `lib/constants.ts` as the `T` object — use it, don't hardcode colors.** `app/dashboard/[view]/` is a Phase 2 shell (sub-views locked).

### Config notes

- `@/*` path alias maps to the repo root (`tsconfig.json`).
- `next.config.ts` pins CORS/CSP to `https://remap.ai` (the report is embedded there) and pins the Turbopack root to `__dirname`.
