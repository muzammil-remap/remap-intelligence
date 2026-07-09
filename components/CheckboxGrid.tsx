'use client';

import { useState } from 'react';
import { T, MANUAL_TASK_GROUPS } from '@/lib/constants';

interface CheckboxGridProps {
  onSubmit: (selections: string[]) => void;
  submitting?: boolean;
}

export default function CheckboxGrid({ onSubmit, submitting }: CheckboxGridProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (task: string) =>
    setSelected((s) =>
      s.includes(task) ? s.filter((t) => t !== task) : [...s, task],
    );

  return (
    <div className="q-enter">
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '0 0 4px',
          color: T.textPrimary,
        }}
      >
        Before we finalise — which of these does your team handle manually?
      </h3>
      <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 18px' }}>
        &ldquo;Manually&rdquo; means a person does it, not a system. ·{' '}
        <span style={{ color: T.orange }}>{selected.length} selected</span>
      </p>

      {MANUAL_TASK_GROUPS.map((g) => (
        <div key={g.group} style={{ marginBottom: 18 }}>
          <p className="micro-label" style={{ color: T.textSecondary, marginBottom: 8 }}>
            {g.group}
          </p>
          <div className="check-grid">
            {g.tasks.map((task) => {
              const checked = selected.includes(task);
              return (
                <button
                  key={task}
                  onClick={() => toggle(task)}
                  style={{
                    textAlign: 'left',
                    padding: '11px 13px',
                    borderRadius: 10,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    background: checked ? T.orangeDim : T.pillBg,
                    border: `1px solid ${checked ? T.orange : T.borderSubtle}`,
                    color: checked ? T.textPrimary : T.textSecondary,
                    fontWeight: checked ? 500 : 400,
                  }}
                >
                  {task}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="remap-btn"
        onClick={() => onSubmit(selected)}
        disabled={submitting}
        style={{
          marginTop: 8,
          padding: '0 26px',
          fontSize: 15,
          cursor: submitting ? 'wait' : 'pointer',
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Compiling…' : 'Compile My Report →'}
      </button>
    </div>
  );
}
