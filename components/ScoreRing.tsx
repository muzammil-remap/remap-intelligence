'use client';

import { useEffect, useState } from 'react';
import { T, scoreColor } from '@/lib/constants';

interface ScoreRingProps {
  value: number; // 0-10
  label: string;
  size?: number;
}

export default function ScoreRing({ value, label, size = 56 }: ScoreRingProps) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, value)) / 10;
  const color = scoreColor(value);

  // Animate from full offset (empty) to target on mount.
  const [offset, setOffset] = useState(circumference);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setOffset((1 - pct) * circumference);
    });
    return () => cancelAnimationFrame(id);
  }, [pct, circumference]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={T.pillBg}
            strokeWidth={6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: size * 0.3, fontWeight: 700, color }}>{value}</span>
          <span style={{ fontSize: 9, color: T.textMuted }}>/10</span>
        </div>
      </div>
      <span
        className="micro-label"
        style={{ color: T.textSecondary, textAlign: 'center' }}
      >
        {label}
      </span>
    </div>
  );
}
