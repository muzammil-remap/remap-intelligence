// Industry classification types. MVP keeps this lightweight — industry detection
// is a Phase 2 concern (Apollo enrichment), so for now `industry_key` is usually null.

export type IndustryKey =
  | 'real_estate'
  | 'professional_services'
  | 'trades'
  | 'health'
  | 'ecommerce'
  | 'hospitality'
  | 'finance'
  | 'unknown';

export interface IndustryProfile {
  key: IndustryKey;
  label: string;
}

export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  real_estate: 'Real Estate',
  professional_services: 'Professional Services',
  trades: 'Trades & Construction',
  health: 'Health & Wellness',
  ecommerce: 'E-commerce',
  hospitality: 'Hospitality',
  finance: 'Finance',
  unknown: 'General Business',
};
