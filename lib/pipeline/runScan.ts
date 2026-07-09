import { runFullScan } from '@/lib/scanners';
import * as db from '@/lib/db/queries';

/**
 * Phase 1 of the scan lifecycle: run all scanners and persist the results.
 *
 * Replaces the first half of the old Inngest `scanJob`. Called fire-and-forget
 * from POST /api/initiate — the HTTP response returns immediately while this
 * runs in the background. The frontend tracks progress by polling
 * GET /api/scan/[scanId]/status.
 *
 * On failure the scan row is marked `failed` with the error message so the UI
 * fails fast instead of polling until timeout.
 */
export async function runScanPipeline(
  scanId: string,
  domain: string,
): Promise<void> {
  try {
    await db.updateScanStatus(scanId, 'scanning');

    const scanResults = await runFullScan(domain);

    await db.saveScanResults(scanId, scanResults);
    await db.updateScanStatus(scanId, 'questions_pending');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[runScanPipeline] failed', message);
    try {
      await db.updateScanStatus(scanId, 'failed', message);
    } catch (statusErr) {
      console.error('[runScanPipeline] could not mark failed', statusErr);
    }
  }
}
