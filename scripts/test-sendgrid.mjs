// Throwaway SendGrid diagnostic. Run: node scripts/test-sendgrid.mjs <to-email>
// Loads .env.local manually (no Next runtime here).
import { readFileSync } from 'node:fs';
import sgMail from '@sendgrid/mail';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/test-sendgrid.mjs <to-email>');
  process.exit(1);
}

const from = env.SENDGRID_FROM_EMAIL;
console.log('From:', from);
console.log('To:', to);
console.log('Key prefix:', (env.SENDGRID_API_KEY || '').slice(0, 4) + '...');

sgMail.setApiKey(env.SENDGRID_API_KEY);

try {
  const [res] = await sgMail.send({
    to,
    from,
    subject: 'REMAP SendGrid diagnostic',
    text: 'If you can read this, SendGrid delivery works.',
    html: '<p>If you can read this, <strong>SendGrid delivery works.</strong></p>',
  });
  console.log('\n✅ SENT. statusCode:', res.statusCode);
  console.log('x-message-id:', res.headers['x-message-id']);
} catch (err) {
  console.error('\n❌ FAILED.');
  console.error('code:', err?.code);
  console.error('body:', JSON.stringify(err?.response?.body, null, 2));
}
