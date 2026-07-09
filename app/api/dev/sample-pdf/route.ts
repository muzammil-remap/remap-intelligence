import { NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf/generatePDF';
import type { ScanRecord } from '@/types/scan';
import type { ScoreSet, Opportunity } from '@/types/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DEV-ONLY: renders a sample report PDF for visual QA of the design.
// Guarded behind DEV_MODE so it never exists in production.
export async function GET() {
  if (!process.env.DEV_MODE) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const scan = {
    id: 'test',
    domain: 'https://remap.ai',
    clean_domain: 'remap.ai',
    contact_name: 'Andrew',
    contact_email: 'a@remap.ai',
    competitor_domain: 'competitor.com',
    status: 'complete',
    scan_homepage: {
      fetched: true,
      statusCode: 200,
      techSignals: ['WordPress', 'Mailchimp', 'Google Tag Manager', 'Calendly'],
      schemaTypes: ['Organization', 'WebSite'],
      hasLocalBusinessSchema: false,
      hasFAQSchema: false,
      hasOpenGraph: true,
      hasFAQContent: false,
      metaDescription: 'AI automation agency',
      socialLinks: [],
      linkedinCompanyUrl: null,
      phoneNumbers: [],
      title: 'Remap AI | AI Automation Agency',
    },
    scan_mx_record: {
      records: ['aspmx.l.google.com'],
      provider: 'Google Workspace',
      ecosystem: 'google',
    },
    scan_sitemap: {
      found: true,
      totalPages: 194,
      hasBlog: true,
      hasFAQ: false,
      hasTeamPage: true,
      sources: [],
    },
    scan_crtsh: {
      subdomains: [],
      interestingSubdomains: ['app.remap.ai', 'portal.remap.ai'],
      hasClientPortal: true,
      hasApiSubdomain: false,
    },
    scan_wayback: { firstSeenYear: 2021, domainAgeYears: 5 },
    scan_apollo: null,
    scan_wappalyzer: null,
    scan_google_places: null,
    scan_pagespeed: null,
    scan_meta_ads: null,
    scan_proxycurl: null,
    q1_growth_challenge: 'Too much manual admin, cannot scale without hiring.',
    q2_current_clients: '8',
    q2_capacity: '10',
    q3_acquisition_source: JSON.stringify(['Word of mouth & referrals']),
    q4_database_frequency: 'Rarely or never',
    q5_ai_policy: 'None at all',
    checkbox_selections: [
      'Invoicing',
      'Lead follow-up',
      'CRM data entry',
      'Writing content',
      'Email campaigns',
      'Scheduling',
      'Reporting prep',
    ],
    industry_key: null,
    scores: null,
    opportunities: null,
    routing_decision: null,
    pdf_url: null,
    pdf_generated_at: null,
    email_sent_at: null,
    created_at: '2026-06-16T00:00:00Z',
    completed_at: null,
    error_message: null,
  } as unknown as ScanRecord;

  const scores: ScoreSet = {
    aeo: 4,
    geo: 5,
    readiness: 6,
    opportunity: 8,
    icp: 2,
    signal:
      'High opportunity against low readiness — strong upside with foundational gaps to close first.',
  };
  const opportunities: Opportunity[] = [
    {
      id: 'aeo-gap',
      title: 'AI Search Invisibility',
      category: 'Marketing',
      impact: 'HIGH',
      body: 'Your business is not being found by AI search engines.',
      offer: 'AEO restructure + schema implementation',
    },
    {
      id: 'dormant-db',
      title: 'Dormant Revenue Asset',
      category: 'Marketing',
      impact: 'HIGH',
      body: 'Your existing database is your highest-ROI lead source, yet rarely contacted.',
      offer: 'Lead revitalisation + AI email sequences',
    },
    {
      id: 'google-ai',
      title: 'Untapped Google AI Licence',
      category: 'Quick Win',
      impact: 'MED',
      body: 'Google Workspace detected — Gemini features likely already included.',
      offer: 'Activate Gemini for Workspace',
    },
  ];

  const buf = await generatePDF({ scan, scores, opportunities });
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="sample-report.pdf"',
    },
  });
}
