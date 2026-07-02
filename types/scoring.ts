// Scoring + opportunity types.

export interface ScoreSet {
  aeo: number; // Answer Engine Optimisation 0-10
  geo: number; // Generative Engine Optimisation 0-10
  readiness: number; // AI Readiness 0-10
  opportunity: number; // AI Opportunity 0-10
  icp: number; // ICP Fit 0-10
  signal: string; // human-readable headline signal
}

export type OpportunityImpact = 'HIGH' | 'MED' | 'LOW';

export type OpportunityCategory =
  | 'Marketing'
  | 'Sales'
  | 'Operations'
  | 'Quick Win';

export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  impact: OpportunityImpact;
  body: string;
  offer: string;
}
