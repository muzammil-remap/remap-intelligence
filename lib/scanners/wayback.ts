import type { WaybackResult } from '@/types/scan';

const TIMEOUT_MS = 8_000;

export async function runWayback(domain: string): Promise<WaybackResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url =
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}` +
      `&output=json&fl=timestamp&limit=1&collapse=timestamp:4`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = (await res.json()) as string[][];
    // First row is a header (["timestamp"]); the data row holds the value.
    const row = data.find((r, i) => i > 0 && r[0]);
    const ts = row?.[0];
    if (!ts || ts.length < 4) {
      return { firstSeenYear: null, domainAgeYears: null };
    }

    const firstSeenYear = parseInt(ts.slice(0, 4), 10);
    if (Number.isNaN(firstSeenYear)) {
      return { firstSeenYear: null, domainAgeYears: null };
    }
    const currentYear = new Date().getFullYear();
    return {
      firstSeenYear,
      domainAgeYears: Math.max(0, currentYear - firstSeenYear),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
