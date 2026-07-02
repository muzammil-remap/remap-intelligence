'use client';

import { useState } from 'react';
import Link from 'next/link';
import { T } from '@/lib/constants';
import Logo from './Logo';

interface NavItem {
  key: string;
  label: string;
  locked: boolean;
}

const NAV: NavItem[] = [
  { key: 'generate', label: 'Generate Report', locked: false },
  { key: 'report', label: 'Report', locked: true },
  { key: 'opportunities', label: 'Opportunities', locked: true },
  { key: 'competitors', label: 'Competitors', locked: true },
  { key: 'history', label: 'History', locked: true },
  { key: 'work', label: 'Work with us', locked: true },
];

export default function Dashboard() {
  const [active] = useState('generate');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimSent, setClaimSent] = useState(false);

  return (
    <div className="shell">
      <aside className="sidebar" style={{ background: T.surface, padding: '22px 16px' }}>
        <div style={{ marginBottom: 26 }}>
          <Logo height={24} />
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((item, i) => {
            const isActive = item.key === active;
            return (
              <div key={item.key}>
                {i === 1 && (
                  <div
                    style={{
                      height: 1,
                      background: T.borderSubtle,
                      margin: '8px 0',
                    }}
                  />
                )}
                <button
                  disabled={item.locked}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isActive ? T.orangeDim : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: item.locked
                      ? T.textMuted
                      : isActive
                        ? T.textPrimary
                        : T.textSecondary,
                    cursor: item.locked ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {item.label}
                  {item.locked && <span style={{ fontSize: 12 }}>🔒</span>}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      <main style={{ flex: 1 }}>
        <div className="main-inner">
          <p className="micro-label" style={{ color: T.orange, marginBottom: 6 }}>
            Generate Report
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Run a new AI Readiness scan
          </h1>
          <p style={{ color: T.textSecondary, maxWidth: 540, marginBottom: 28 }}>
            Your dashboard unlocks once you claim your report. Start a new scan
            below, or claim an existing report to view opportunities, competitor
            benchmarks and outreach.
          </p>

          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 14,
              padding: 22,
              maxWidth: 540,
              marginBottom: 22,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>
              Start a new report
            </h3>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: T.orange,
                color: '#fff',
                borderRadius: 10,
                padding: '12px 22px',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              New scan →
            </Link>
          </div>

          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 14,
              padding: 22,
              maxWidth: 540,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
              Claim your dashboard
            </h3>
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 14px' }}>
              We&apos;ll email you a magic link to unlock your saved report.
              (Coming soon.)
            </p>
            {claimSent ? (
              <p style={{ color: T.green, fontSize: 14 }}>
                If a report exists for that email, a link is on its way.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className="field-input"
                  style={{ flex: '1 1 240px' }}
                  placeholder="you@company.com"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                />
                <button
                  onClick={() => setClaimSent(true)}
                  disabled={!claimEmail.trim()}
                  style={{
                    background: 'transparent',
                    color: T.textPrimary,
                    border: `1px solid ${T.borderVisible}`,
                    borderRadius: 10,
                    padding: '11px 18px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: claimEmail.trim() ? 'pointer' : 'not-allowed',
                    opacity: claimEmail.trim() ? 1 : 0.5,
                  }}
                >
                  Send link
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
