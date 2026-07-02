// Scan-related types for the REMAP Intelligence app.
// These mirror the Supabase `scans` table and the shapes returned by lib/scanners/*.

export type ScanStatus =
  | 'pending'
  | 'scanning'
  | 'questions_pending'
  | 'questions_received'
  | 'generating_pdf'
  | 'complete'
  | 'failed';

export type RoutingDecision = 'growth' | 'efficiency' | 'unknown';

// --- Individual scanner result shapes ---

export interface HomepageScanResult {
  fetched: boolean;
  statusCode: number | null;
  techSignals: string[];
  schemaTypes: string[];
  hasLocalBusinessSchema: boolean;
  hasFAQSchema: boolean;
  hasOpenGraph: boolean;
  hasFAQContent: boolean;
  metaDescription: string | null;
  socialLinks: string[];
  linkedinCompanyUrl: string | null;
  phoneNumbers: string[];
  title: string | null;
}

export type EmailEcosystem = 'google' | 'microsoft' | 'other' | 'unknown';

export interface MXRecordResult {
  records: string[];
  provider: string;
  ecosystem: EmailEcosystem;
}

export interface SitemapResult {
  found: boolean;
  totalPages: number;
  hasBlog: boolean;
  hasFAQ: boolean;
  hasTeamPage: boolean;
  sources: string[];
}

export interface CrtshResult {
  subdomains: string[];
  interestingSubdomains: string[];
  hasClientPortal: boolean;
  hasApiSubdomain: boolean;
}

export interface WaybackResult {
  firstSeenYear: number | null;
  domainAgeYears: number | null;
}

// Phase 2 scanners — typed but currently always null.
export type ApolloResult = null;
export type ApifyResult = null;
export type MetaAdsResult = null;
export type GooglePlacesResult = null;
export type PageSpeedResult = null;

// The aggregate result of runFullScan().
export interface FullScanResult {
  homepage: HomepageScanResult | null;
  mxRecord: MXRecordResult | null;
  sitemap: SitemapResult | null;
  crtsh: CrtshResult | null;
  wayback: WaybackResult | null;
  apollo: ApolloResult;
  apify: ApifyResult;
  metaAds: MetaAdsResult;
  googlePlaces: GooglePlacesResult;
  pageSpeed: PageSpeedResult;
}

// --- Answers submitted by the user ---

export interface ScanAnswers {
  q1?: string; // growth challenge
  q2Current?: string; // current clients/month
  q2Capacity?: string; // capacity/month
  q3?: string[]; // acquisition sources (multi)
  q4?: string; // database frequency
  q5?: string; // ai policy
}

// --- The full scan row as stored in Supabase ---

export interface ScanRecord {
  id: string;
  domain: string;
  clean_domain: string;
  contact_name: string | null;
  contact_email: string;
  competitor_domain: string | null;
  status: ScanStatus;

  scan_homepage: HomepageScanResult | null;
  scan_mx_record: MXRecordResult | null;
  scan_sitemap: SitemapResult | null;
  scan_crtsh: CrtshResult | null;
  scan_wayback: WaybackResult | null;
  scan_apollo: ApolloResult;
  scan_wappalyzer: unknown | null;
  scan_google_places: GooglePlacesResult;
  scan_pagespeed: PageSpeedResult;
  scan_meta_ads: MetaAdsResult;
  scan_proxycurl: unknown | null;

  q1_growth_challenge: string | null;
  q2_current_clients: string | null;
  q2_capacity: string | null;
  q3_acquisition_source: string | null; // JSON-encoded string[] OR comma-joined
  q4_database_frequency: string | null;
  q5_ai_policy: string | null;
  checkbox_selections: string[] | null;

  industry_key: string | null;
  scores: import('./scoring').ScoreSet | null;
  opportunities: import('./scoring').Opportunity[] | null;
  routing_decision: RoutingDecision | null;

  pdf_url: string | null;
  pdf_generated_at: string | null;
  email_sent_at: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// Mapped scanner-result keys → DB columns, used when persisting.
export interface ScanResultsForDb {
  scan_homepage: HomepageScanResult | null;
  scan_mx_record: MXRecordResult | null;
  scan_sitemap: SitemapResult | null;
  scan_crtsh: CrtshResult | null;
  scan_wayback: WaybackResult | null;
  scan_apollo: ApolloResult;
  scan_google_places: GooglePlacesResult;
  scan_pagespeed: PageSpeedResult;
  scan_meta_ads: MetaAdsResult;
}
