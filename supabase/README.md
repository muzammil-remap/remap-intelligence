# Database migrations

Schema changes for the self-hosted Supabase instance (`NEXT_PUBLIC_SUPABASE_URL`,
deployed on Dokploy). Postgres is **not** directly reachable — Dokploy only
exposes the Kong gateway (port 8000) — so the Supabase CLI's `db push` cannot
be used. Instead, `scripts/migrate.mjs` applies migrations over pg-meta's
`/pg/query` endpoint (through Kong, service-role key, runs as `supabase_admin`).

Conventions intentionally mirror the Supabase CLI so we can switch to it later
(e.g. via an SSH tunnel to the VPS) without rework:

- migrations live in `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`, applied
  in filename order
- applied versions are tracked in `supabase_migrations.schema_migrations` on
  the target database

## Workflow

```bash
npm run db:migration:new -- add_leads_table   # create supabase/migrations/<ts>_add_leads_table.sql
# ...write SQL in the new file...
npm run db:migrate                            # apply pending migrations
npm run db:migrate:status                     # applied vs pending
```

## Rules

- **Never edit or rename an applied migration.** Every change is a new file.
- Each migration + its tracking insert run as one implicit transaction: if the
  SQL fails, nothing is recorded and the file stays pending. (Don't put
  explicit `COMMIT` in a migration — it breaks that atomicity.)
- **New tables need explicit grants.** DDL runs as `supabase_admin` (owner),
  but the app connects as `service_role`, and it gets no privileges by
  default on this instance. Every new table needs:
  ```sql
  grant all privileges on table public.<table> to service_role;
  alter table public.<table> enable row level security;
  ```
  (RLS with no policies denies `anon`/`authenticated`; `service_role`
  bypasses RLS. The app never queries as `anon` — see `lib/db/client.ts`.)
- The runner sends `notify pgrst, 'reload schema'` after applying, so new
  tables/columns are immediately visible through PostgREST.
