'use client';

import { T } from '@/lib/constants';

// Decorative hero anchor: a "score dial" mock report card that reinforces the
// product (a scored AI readiness report). Pure CSS/SVG, theme-aware via T.
export default function HeroVisual() {
  const dims = [
    { label: 'AEO', v: 7 },
    { label: 'GEO', v: 5 },
    { label: 'AI Readiness', v: 8 },
    { label: 'Opportunity', v: 9 },
    { label: 'ICP Fit', v: 6 },
  ];

  return (
    <div
      className="remap-card"
      style={{
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* soft glow behind the ring */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: T.orangeDim,
          filter: 'blur(40px)',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          position: 'relative',
        }}
      >
        <span className="micro-label" style={{ color: T.textMuted }}>
          Sample report
        </span>
        <span className="micro-label" style={{ color: T.green }}>
          ● Live
        </span>
      </div>

      {/* Big headline score dial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <ScoreDial value={7.4} />
        <div>
          <div className="micro-label" style={{ color: T.orange, marginBottom: 4 }}>
            AI Intelligence
          </div>
          <div className="h-display" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
            Strong potential
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 6 }}>
            3 high-impact opportunities found
          </div>
        </div>
      </div>

      {/* Mini bar chart of the 5 dimensions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {dims.map((d, i) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                color: T.textSecondary,
                width: 82,
                flexShrink: 0,
                textAlign: 'right',
              }}
            >
              {d.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 7,
                background: T.pillBg,
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${d.v * 10}%`,
                  height: '100%',
                  borderRadius: 99,
                  background:
                    d.v >= 8
                      ? T.green
                      : d.v >= 6
                        ? T.orange
                        : T.amber,
                  transformOrigin: 'left',
                  animation: `growBar 700ms ${i * 90 + 200}ms cubic-bezier(0.22,1,0.36,1) both`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: T.textPrimary,
                width: 16,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {d.v}
            </span>
          </div>
        ))}
      </div>

      <style>{`@keyframes growBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}

function ScoreDial({ value }: { value: number }) {
  const size = 88;
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = value / 10;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.pillBg} strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.orange}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
          style={{
            animation: `dialFill 1100ms 300ms cubic-bezier(0.22,1,0.36,1) forwards`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="h-display" style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary }}>
          {value}
        </span>
        <span style={{ fontSize: 9.5, color: T.textMuted }}>/ 10</span>
      </div>
      <style>{`@keyframes dialFill { to { stroke-dashoffset: ${c * (1 - pct)}px; } }`}</style>
    </div>
  );
}
