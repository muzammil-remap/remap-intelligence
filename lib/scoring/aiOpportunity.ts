import type { ScanRecord } from '@/types/scan';

const hasAny = (list: string[], targets: string[]): boolean =>
  targets.some((t) => list.includes(t));

// AI Opportunity (inverse). Start at 10, deduct for existing automation,
// add back for confirmed manual tasks. Floor 1, ceiling 10.
export function aiOpportunityScore(scan: ScanRecord): number {
  let score = 10;
  const tech = scan.scan_homepage?.techSignals ?? [];

  if (hasAny(tech, ['Intercom', 'Drift', 'Crisp', 'Zendesk'])) score -= 1;
  if (hasAny(tech, ['Mailchimp', 'ActiveCampaign', 'Klaviyo'])) score -= 1;
  if (hasAny(tech, ['HubSpot', 'Salesforce', 'Pipedrive'])) score -= 1;

  const count = scan.checkbox_selections?.length ?? 0;
  if (count >= 10) score = Math.min(10, score + 2);
  if (count >= 15) score = Math.min(10, score + 1);

  return Math.max(1, score);
}
