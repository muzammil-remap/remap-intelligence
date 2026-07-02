import type { ScanRecord, ScanAnswers, RoutingDecision } from '@/types/scan';
import type {
  ScoreSet,
  Opportunity,
  OpportunityImpact,
} from '@/types/scoring';

// Parse the answer columns off a ScanRecord into a normalised shape.
export function parseAnswers(scan: ScanRecord): ScanAnswers {
  let q3: string[] = [];
  if (scan.q3_acquisition_source) {
    try {
      const parsed = JSON.parse(scan.q3_acquisition_source);
      if (Array.isArray(parsed)) q3 = parsed.map(String);
    } catch {
      // Legacy comma-joined fallback.
      q3 = scan.q3_acquisition_source.split(',').map((s) => s.trim());
    }
  }
  return {
    q1: scan.q1_growth_challenge ?? undefined,
    q2Current: scan.q2_current_clients ?? undefined,
    q2Capacity: scan.q2_capacity ?? undefined,
    q3,
    q4: scan.q4_database_frequency ?? undefined,
    q5: scan.q5_ai_policy ?? undefined,
  };
}

interface OppDef {
  id: string;
  title: string;
  cat: Opportunity['category'];
  impact: OpportunityImpact;
  body: string;
  offer: string;
  check: (s: ScoreSet, scan: ScanRecord, ans: ScanAnswers) => boolean;
}

const techHasAny = (scan: ScanRecord, targets: string[]): boolean => {
  const tech = scan.scan_homepage?.techSignals ?? [];
  return targets.some((t) => tech.includes(t));
};

const OPPORTUNITY_MAP: OppDef[] = [
  {
    id: 'aeo-gap',
    check: (s) => s.aeo <= 4,
    title: 'AI Search Invisibility',
    cat: 'Marketing',
    impact: 'HIGH',
    body: 'Your business is not being found by AI search engines. Without structured data, schema markup and answer-ready content, tools like ChatGPT, Perplexity and Google AI Overviews cannot surface you — meaning you are invisible exactly where buyers are increasingly starting their research.',
    offer: 'AEO restructure + schema implementation',
  },
  {
    id: 'no-crm',
    check: (_s, scan) =>
      !techHasAny(scan, ['HubSpot', 'Salesforce', 'Pipedrive']),
    title: 'No Pipeline Visibility',
    cat: 'Sales',
    impact: 'HIGH',
    body: 'No CRM was detected — which means sales activity is likely tracked manually across inboxes, spreadsheets and memory. This caps your ability to forecast, follow up reliably, and layer any AI automation on top of a clean pipeline.',
    offer: 'CRM implementation as AI foundation',
  },
  {
    id: 'dormant-db',
    check: (_s, _scan, ans) =>
      !!ans.q4 &&
      (ans.q4.includes('Rarely') || ans.q4.includes('No consolidated')),
    title: 'Dormant Revenue Asset',
    cat: 'Marketing',
    impact: 'HIGH',
    body: 'Your existing database is your highest-ROI lead source, yet it is rarely being contacted at scale. Re-engaging past and dormant contacts with AI-assisted sequences typically unlocks revenue that is already sitting in your CRM.',
    offer: 'Lead revitalisation + AI email sequences',
  },
  {
    id: 'no-email-auto',
    check: (_s, scan) =>
      !techHasAny(scan, ['Mailchimp', 'ActiveCampaign', 'Klaviyo']),
    title: 'No Marketing Automation',
    cat: 'Marketing',
    impact: 'MED',
    body: 'No email automation platform was detected. Nurture, onboarding and re-engagement are likely being sent manually — or not at all. Automated, AI-generated sequences keep you front of mind without consuming team time.',
    offer: 'Email automation setup + AI-generated sequences',
  },
  {
    id: 'no-ai-policy',
    check: (_s, _scan, ans) =>
      !!ans.q5 &&
      (ans.q5.includes('None at all') || ans.q5.includes("don't allow")),
    title: 'AI Governance Gap',
    cat: 'Operations',
    impact: 'MED',
    body: 'No AI usage guidelines are in place. Brand, data and compliance risk grows as your team adopts tools ad-hoc. A lightweight policy plus enablement lets you capture the upside of AI while keeping control.',
    offer: 'AI policy + team enablement framework',
  },
  {
    id: 'google-ai',
    check: (_s, scan) => scan.scan_mx_record?.ecosystem === 'google',
    title: 'Untapped Google AI Licence',
    cat: 'Quick Win',
    impact: 'MED',
    body: 'Google Workspace was detected — which means Gemini AI features are likely already included in your plan at no extra cost. Most teams never switch them on. This is immediate value you have already paid for.',
    offer: 'Activate Gemini for Workspace',
  },
  {
    id: 'microsoft-copilot',
    check: (_s, scan) => scan.scan_mx_record?.ecosystem === 'microsoft',
    title: 'Untapped Microsoft Copilot',
    cat: 'Quick Win',
    impact: 'MED',
    body: 'Microsoft 365 was detected — Copilot may already be available on your licence. Activating and training the team on it is often the fastest, lowest-risk AI win available to you.',
    offer: 'Activate Microsoft 365 Copilot',
  },
  {
    id: 'capacity-constrained',
    check: (_s, _scan, ans) => {
      const current = parseInt(ans.q2Current || '0', 10);
      const capacity = parseInt(ans.q2Capacity || '0', 10);
      return capacity > 0 && current > 0 && current / capacity >= 0.85;
    },
    title: 'At Capacity — Operations Priority',
    cat: 'Operations',
    impact: 'HIGH',
    body: 'You are at or near client capacity. That means growth no longer comes from more leads — it comes from operational efficiency. Automating delivery and admin frees the capacity needed to take on more without hiring.',
    offer: 'Operational efficiency audit + automation roadmap',
  },
];

const IMPACT_RANK: Record<OpportunityImpact, number> = {
  HIGH: 0,
  MED: 1,
  LOW: 2,
};

export function computeOpportunities(
  scan: ScanRecord,
  scores: ScoreSet,
): Opportunity[] {
  const ans = parseAnswers(scan);

  const matched: Opportunity[] = OPPORTUNITY_MAP.filter((o) =>
    o.check(scores, scan, ans),
  ).map((o) => ({
    id: o.id,
    title: o.title,
    category: o.cat,
    impact: o.impact,
    body: o.body,
    offer: o.offer,
  }));

  matched.sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact]);
  return matched;
}

// Decide growth vs efficiency routing from the Q2 capacity answer.
export function computeRouting(scan: ScanRecord): RoutingDecision {
  const ans = parseAnswers(scan);
  const current = parseInt(ans.q2Current || '0', 10);
  const capacity = parseInt(ans.q2Capacity || '0', 10);
  if (capacity <= 0 || current <= 0) return 'unknown';
  return current / capacity >= 0.85 ? 'efficiency' : 'growth';
}
