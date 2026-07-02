import type { HomepageScanResult } from '@/types/scan';

// Tech detection — check script srcs, link hrefs, meta tags, inline content.
const TECH_FINGERPRINTS: Record<string, string[]> = {
  WordPress: ['/wp-content/', '/wp-includes/', 'wp-json'],
  Shopify: ['cdn.shopify.com', 'shopify.com/s/files'],
  Wix: ['wix.com', 'wixstatic.com'],
  Squarespace: ['squarespace.com', 'sqspcdn.com'],
  Webflow: ['webflow.com', 'uploads-ssl.webflow.com'],
  HubSpot: ['js.hubspot.com', 'hs-scripts.com'],
  Salesforce: ['salesforce.com', 'force.com'],
  Pipedrive: ['pipedrive.com'],
  Intercom: ['widget.intercom.io'],
  Zendesk: ['zdassets.com', 'zendesk.com'],
  Mailchimp: ['chimpstatic.com', 'mailchimp.com'],
  ActiveCampaign: ['activecampaign.com'],
  Klaviyo: ['klaviyo.com', 'a.klaviyo.com'],
  'Google Tag Manager': ['googletagmanager.com'],
  'Google Analytics': ['google-analytics.com'],
  'Facebook Pixel': ['connect.facebook.net'],
  Stripe: ['js.stripe.com'],
  Calendly: ['calendly.com'],
  Crisp: ['crisp.chat'],
  Drift: ['js.drift.com'],
  'REX Software': ['cdn.rexsoftware.com', 'rexsoftware.com'],
  Elementor: ['elementor'],
};

const FETCH_TIMEOUT_MS = 10_000;

async function fetchHtml(url: string): Promise<{ html: string; status: number } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Identify as a normal browser to avoid trivial bot blocks.
        'User-Agent':
          'Mozilla/5.0 (compatible; REMAP-Intelligence/1.0; +https://intelligence.remap.ai)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const html = await res.text();
    return { html, status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>();
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of blocks) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      collectTypes(parsed, types);
    } catch {
      // Fall back to a regex sweep for "@type" if JSON is malformed.
      const t = raw.matchAll(/"@type"\s*:\s*"([^"]+)"/g);
      for (const tm of t) types.add(tm[1]);
    }
  }
  return [...types];
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') out.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.add(x));
    if (Array.isArray(obj['@graph'])) collectTypes(obj['@graph'], out);
  }
}

function extractMetaDescription(html: string): string | null {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
  );
  return m ? m[1].trim() : null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().slice(0, 200) : null;
}

function extractSocialLinks(html: string): string[] {
  const links = new Set<string>();
  const hrefs = html.matchAll(/href=["']([^"']+)["']/gi);
  for (const h of hrefs) {
    const url = h[1];
    if (/(linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com)/i.test(url)) {
      links.add(url);
    }
  }
  return [...links];
}

function extractLinkedinCompany(socialLinks: string[]): string | null {
  const found = socialLinks.find((l) => /linkedin\.com\/company\//i.test(l));
  return found ?? null;
}

function extractPhones(html: string): string[] {
  // Strip tags to text first to reduce false positives from markup.
  const text = html.replace(/<[^>]+>/g, ' ');
  const phones = new Set<string>();
  const matches = text.matchAll(
    /(\+?\d[\d\s().-]{7,}\d)/g,
  );
  for (const m of matches) {
    const digits = m[1].replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) phones.add(m[1].trim());
  }
  return [...phones].slice(0, 5);
}

export async function runHomepageScan(
  domain: string,
): Promise<HomepageScanResult> {
  const result = await fetchHtml(`https://${domain}`);

  if (!result) {
    return {
      fetched: false,
      statusCode: null,
      techSignals: [],
      schemaTypes: [],
      hasLocalBusinessSchema: false,
      hasFAQSchema: false,
      hasOpenGraph: false,
      hasFAQContent: false,
      metaDescription: null,
      socialLinks: [],
      linkedinCompanyUrl: null,
      phoneNumbers: [],
      title: null,
    };
  }

  const { html, status } = result;
  const haystack = html.toLowerCase();

  const techSignals: string[] = [];
  for (const [tech, fingerprints] of Object.entries(TECH_FINGERPRINTS)) {
    if (fingerprints.some((fp) => haystack.includes(fp.toLowerCase()))) {
      techSignals.push(tech);
    }
  }

  const schemaTypes = extractSchemaTypes(html);
  const lowerTypes = schemaTypes.map((t) => t.toLowerCase());
  const socialLinks = extractSocialLinks(html);

  return {
    fetched: true,
    statusCode: status,
    techSignals,
    schemaTypes,
    hasLocalBusinessSchema: lowerTypes.includes('localbusiness'),
    hasFAQSchema: lowerTypes.includes('faqpage'),
    hasOpenGraph: /<meta[^>]+property=["']og:/i.test(html),
    hasFAQContent: /faq|frequently asked/i.test(html),
    metaDescription: extractMetaDescription(html),
    socialLinks,
    linkedinCompanyUrl: extractLinkedinCompany(socialLinks),
    phoneNumbers: extractPhones(html),
    title: extractTitle(html),
  };
}
