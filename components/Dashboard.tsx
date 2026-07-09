'use client';

import { useState } from 'react';
import Link from 'next/link';
import { T } from '@/lib/constants';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

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

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
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
                    fontFamily: 'inherit',
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
                  {item.locked && <LockIcon />}
                </button>
              </div>
            );
          })}
        </nav>
        <div style={{ paddingTop: 14, borderTop: `1px solid ${T.borderSubtle}` }}>
          <ThemeToggle />
        </div>
      </aside>

      <main style={{ flex: 1 }}>
        <div className="main-inner">
          <p className="micro-label" style={{ color: T.orange, marginBottom: 6 }}>
            Generate Report
          </p>
          <h1
            className="h-display"
            style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}
          >
            Run a new AI Readiness scan
          </h1>
          <p style={{ color: T.textSecondary, maxWidth: 540, marginBottom: 28 }}>
            Your dashboard unlocks once you claim your report. Start a new scan
            below, or claim an existing report to view opportunities, competitor
            benchmarks and outreach.
          </p>

          <div
            className="remap-card"
            style={{ padding: 22, maxWidth: 540, marginBottom: 22 }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>
              Start a new report
            </h3>
            <Link
              href="/"
              className="remap-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 22px',
                textDecoration: 'none',
              }}
            >
              New scan →
            </Link>
          </div>

          <div className="remap-card" style={{ padding: 22, maxWidth: 540 }}>
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
                  className="btn-ghost"
                  onClick={() => setClaimSent(true)}
                  disabled={!claimEmail.trim()}
                  style={{
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
