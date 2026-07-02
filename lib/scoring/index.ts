import type { ScanRecord } from '@/types/scan';
import type { ScoreSet } from '@/types/scoring';
import { aeoScore } from './aeoScore';
import { geoScore } from './geoScore';
import { aiReadinessScore } from './aiReadiness';
import { aiOpportunityScore } from './aiOpportunity';
import { icpFitScore } from './icpFit';

// Color thresholds per the design system.
export function scoreColor(n: number): string {
  if (n <= 3) return '#ef4444'; // red
  if (n <= 5) return '#f59e0b'; // amber
  if (n <= 7) return '#3b82f6'; // blue
  return '#22c55e'; // green
}

// Build a one-line signal headline from readiness vs opportunity.
function buildSignal(readiness: number, opportunity: number): string {
  const lowReadiness = readiness <= 4;
  const highOpportunity = opportunity >= 7;

  if (highOpportunity && lowReadiness) {
    return 'High opportunity against low readiness — strong upside with foundational gaps to close first.';
  }
  if (highOpportunity && !lowReadiness) {
    return 'Solid foundation with significant untapped automation opportunity.';
  }
  if (!highOpportunity && lowReadiness) {
    return 'Early-stage AI maturity — quick foundational wins available.';
  }
  return 'Mature setup — opportunity lies in optimisation and scale.';
}

export function computeAllScores(scan: ScanRecord): ScoreSet {
  const aeo = aeoScore(scan);
  const geo = geoScore(scan);
  const readiness = aiReadinessScore(scan);
  const opportunity = aiOpportunityScore(scan);
  const icp = icpFitScore(scan);

  return {
    aeo,
    geo,
    readiness,
    opportunity,
    icp,
    signal: buildSignal(readiness, opportunity),
  };
}
