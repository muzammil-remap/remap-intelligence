import type { ScoreSet, Opportunity } from '@/types/scoring';
import { CALENDLY_URL } from '@/lib/constants';

/* ---------------------------------------------------------------------------
 * EMAIL TRANSPORT — SendGrid only.
 *
 * Required env vars:
 *   SENDGRID_API_KEY     — API key with Mail Send permission
 *   SENDGRID_FROM_EMAIL  — verified sender address (remap.ai is verified)
 *
 * The From domain must be authenticated in the SendGrid account or mail is
 * held in "processing" / dropped.
 * ------------------------------------------------------------------------- */

interface BuiltEmail {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  attachmentFilename: string;
  pdfBuffer: Buffer;
}

function fromAddress(): string {
  // Must be a verified/authenticated sender in the SendGrid account.
  return process.env.SENDGRID_FROM_EMAIL || 'hello@remap.ai';
}

async function sendViaSendgrid(email: BuiltEmail): Promise<void> {
  // Lazy import so @sendgrid/mail is only loaded when a send actually happens.
  const sgMail = (await import('@sendgrid/mail')).default;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY is not set');
  sgMail.setApiKey(key);

  try {
    await sgMail.send({
      to: email.to,
      from: email.from,
      replyTo: email.replyTo,
      subject: email.subject,
      html: email.html,
      attachments: [
        {
          content: email.pdfBuffer.toString('base64'),
          filename: email.attachmentFilename,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });
  } catch (err) {
    const detail =
      err && typeof err === 'object' && 'response' in err
        ? JSON.stringify((err as { response?: { body?: unknown } }).response?.body)
        : err instanceof Error
          ? err.message
          : String(err);
    throw new Error(`SendGrid send failed: ${detail}`);
  }
}

export async function sendReportEmail(params: {
  email: string;
  name: string | null;
  companyDomain: string;
  pdfBuffer: Buffer;
  scores: ScoreSet;
  topOpportunity: Opportunity | undefined;
}): Promise<void> {
  const { email, name, companyDomain, pdfBuffer, scores, topOpportunity } = params;
  const greetingName = name || 'there';
  const date = new Date().toISOString().split('T')[0];

  const opportunityBlock = topOpportunity
    ? `
      <p style="color:#94a3b8;">Your top finding:</p>
      <div style="background:#111827;border-left:3px solid #f97316;padding:16px;border-radius:8px;margin:16px 0;">
        <strong style="color:#f8fafc">${topOpportunity.title}</strong><br>
        <span style="color:#94a3b8;font-size:14px;">${topOpportunity.body}</span>
      </div>`
    : '';

  // Logo needs an absolute URL in email (local /public paths don't resolve in
  // mail clients). The email body is dark, so use the dark-mode (white) logo.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://remap-intelligence.vercel.app';
  const logoUrl = `${baseUrl}/remap-logo-dark-mode.png`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0a0f1a;color:#f8fafc;padding:32px;">
      <img src="${logoUrl}" alt="REMAP Intelligence" height="30" style="height:30px;width:auto;display:block;margin-bottom:24px;" />
      <h2 style="color:#f8fafc;margin:0 0 8px;">Hi ${greetingName},</h2>
      <p style="color:#94a3b8;">Your REMAP AI Intelligence Report for <strong style="color:#f8fafc">${companyDomain}</strong> is attached.</p>
      ${opportunityBlock}
      <p style="color:#94a3b8;">AI Opportunity Score: <strong style="color:#f97316">${scores.opportunity}/10</strong></p>
      <a href="${CALENDLY_URL}" style="display:inline-block;background:#f97316;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Book a 15-min call &raquo;</a>
      <p style="color:#64748b;font-size:12px;margin-top:32px;">The REMAP Team · remap.ai</p>
    </div>
  `;

  await sendViaSendgrid({
    to: email,
    from: fromAddress(),
    replyTo: 'hello@remap.ai',
    subject: `Your AI Intelligence Report — ${companyDomain}`,
    html,
    attachmentFilename: `REMAP-Intelligence-${companyDomain}-${date}.pdf`,
    pdfBuffer,
  });
}
