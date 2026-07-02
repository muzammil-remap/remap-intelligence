import type { ScanRecord } from '@/types/scan';

const CRMS = ['HubSpot', 'Salesforce', 'Pipedrive'];
const MODERN_CLOUD_CRMS = ['HubSpot', 'Salesforce', 'Pipedrive'];
const MARKETING_AUTO = ['Mailchimp', 'ActiveCampaign', 'Klaviyo'];

const hasAny = (list: string[] | undefined, targets: string[]): boolean =>
  !!list && targets.some((t) => list.includes(t));

// AI Readiness. Max 10.
export function aiReadinessScore(scan: ScanRecord): number {
  const tech = scan.scan_homepage?.techSignals ?? [];
  const mx = scan.scan_mx_record;
  const crtsh = scan.scan_crtsh;
  const wayback = scan.scan_wayback;
  let score = 0;

  // CRM detected (any) +2. We treat the named CRMs as "any CRM" for MVP.
  if (hasAny(tech, CRMS)) score += 2;
  // Modern cloud CRM +1 additional.
  if (hasAny(tech, MODERN_CLOUD_CRMS)) score += 1;

  if (mx?.ecosystem === 'google') score += 1;
  if (mx?.ecosystem === 'microsoft') score += 1;

  if (hasAny(tech, MARKETING_AUTO)) score += 1;
  if (tech.includes('Google Tag Manager')) score += 1;
  if (crtsh?.hasApiSubdomain) score += 1;

  if (wayback?.domainAgeYears != null && wayback.domainAgeYears < 8) score += 1;

  // Phase 2: PageSpeed 60+ (+1) — skipped.

  return Math.min(10, score);
}
