import nodemailer from 'nodemailer';
import type { ScoreSet, Opportunity } from '@/types/scoring';
import { CALENDLY_URL } from '@/lib/constants';

/* ---------------------------------------------------------------------------
 * EMAIL TRANSPORT
 *
 * ACTIVE: Resend (EMAIL_TRANSPORT=resend). Chosen for reliable transactional
 * delivery. SendGrid was tried but the available (shared, high-volume) account
 * holds mail in "processing" indefinitely due to degraded sender reputation —
 * an account-health issue, not a code issue. Gmail SMTP was also tried but the
 * App Password we had wouldn't authenticate.
 *
 * All three transports are kept and selected via the EMAIL_TRANSPORT env var,
 * so switching is a one-line env change with zero code edits:
 *   EMAIL_TRANSPORT=resend    -> sendViaResend()   (default / active)
 *   EMAIL_TRANSPORT=sendgrid  -> sendViaSendgrid()  (ready; needs a healthy acct)
 *   EMAIL_TRANSPORT=gmail     -> sendViaGmail()     (ready; needs valid App Pwd)
 *
 * Required env vars per transport:
 *   Resend  : RESEND_API_KEY,   SENDGRID_FROM_EMAIL (reused as the From address)
 *   SendGrid: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 *   Gmail   : GMAIL_USER,       GMAIL_APP_PASSWORD
 *
 * NOTE: the From domain must be verified for whichever transport is active
 * (remap.ai is verified on both Resend and SendGrid).
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
  // Must be a verified/authenticated sender for whichever transport is active.
  return process.env.SENDGRID_FROM_EMAIL || 'hello@remap.ai';
}

// --- Gmail SMTP transport (ACTIVE) ---
async function sendViaGmail(email: BuiltEmail): Promise<void> {
  const user = process.env.GMAIL_USER || process.env.SENDGRID_FROM_EMAIL;
  // Gmail App Passwords are displayed in 4-char groups; the spaces are cosmetic
  // and must be removed before authenticating.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD are not set');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    to: email.to,
    // Gmail forces the From to the authenticated account, but set a friendly name.
    from: `REMAP Intelligence <${user}>`,
    replyTo: email.replyTo,
    subject: email.subject,
    html: email.html,
    attachments: [
      {
        filename: email.attachmentFilename,
        content: email.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

// --- Resend transport (ACTIVE) ---
async function sendViaResend(email: BuiltEmail): Promise<void> {
  // Lazy import so resend isn't loaded unless this transport is used.
  const { Resend } = await import('resend');
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const resend = new Resend(key);

  // Resend requires the From domain to be verified in the Resend account.
  // remap.ai isn't verified yet, so default to the sandbox sender
  // (onboarding@resend.dev), which delivers to the account-owner address.
  // Once remap.ai is verified in Resend, set RESEND_FROM_EMAIL=hello@remap.ai
  // (or just SENDGRID_FROM_EMAIL) and this falls through to the real address.
  const resendFrom =
    process.env.RESEND_FROM_EMAIL || 'REMAP Intelligence <onboarding@resend.dev>';

  const { error } = await resend.emails.send({
    to: email.to,
    from: resendFrom,
    replyTo: email.replyTo,
    subject: email.subject,
    html: email.html,
    attachments: [
      {
        // Resend accepts a Buffer directly for attachment content.
        content: email.pdfBuffer,
        filename: email.attachmentFilename,
        contentType: 'application/pdf',
      },
    ],
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

// --- SendGrid API transport (KEPT — inactive; account reputation issue) ---
// Re-enable by setting EMAIL_TRANSPORT=sendgrid with a healthy account.
async function sendViaSendgrid(email: BuiltEmail): Promise<void> {
  // Lazy import so @sendgrid/mail isn't loaded unless this transport is used.
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

  const built: BuiltEmail = {
    to: email,
    from: fromAddress(),
    replyTo: 'hello@remap.ai',
    subject: `Your AI Intelligence Report — ${companyDomain}`,
    html,
    attachmentFilename: `REMAP-Intelligence-${companyDomain}-${date}.pdf`,
    pdfBuffer,
  };

  // Transport selector — defaults to Resend. Override with EMAIL_TRANSPORT.
  const transport = (process.env.EMAIL_TRANSPORT || 'resend').toLowerCase();
  switch (transport) {
    case 'sendgrid':
      await sendViaSendgrid(built);
      break;
    case 'gmail':
      await sendViaGmail(built);
      break;
    case 'resend':
    default:
      await sendViaResend(built);
      break;
  }
}
