import { promises as dns } from 'dns';
import type { MXRecordResult, EmailEcosystem } from '@/types/scan';

interface ProviderMatch {
  test: RegExp;
  provider: string;
  ecosystem: EmailEcosystem;
}

const PROVIDERS: ProviderMatch[] = [
  { test: /(aspmx|google)/i, provider: 'Google Workspace', ecosystem: 'google' },
  {
    test: /(outlook|microsoft|protection\.outlook)/i,
    provider: 'Microsoft 365',
    ecosystem: 'microsoft',
  },
  { test: /mimecast/i, provider: 'Mimecast (likely M365)', ecosystem: 'microsoft' },
  { test: /zoho/i, provider: 'Zoho Mail', ecosystem: 'other' },
];

const TIMEOUT_MS = 8_000;

// Resolve MX hosts via DNS-over-HTTPS (Google public resolver). This works in
// any environment with fetch (including Vercel serverless), where the native
// dns.resolveMx() can be refused/blocked (ECONNREFUSED).
async function resolveMxViaDoH(domain: string): Promise<string[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: controller.signal, headers: { Accept: 'application/dns-json' } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      Answer?: { type: number; data: string }[];
    };
    if (!data.Answer) return [];
    // type 15 = MX. data is "<priority> <exchange>." — strip priority + trailing dot.
    return data.Answer.filter((a) => a.type === 15).map((a) =>
      a.data
        .replace(/^\d+\s+/, '')
        .replace(/\.$/, '')
        .toLowerCase(),
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Fallback to the native resolver (works in normal Node environments).
async function resolveMxNative(domain: string): Promise<string[] | null> {
  try {
    const records = await dns.resolveMx(domain);
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange.toLowerCase());
  } catch {
    return null;
  }
}

export async function runMXRecord(domain: string): Promise<MXRecordResult> {
  // Prefer DoH (portable); fall back to the native resolver.
  let hosts = await resolveMxViaDoH(domain);
  if (hosts === null) hosts = await resolveMxNative(domain);
  if (hosts === null) hosts = [];

  for (const match of PROVIDERS) {
    if (hosts.some((h) => match.test.test(h))) {
      return { records: hosts, provider: match.provider, ecosystem: match.ecosystem };
    }
  }

  return {
    records: hosts,
    provider: hosts.length ? 'Unknown' : 'None',
    ecosystem: 'unknown',
  };
}
