import type { ScanRecord } from '@/types/scan';

// AEO — Answer Engine Optimisation. Max 10.
export function aeoScore(scan: ScanRecord): number {
  const hp = scan.scan_homepage;
  const sm = scan.scan_sitemap;
  let score = 0;

  if (hp?.schemaTypes && hp.schemaTypes.length > 0) score += 2; // any schema
  if (hp?.hasLocalBusinessSchema) score += 2;
  if (hp?.hasFAQSchema) score += 2;
  if (hp?.metaDescription) score += 1;
  if (sm?.hasBlog) score += 1;
  if ((sm?.totalPages ?? 0) >= 50) score += 1;
  if (hp?.hasOpenGraph) score += 1;

  return Math.min(10, score);
}
