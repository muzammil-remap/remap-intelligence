'use client';

import { useState } from 'react';
import { T } from '@/lib/constants';
import type { Opportunity } from '@/types/scoring';

function impactColor(impact: Opportunity['impact']): string {
  if (impact === 'HIGH') return T.green;
  if (impact === 'MED') return T.amber;
  return T.textMuted;
}

export default function OppRow({
  opportunity,
  index,
}: {
  opportunity: Opportunity;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const color = impactColor(opportunity.impact);

  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 10,
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${T.borderSubtle}`,
        borderLeftWidth: 3,
        borderLeftColor: color,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
          color: T.textPrimary,
        }}
      >
        <span style={{ color: T.textMuted, fontSize: 13, fontWeight: 600, width: 24 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>
          {opportunity.title}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#fff',
            background: color,
            borderRadius: 4,
            padding: '3px 7px',
          }}
        >
          {opportunity.impact}
        </span>
        <span
          style={{
            fontSize: 11,
            color: T.textSecondary,
            border: `1px solid ${T.borderVisible}`,
            borderRadius: 99,
            padding: '2px 9px',
          }}
        >
          {opportunity.category}
        </span>
        <span
          style={{
            color: T.textMuted,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px 52px' }}>
          <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.55, margin: '0 0 8px' }}>
            {opportunity.body}
          </p>
          <p style={{ fontSize: 13.5, color: T.textPrimary, margin: 0 }}>
            <span style={{ color: T.orange, fontWeight: 600 }}>REMAP can:</span>{' '}
            {opportunity.offer}
          </p>
        </div>
      )}
    </div>
  );
}
