import { getSupabaseAdmin } from './client';
import type {
  ScanRecord,
  ScanStatus,
  FullScanResult,
  ScanAnswers,
  RoutingDecision,
} from '@/types/scan';
import type { ScoreSet, Opportunity } from '@/types/scoring';

const TABLE = 'scans';

export interface CreateScanInput {
  domain: string;
  clean_domain: string;
  contact_name: string | null;
  contact_email: string;
  competitor_domain: string | null;
}

export async function createScan(input: CreateScanInput): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLE)
    .insert({
      domain: input.domain,
      clean_domain: input.clean_domain,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      competitor_domain: input.competitor_domain,
      status: 'pending' as ScanStatus,
    })
    .select('id')
    .single();

  if (error) throw new Error(`createScan failed: ${error.message}`);
  return data.id as string;
}

export async function updateScanStatus(
  scanId: string,
  status: ScanStatus,
  errorMessage?: string,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const patch: Record<string, unknown> = { status };
  if (errorMessage !== undefined) patch.error_message = errorMessage;
  const { error } = await admin.from(TABLE).update(patch).eq('id', scanId);
  if (error) throw new Error(`updateScanStatus failed: ${error.message}`);
}

export async function saveScanResults(
  scanId: string,
  results: FullScanResult,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from(TABLE)
    .update({
      scan_homepage: results.homepage,
      scan_mx_record: results.mxRecord,
      scan_sitemap: results.sitemap,
      scan_crtsh: results.crtsh,
      scan_wayback: results.wayback,
      scan_apollo: results.apollo,
      scan_google_places: results.googlePlaces,
      scan_pagespeed: results.pageSpeed,
      scan_meta_ads: results.metaAds,
    })
    .eq('id', scanId);
  if (error) throw new Error(`saveScanResults failed: ${error.message}`);
}

export async function saveAnswers(
  scanId: string,
  answers: ScanAnswers,
  checkboxSelections: string[],
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from(TABLE)
    .update({
      q1_growth_challenge: answers.q1 ?? null,
      q2_current_clients: answers.q2Current ?? null,
      q2_capacity: answers.q2Capacity ?? null,
      // q3 is multi-select; store as JSON string for round-tripping.
      q3_acquisition_source: answers.q3 ? JSON.stringify(answers.q3) : null,
      q4_database_frequency: answers.q4 ?? null,
      q5_ai_policy: answers.q5 ?? null,
      checkbox_selections: checkboxSelections,
      status: 'questions_received' as ScanStatus,
    })
    .eq('id', scanId);
  if (error) throw new Error(`saveAnswers failed: ${error.message}`);
}

export async function getFullScan(scanId: string): Promise<ScanRecord> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLE)
    .select('*')
    .eq('id', scanId)
    .single();
  if (error) throw new Error(`getFullScan failed: ${error.message}`);
  return data as ScanRecord;
}

export async function getScanStatus(
  scanId: string,
): Promise<Pick<ScanRecord, 'status' | 'pdf_url'> | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLE)
    .select('status, pdf_url')
    .eq('id', scanId)
    .maybeSingle();
  if (error) {
    // A malformed UUID (or no match) is a "not found", not a server error.
    if (error.code === '22P02' || error.code === 'PGRST116') return null;
    throw new Error(`getScanStatus failed: ${error.message}`);
  }
  return data as Pick<ScanRecord, 'status' | 'pdf_url'> | null;
}

export async function saveScoresAndOpportunities(
  scanId: string,
  scores: ScoreSet,
  opportunities: Opportunity[],
  pdfUrl: string,
  routing: RoutingDecision,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from(TABLE)
    .update({
      scores,
      opportunities,
      routing_decision: routing,
      pdf_url: pdfUrl,
      pdf_generated_at: new Date().toISOString(),
      email_sent_at: new Date().toISOString(),
      status: 'complete' as ScanStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', scanId);
  if (error) {
    throw new Error(`saveScoresAndOpportunities failed: ${error.message}`);
  }
}

// --- Rate limiting (DB-based) ---

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
}

export async function checkAndLogRateLimit(
  ip: string,
  email: string,
): Promise<RateLimitCheck> {
  // In local development the rate limit just gets in the way of repeated
  // testing, so skip it. DEV_MODE is only set locally (never in prod).
  if (process.env.DEV_MODE) {
    return { allowed: true };
  }

  const admin = getSupabaseAdmin();

  // Max 1 per email per 24h.
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: emailCount, error: emailErr } = await admin
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('contact_email', email)
    .gte('created_at', since24h);

  if (emailErr) {
    // Fail open on rate-limit infra errors — don't block a real user.
    console.warn('[rate-limit] email check failed, allowing:', emailErr.message);
    return { allowed: true };
  }
  if ((emailCount ?? 0) >= 1) {
    return {
      allowed: false,
      reason: 'You already requested a report in the last 24 hours.',
    };
  }

  // Max 3 per IP per hour (best-effort; ip is not stored on scans table,
  // so this is a soft guard using created_at volume).
  if (ip && ip !== 'unknown') {
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: ipCount, error: ipErr } = await admin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceHour);
    if (!ipErr && (ipCount ?? 0) >= 30) {
      // Global hourly volume guard as a coarse abuse backstop.
      return { allowed: false, reason: 'Too many requests, try again shortly.' };
    }
  }

  return { allowed: true };
}
