import { inngest } from '@/inngest.config';
import { runFullScan } from '@/lib/scanners';
import { computeAllScores } from '@/lib/scoring';
import {
  computeOpportunities,
  computeRouting,
} from '@/lib/opportunities/opportunityEngine';
import { generatePDF } from '@/lib/pdf/generatePDF';
import { uploadPDF } from '@/lib/pdf/uploadPDF';
import { sendReportEmail } from '@/lib/email/sendReport';
import * as db from '@/lib/db/queries';

export const scanJob = inngest.createFunction(
  {
    id: 'run-website-scan',
    retries: 2,
    triggers: [{ event: 'scan.initiated' }],
  },
  async ({ event, step }) => {
    const { scanId, domain } = event.data as {
      scanId: string;
      domain: string;
      competitorDomain: string | null;
    };

    await step.run('status-scanning', async () => {
      await db.updateScanStatus(scanId, 'scanning');
    });

    const scanResults = await step.run('run-all-scanners', async () => {
      return runFullScan(domain);
    });

    await step.run('save-results', async () => {
      await db.saveScanResults(scanId, scanResults);
      await db.updateScanStatus(scanId, 'questions_pending');
    });

    // Wait for the user to finish the questions.
    //
    // We can't rely on step.waitForEvent alone: the scan step above can take
    // ~15s, and a fast user may submit answers BEFORE this point is reached.
    // Inngest only matches events published after the wait is registered, so
    // that event would be missed and the run would hang until timeout.
    //
    // Instead we poll the DB: answers are durably persisted by the
    // submit-answers route, so checking status is race-proof. Poll every ~5s
    // for up to ~15 min.
    let answered = await step.run('check-answers-0', async () => {
      const s = await db.getScanStatus(scanId);
      return s?.status === 'questions_received' || s?.status === 'generating_pdf';
    });

    const MAX_POLLS = 180; // 180 * 5s = 15 min
    for (let i = 1; i <= MAX_POLLS && !answered; i++) {
      await step.sleep(`await-answers-${i}`, '5s');
      answered = await step.run(`check-answers-${i}`, async () => {
        const s = await db.getScanStatus(scanId);
        return (
          s?.status === 'questions_received' || s?.status === 'generating_pdf'
        );
      });
    }

    if (!answered) {
      // Timed out waiting for the user — mark failed and stop.
      await step.run('mark-timeout', async () => {
        await db.updateScanStatus(
          scanId,
          'failed',
          'Timed out waiting for questionnaire answers.',
        );
      });
      return;
    }

    await step.run('generate-and-send', async () => {
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
        // Record the reason so the completion screen shows "failed" promptly
        // (instead of polling for 2 min) and we can see why in the DB.
        const message = err instanceof Error ? err.message : String(err);
        await db.updateScanStatus(scanId, 'failed', message);
        throw err; // re-throw so Inngest marks the run failed too
      }
    });
  },
);
