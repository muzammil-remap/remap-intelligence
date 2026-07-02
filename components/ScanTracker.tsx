'use client';

import { useEffect, useState } from 'react';
import { T } from '@/lib/constants';

const SCAN_ITEMS = [
  'Website & tech stack',
  'Google Business Profile',
  'LinkedIn presence',
  'Paid advertising activity',
  'Domain history & authority',
  'Email infrastructure',
  'Performance & SEO signals',
];

const STEP_MS = 950;

interface ScanTrackerProps {
  // True once the user has hit Initiate — only then does the scan animate.
  active: boolean;
  // True once all questions + checkboxes are submitted.
  questionsComplete: boolean;
}

export default function ScanTracker({ active, questionsComplete }: ScanTrackerProps) {
  // How many of the 7 scan items have resolved.
  const [resolved, setResolved] = useState(0);

  useEffect(() => {
    if (!active) return; // don't start scanning until Initiate is pressed
    if (resolved >= SCAN_ITEMS.length) return;
    const id = setTimeout(() => setResolved((n) => n + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [active, resolved]);

  const totalItems = SCAN_ITEMS.length + 1; // +1 for "Your questions"
  const doneCount = resolved + (questionsComplete ? 1 : 0);
  const progress = Math.round((doneCount / totalItems) * 100);

  return (
    <div className="scan-left remap-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {active && resolved < SCAN_ITEMS.length && (
          <span style={{ position: 'relative', width: 10, height: 10 }}>
            <span
              className="pulse-ring"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: T.orange,
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: T.orange,
              }}
            />
          </span>
        )}
        <span
          className="micro-label"
          style={{
            color: active ? T.textSecondary : T.textMuted,
            fontSize: active ? undefined : 10,
          }}
        >
          {!active
            ? 'Awaiting initiation'
            : resolved < SCAN_ITEMS.length
              ? 'Scanning…'
              : 'Scan complete'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: 'rgba(148,163,184,0.08)',
          borderRadius: 99,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #f97316, #fbbf24)',
            boxShadow: progress > 0 ? '0 0 8px rgba(249,115,22,0.4)' : 'none',
            transition: 'width 500ms ease',
          }}
        />
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SCAN_ITEMS.map((item, i) => {
          const done = i < resolved;
          return <Item key={item} label={item} done={done} active={active && i === resolved} />;
        })}
        <Item label="Your questions" done={questionsComplete} active={active && !questionsComplete && resolved >= SCAN_ITEMS.length} />
      </ul>
    </div>
  );
}

function Item({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: done ? T.green : T.textMuted,
          background: done ? 'rgba(74,222,128,0.15)' : 'transparent',
          border: done
            ? 'none'
            : `1.5px solid ${active ? T.orange : 'rgba(148,163,184,0.2)'}`,
          transition: 'all 250ms ease',
        }}
      >
        {done ? '✓' : ''}
      </span>
      <span
        style={{
          fontSize: 13,
          color: done ? T.textPrimary : active ? T.textSecondary : T.textMuted,
          transition: 'color 250ms ease',
        }}
      >
        {label}
      </span>
    </li>
  );
}
