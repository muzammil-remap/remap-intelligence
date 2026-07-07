-- REMAP Intelligence — database schema
-- Single source of truth for the Supabase `scans` table + `reports` storage bucket.
-- Derived from types/scan.ts (ScanRecord) and lib/db/queries.ts.
--
-- Apply against a fresh Supabase project. Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- scans table
-- ---------------------------------------------------------------------------
create table if not exists public.scans (
  id                    uuid primary key default gen_random_uuid(),

  -- intake
  domain                text not null,
  clean_domain          text not null,
  contact_name          text,
  contact_email         text not null,
  competitor_domain     text,
  status                text not null default 'pending',

  -- raw scanner output (JSONB blobs)
  scan_homepage         jsonb,
  scan_mx_record        jsonb,
  scan_sitemap          jsonb,
  scan_crtsh            jsonb,
  scan_wayback          jsonb,
  scan_apollo           jsonb,
  scan_wappalyzer       jsonb,
  scan_google_places    jsonb,
  scan_pagespeed        jsonb,
  scan_meta_ads         jsonb,
  scan_proxycurl        jsonb,

  -- questionnaire answers (flat columns; q3 stored as JSON-encoded string)
  q1_growth_challenge   text,
  q2_current_clients    text,
  q2_capacity           text,
  q3_acquisition_source text,
  q4_database_frequency text,
  q5_ai_policy          text,
  checkbox_selections   text[],

  -- computed
  industry_key          text,
  scores                jsonb,
  opportunities         jsonb,
  routing_decision      text,

  -- output / lifecycle
  pdf_url               text,
  pdf_generated_at      timestamptz,
  email_sent_at         timestamptz,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz,
  error_message         text
);

-- Indexes used by rate limiting (contact_email + created_at) and status polling.
create index if not exists scans_contact_email_idx on public.scans (contact_email);
create index if not exists scans_created_at_idx     on public.scans (created_at);
create index if not exists scans_status_idx         on public.scans (status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- All application access goes through the service-role admin client, which
-- bypasses RLS. The anon client (supabasePublic) is never used for queries.
-- Enable RLS with no anon policies => anon is denied by default. Service role
-- still has full access.
-- ---------------------------------------------------------------------------
alter table public.scans enable row level security;

-- Grants for the PostgREST-facing roles. The app connects as `service_role`
-- (bypasses RLS but still needs table privileges). `anon`/`authenticated` are
-- granted nothing here, so RLS + no grants => denied by default.
grant all privileges on table public.scans to service_role;
grant usage on schema public to service_role;

-- ---------------------------------------------------------------------------
-- Storage: public `reports` bucket for generated PDFs (keyed by <scanId>.pdf)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do update set public = true;
