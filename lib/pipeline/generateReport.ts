import { computeAllScores } from '@/lib/scoring';
import {
  computeOpportunities,
  computeRouting,
} from '@/lib/opportunities/opportunityEngine';
import { generatePDF } from '@/lib/pdf/generatePDF';
import { uploadPDF } from '@/lib/pdf/uploadPDF';
import { sendReportEmail } from '@/lib/email/sendReport';
import * as db from '@/lib/db/queries';

/**
 * Phase 2 of the scan lifecycle: compute scores + opportunities + routing,
 * generate and upload the PDF, email it, and persist everything.
 *
 * Replaces the second half of the old Inngest `scanJob`. Because answers are
 * durably saved by the submit-answers route *before* this is invoked, there is
 * no longer any need to poll the DB waiting for the user — we call this
 * fire-and-forget directly from POST /api/scan/[scanId]/submit-answers.
 *
 * On failure the scan row is marked `failed` with the error message so the
 * completion screen fails fast instead of polling.
 */
export async function generateReportPipeline(scanId: string): Promise<void> {
  try {
    const scan = await db.getFullScan(scanId);
    await db.updateScanStatus(scanId, 'generating_pdf');

    const scores = computeAllScores(scan);
    const opportunities = computeOpportunities(scan, scores);
    const routing = computeRouting(scan);

    const pdfBuffer = await generatePDF({ scan, scores, opportunities });
    const pdfUrl = await uploadPDF(scanId, pdfBuffer);

    await sendReportEmail({
      email: scan.contact_email,
      name: scan.contact_name,
      companyDomain: scan.clean_domain,
      pdfBuffer,
      scores,
      topOpportunity: opportunities[0],
    });

    await db.saveScoresAndOpportunities(
      scanId,
      scores,
      opportunities,
      pdfUrl,
      routing,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[generateReportPipeline] failed', message);
    try {
      await db.updateScanStatus(scanId, 'failed', message);
    } catch (statusErr) {
      console.error('[generateReportPipeline] could not mark failed', statusErr);
    }
  }
}
