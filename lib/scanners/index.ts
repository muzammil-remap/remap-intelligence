import { runHomepageScan } from './homepage';
import { runMXRecord } from './mxRecord';
import { runSitemap } from './sitemap';
import { runCrtsh } from './crtsh';
import { runWayback } from './wayback';
import type { FullScanResult } from '@/types/scan';

// Extract value or null from a PromiseSettledResult.
function settled<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === 'fulfilled' ? r.value : null;
}

export async function runFullScan(domain: string): Promise<FullScanResult> {
  const [homepage, mxRecord, sitemap, crtsh, wayback] = await Promise.allSettled([
    runHomepageScan(domain),
    runMXRecord(domain),
    runSitemap(domain),
    runCrtsh(domain),
    runWayback(domain),
    // Phase 2 stubs intentionally resolve to null; no need to spawn them.
  ]);

  return {
    homepage: settled(homepage),
    mxRecord: settled(mxRecord),
    sitemap: settled(sitemap),
    crtsh: settled(crtsh),
    wayback: settled(wayback),
    apollo: null,
    apify: null,
    metaAds: null,
    googlePlaces: null,
    pageSpeed: null,
  };
}
