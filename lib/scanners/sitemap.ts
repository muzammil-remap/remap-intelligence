import { parseStringPromise } from 'xml2js';
import type { SitemapResult } from '@/types/scan';

const TIMEOUT_MS = 8_000;
const MAX_URLS = 5_000;
const MAX_CHILD_SITEMAPS = 50;

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'REMAP-Intelligence/1.0 (+https://intelligence.remap.ai)',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function locsFromParsed(parsed: unknown): { urls: string[]; childSitemaps: string[] } {
  const urls: string[] = [];
  const childSitemaps: string[] = [];
  const root = parsed as Record<string, unknown> | null;
  if (!root) return { urls, childSitemaps };

  // urlset → page URLs
  const urlset = root.urlset as { url?: Array<{ loc?: string[] }> } | undefined;
  if (urlset?.url) {
    for (const u of urlset.url) {
      const loc = u.loc?.[0];
      if (loc) urls.push(loc);
    }
  }

  // sitemapindex → child sitemaps
  const index = root.sitemapindex as
    | { sitemap?: Array<{ loc?: string[] }> }
    | undefined;
  if (index?.sitemap) {
    for (const s of index.sitemap) {
      const loc = s.loc?.[0];
      if (loc) childSitemaps.push(loc);
    }
  }

  return { urls, childSitemaps };
}

async function discoverSitemapUrls(domain: string): Promise<string[]> {
  const candidates = new Set<string>();

  // 1. robots.txt
  const robots = await fetchText(`https://${domain}/robots.txt`);
  if (robots) {
    for (const line of robots.split('\n')) {
      const m = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (m) candidates.add(m[1].trim());
    }
  }

  // 2. Common fallbacks
  candidates.add(`https://${domain}/sitemap.xml`);
  candidates.add(`https://${domain}/sitemap_index.xml`);

  return [...candidates];
}

export async function runSitemap(domain: string): Promise<SitemapResult> {
  const empty: SitemapResult = {
    found: false,
    totalPages: 0,
    hasBlog: false,
    hasFAQ: false,
    hasTeamPage: false,
    sources: [],
  };

  const sitemapUrls = await discoverSitemapUrls(domain);
  const allPageUrls: string[] = [];
  const usedSources: string[] = [];
  let childCount = 0;

  for (const sitemapUrl of sitemapUrls) {
    if (allPageUrls.length >= MAX_URLS) break;
    const xml = await fetchText(sitemapUrl);
    if (!xml) continue;

    let parsed: unknown;
    try {
      parsed = await parseStringPromise(xml);
    } catch {
      continue;
    }

    usedSources.push(sitemapUrl);
    const { urls, childSitemaps } = locsFromParsed(parsed);
    allPageUrls.push(...urls);

    // Level 2: fetch child sitemaps from an index file.
    for (const child of childSitemaps) {
      if (childCount >= MAX_CHILD_SITEMAPS || allPageUrls.length >= MAX_URLS) break;
      childCount++;
      const childXml = await fetchText(child);
      if (!childXml) continue;
      try {
        const childParsed = await parseStringPromise(childXml);
        const { urls: childUrls } = locsFromParsed(childParsed);
        allPageUrls.push(...childUrls);
      } catch {
        // skip malformed child
      }
    }
  }

  if (allPageUrls.length === 0 && usedSources.length === 0) {
    return empty;
  }

  const capped = allPageUrls.slice(0, MAX_URLS);
  const lower = capped.map((u) => u.toLowerCase());

  return {
    found: true,
    totalPages: capped.length,
    hasBlog: lower.some((u) => /\/(blog|news|insights)\//.test(u)),
    hasFAQ: lower.some((u) => /\/(faq|questions)\//.test(u)),
    hasTeamPage: lower.some((u) => /\/(team|about)\//.test(u)),
    sources: usedSources,
  };
}
