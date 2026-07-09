'use client';

import { useEffect, useState } from 'react';
import { T } from '@/lib/constants';

// The 7 scan sources shown while the backend scan runs. The checklist is
// cosmetic pacing (the real scan finishes server-side regardless) — items
// resolve on a timer so the user sees steady motion while answering.
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
const TOTAL_QUESTIONS = 5;

interface JourneyRailProps {
  // True once the user has hit Initiate — details step done, scan animates.
  initiated: boolean;
  // How many of the 5 questions are answered.
  answered: number;
  // True once Q5 is answered and the manual-tasks checklist is showing.
  checklistReached: boolean;
  // True while the final submit is in flight / navigating to completion.
  compiling: boolean;
}

type StepState = 'idle' | 'active' | 'done';

export default function JourneyRail({
  initiated,
  answered,
  checklistReached,
  compiling,
}: JourneyRailProps) {
  // How many of the scan items have resolved (cosmetic sequential timer).
  const [resolved, setResolved] = useState(0);

  useEffect(() => {
    if (!initiated) return;
    if (resolved >= SCAN_ITEMS.length) return;
    const id = setTimeout(() => setResolved((n) => n + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [initiated, resolved]);

  const scanDone = resolved >= SCAN_ITEMS.length;
  const questionsDone = answered >= TOTAL_QUESTIONS;

  const steps: {
    label: string;
    meta?: string;
    state: StepState;
    sub?: React.ReactNode;
  }[] = [
    {
      label: 'Your details',
      meta: initiated ? undefined : 'Name, email & website',
      state: initiated ? 'done' : 'active',
    },
    {
      label: 'Website scan',
      meta: !initiated
        ? '11 data sources'
        : scanDone
          ? 'All sources analysed'
          : `${resolved} of ${SCAN_ITEMS.length} sources`,
      state: !initiated ? 'idle' : scanDone ? 'done' : 'active',
      sub: initiated ? (
        <ul className="rail-sub">
          {SCAN_ITEMS.map((item, i) => {
            const done = i < resolved;
            const active = i === resolved && !scanDone;
            return (
              <li
                key={item}
                className={`rail-sub-item${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="rail-sub-node">{done && <SubCheck />}</span>
                <span className="rail-sub-label">{item}</span>
              </li>
            );
          })}
        </ul>
      ) : undefined,
    },
    {
      label: 'Five quick questions',
      meta: !initiated
        ? 'Answer while we scan'
        : questionsDone
          ? 'All answered'
          : `${answered} of ${TOTAL_QUESTIONS} answered`,
      state: !initiated ? 'idle' : questionsDone ? 'done' : 'active',
      sub: initiated && !questionsDone ? <QuestionDots answered={answered} /> : undefined,
    },
    {
      label: 'Manual work checklist',
      meta: 'What your team still does by hand',
      state: compiling ? 'done' : checklistReached ? 'active' : 'idle',
    },
    {
      label: 'Compile & deliver',
      meta: 'Scored PDF report to your inbox',
      state: compiling ? 'active' : 'idle',
    },
  ];

  // Progress: 1 (details) + 7 (scan) + 5 (questions) + 1 (checklist submit).
  const totalUnits = 1 + SCAN_ITEMS.length + TOTAL_QUESTIONS + 1;
  const doneUnits =
    (initiated ? 1 : 0) + resolved + answered + (compiling ? 1 : 0);
  const pct = Math.round((doneUnits / totalUnits) * 100);

  const busy = initiated && (!scanDone || compiling);
  const status = compiling
    ? 'Compiling your report…'
    : !initiated
      ? 'Awaiting initiation'
      : !scanDone
        ? 'Scanning your web presence…'
        : checklistReached
          ? 'One last step'
          : 'Scan complete — keep answering';

  return (
    <aside className="journey-left rail remap-card" aria-label="Progress">
      <div className="rail-head">
        {busy && <span className="pulse-dot" />}
        <span
          className="micro-label"
          style={{ color: initiated ? T.textSecondary : T.textMuted }}
        >
          {status}
        </span>
        <span className="rail-pct">{pct}%</span>
      </div>

      <div className="rail-bar">
        <div className="rail-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <ol className="rail-steps">
        {steps.map((step, i) => (
          <li
            key={step.label}
            className={`rail-step is-${step.state}`}
          >
            <div className="rail-node-col">
              <span className="rail-node">
                {step.state === 'done' ? (
                  <NodeCheck />
                ) : step.state === 'active' ? (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: T.orange,
                    }}
                  />
                ) : (
                  i + 1
                )}
              </span>
              {i < steps.length - 1 && <span className="rail-conn" />}
            </div>
            <div className="rail-step-body">
              <span className="rail-step-label">{step.label}</span>
              {step.meta && <span className="rail-step-meta">{step.meta}</span>}
              {step.sub}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

// pathLength=1 lets the stroke-dashoffset draw-in animation in globals.css
// work regardless of the path's real length.
function NodeCheck() {
  return (
    <svg className="rail-check" viewBox="0 0 24 24" aria-hidden>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" pathLength={1} />
    </svg>
  );
}

function SubCheck() {
  return (
    <svg className="rail-sub-check" viewBox="0 0 24 24" aria-hidden>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" pathLength={1} />
    </svg>
  );
}

// Five dots that fill in as questions are answered.
function QuestionDots({ answered }: { answered: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
        <span
          key={i}
          style={{
            width: 18,
            height: 5,
            borderRadius: 99,
            background: i < answered ? T.orange : T.pillBg,
            border: i < answered ? 'none' : `1px solid ${T.borderSubtle}`,
            transition: 'background 300ms ease',
          }}
        />
      ))}
    </div>
  );
}
