// Throwaway Gmail SMTP diagnostic. Run: node scripts/test-gmail.mjs <to-email>
import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/test-gmail.mjs <to-email>');
  process.exit(1);
}

const user = env.GMAIL_USER;
const pass = (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
console.log('User:', user, '| pass len:', pass.length, '| To:', to);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user, pass },
});

try {
  const info = await transporter.sendMail({
    to,
    from: `REMAP Intelligence <${user}>`,
    subject: 'REMAP Gmail SMTP diagnostic',
    html: '<p>If you can read this, <strong>Gmail SMTP delivery works.</strong></p>',
  });
  console.log('\n✅ SENT. messageId:', info.messageId);
  console.log('response:', info.response);
} catch (err) {
  console.error('\n❌ FAILED.');
  console.error(err?.message || err);
}
