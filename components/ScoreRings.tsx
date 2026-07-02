'use client';

import ScoreRing from './ScoreRing';
import { SCORE_LABELS } from '@/lib/constants';
import type { ScoreSet } from '@/types/scoring';

export default function ScoreRings({ scores }: { scores: ScoreSet }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      {SCORE_LABELS.map(({ key, label }) => (
        <ScoreRing
          key={key}
          value={(scores as unknown as Record<string, number>)[key]}
          label={label}
        />
      ))}
    </div>
  );
}
