// Migration runner for the self-hosted Supabase instance.
//
// Postgres is not reachable directly (Dokploy only exposes the Kong gateway
// on port 8000), so the Supabase CLI's `db push` can't be used. Instead this
// script applies SQL files over pg-meta's /pg/query endpoint (routed through
// Kong, authenticated with the service-role key, runs as supabase_admin).
//
// It mirrors the Supabase CLI conventions so we can switch to the CLI later
// without rework: migrations live in supabase/migrations/<timestamp>_<name>.sql
// and applied versions are tracked in supabase_migrations.schema_migrations.
//
// Usage:
//   node scripts/migrate.mjs               # apply all pending migrations
//   node scripts/migrate.mjs status        # list applied + pending
//   node scripts/migrate.mjs new <name>    # create a new empty migration file
//
// Rules:
//   - Never edit or rename a migration that has been applied anywhere.
//   - Each change is a NEW file; files run in filename (timestamp) order.
//   - Remember explicit grants: /pg/query runs as supabase_admin (table owner),
//     but the app connects as service_role — new tables need
//     `grant all on table public.<t> to service_role;` (see initial migration).

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = 'supabase/migrations';

// --- env (same idiom as the other scripts/*.mjs harnesses) ---
const env = {};
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}
const base = (env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`${base}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 500)}`);
  return body ? JSON.parse(body) : null;
}

const sqlString = (s) => `'${s.replace(/'/g, "''")}'`;

// Same tracking table the Supabase CLI uses (extra applied_at is compatible).
async function ensureTrackingTable() {
  await query(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version    text primary key,
      name       text,
      statements text[],
      applied_at timestamptz not null default now()
    );
  `);
}

function localMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{14}_.+\.sql$/.test(f))
    .sort()
    .map((file) => {
      const [, version, name] = file.match(/^(\d{14})_(.+)\.sql$/);
      return { file, version, name };
    });
}

async function appliedVersions() {
  const rows = await query(
    'select version from supabase_migrations.schema_migrations order by version;',
  );
  return new Set(rows.map((r) => r.version));
}

const cmd = process.argv[2] ?? 'up';

if (cmd === 'new') {
  const name = (process.argv[3] ?? '').replace(/[^a-zA-Z0-9_]+/g, '_');
  if (!name) {
    console.error('Usage: node scripts/migrate.mjs new <name>');
    process.exit(1);
  }
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const file = join(MIGRATIONS_DIR, `${ts}_${name}.sql`);
  writeFileSync(file, `-- ${name}\n`);
  console.log('created', file);
} else if (cmd === 'status') {
  await ensureTrackingTable();
  const applied = await appliedVersions();
  for (const m of localMigrations()) {
    console.log(`${applied.has(m.version) ? 'applied' : 'PENDING'}  ${m.file}`);
  }
  const local = new Set(localMigrations().map((m) => m.version));
  for (const v of applied) {
    if (!local.has(v)) console.log(`applied (no local file!)  ${v}`);
  }
} else if (cmd === 'up') {
  await ensureTrackingTable();
  const applied = await appliedVersions();
  const pending = localMigrations().filter((m) => !applied.has(m.version));
  if (pending.length === 0) {
    console.log('No pending migrations.');
    process.exit(0);
  }
  for (const m of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, m.file), 'utf8');
    // Migration + tracking insert sent as one request: pg-meta executes it via
    // the simple query protocol, so the whole batch is one implicit
    // transaction — the version is only recorded if the migration succeeds.
    // (Caveat: SQL containing explicit COMMIT breaks that atomicity.)
    await query(
      `${sql}\ninsert into supabase_migrations.schema_migrations (version, name) values (${sqlString(m.version)}, ${sqlString(m.name)});`,
    );
    console.log('applied', m.file);
  }
  // PostgREST caches the schema; reload so new tables/columns are visible
  // to the app immediately.
  await query(`notify pgrst, 'reload schema';`);
  console.log('Done. PostgREST schema cache reloaded.');
} else {
  console.error(`Unknown command: ${cmd} (expected: up | status | new)`);
  process.exit(1);
}
