import type { CrtshResult } from '@/types/scan';

// crt.sh is notoriously slow and routinely needs >8s; give it more headroom
// before falling back to null.
const TIMEOUT_MS = 15_000;
const INTERESTING = [
  'app',
  'portal',
  'crm',
  'api',
  'admin',
  'client',
  'booking',
  'hub',
  'dashboard',
];

interface CrtshEntry {
  name_value?: string;
  common_name?: string;
}

export async function runCrtsh(domain: string): Promise<CrtshResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as CrtshEntry[];

    const names = new Set<string>();
    for (const entry of data) {
      const raw = `${entry.name_value ?? ''}\n${entry.common_name ?? ''}`;
      for (const n of raw.split('\n')) {
        const name = n.trim().toLowerCase();
        if (!name || name.startsWith('*.')) continue;
        if (name.endsWith(domain.toLowerCase())) names.add(name);
      }
    }

    const subdomains = [...names].sort();
    const interestingSubdomains = subdomains.filter((s) => {
      const label = s.replace(`.${domain.toLowerCase()}`, '').split('.')[0];
      return INTERESTING.includes(label);
    });

    return {
      subdomains,
      interestingSubdomains,
      hasClientPortal: interestingSubdomains.some((s) =>
        /(portal|client|app|hub|dashboard)\./.test(s),
      ),
      hasApiSubdomain: interestingSubdomains.some((s) => /(^|\.)api\./.test(s)),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
