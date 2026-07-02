import type { ScanRecord } from '@/types/scan';

// GEO — Generative Engine Optimisation. Max 10 (MVP max ~5).
// Phase 2 signals (Google reviews, LinkedIn) score 0 until those scanners exist.
export function geoScore(scan: ScanRecord): number {
  const hp = scan.scan_homepage;
  const sm = scan.scan_sitemap;
  let score = 0;

  if (sm?.hasTeamPage) score += 1;
  if (sm?.hasBlog) score += 2;
  if (hp?.hasFAQContent || sm?.hasFAQ) score += 2;

  // Phase 2 (currently 0): Google review count 50+ (+2), rating 4.5+ (+1),
  // LinkedIn followers 500+ (+1), LinkedIn post in last 30 days (+1).

  return Math.min(10, score);
}
