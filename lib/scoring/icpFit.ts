import type { ScanRecord } from '@/types/scan';

const CRMS = ['HubSpot', 'Salesforce', 'Pipedrive'];

// ICP Fit. Max 10 (MVP max ~2-3 — most signals are Phase 2).
export function icpFitScore(scan: ScanRecord): number {
  const tech = scan.scan_homepage?.techSignals ?? [];
  const wayback = scan.scan_wayback;
  let score = 0;

  if (CRMS.some((c) => tech.includes(c))) score += 1;
  if ((wayback?.domainAgeYears ?? 0) >= 5) score += 1;

  // Phase 2: headcount 6-50 (+3), AU/NZ/US/UK/CA (+2), running ads (+1),
  // Google reviews 20+ (+1).

  return Math.min(10, score);
}
