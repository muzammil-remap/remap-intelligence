// Throwaway Resend diagnostic. Run: node scripts/test-resend.mjs <to-email>
// Sends from onboarding@resend.dev (no domain verification needed), but Resend
// sandbox only delivers to the email that OWNS the Resend account.
import { readFileSync } from 'node:fs';
import { Resend } from 'resend';

const env = {};
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/test-resend.mjs <to-email>');
  process.exit(1);
}
if (!env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set in .env');
  process.exit(1);
}

console.log('Key prefix:', env.RESEND_API_KEY.slice(0, 4) + '... | To:', to);
const resend = new Resend(env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  to,
  from: 'REMAP Intelligence <onboarding@resend.dev>',
  subject: 'REMAP Resend diagnostic',
  html: '<p>If you can read this, <strong>Resend delivery works.</strong></p>',
});

if (error) {
  console.error('\n❌ FAILED.');
  console.error(JSON.stringify(error, null, 2));
} else {
  console.log('\n✅ SENT. id:', data?.id);
}
