// Validate all 5 live scanners against a real domain.
// Run: node --experimental-strip-types scripts/test-scanners.mjs <domain>
// (Imports the .ts scanners directly; Node 22+ strips types.)
import { runHomepageScan } from '../lib/scanners/homepage.ts';
import { runMXRecord } from '../lib/scanners/mxRecord.ts';
import { runSitemap } from '../lib/scanners/sitemap.ts';
import { runCrtsh } from '../lib/scanners/crtsh.ts';
import { runWayback } from '../lib/scanners/wayback.ts';

const domain = process.argv[2] || 'stripe.com';
console.log(`\n=== Scanning ${domain} ===\n`);

const label = (n, v) => {
  console.log(`--- ${n} ---`);
  console.log(JSON.stringify(v, null, 2));
  console.log('');
};

const [hp, mx, sm, crt, wb] = await Promise.allSettled([
  runHomepageScan(domain),
  runMXRecord(domain),
  runSitemap(domain),
  runCrtsh(domain),
  runWayback(domain),
]);

label('1. Homepage', hp.status === 'fulfilled' ? hp.value : `ERR ${hp.reason}`);
label('3. MX Record', mx.status === 'fulfilled' ? mx.value : `ERR ${mx.reason}`);
label('2. Sitemap', sm.status === 'fulfilled' ? sm.value : `ERR ${sm.reason}`);
label('4. crt.sh', crt.status === 'fulfilled' ? crt.value : `ERR ${crt.reason}`);
label('5. Wayback', wb.status === 'fulfilled' ? wb.value : `ERR ${wb.reason}`);
