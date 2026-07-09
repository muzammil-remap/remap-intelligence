'use client';

import { useEffect, useState } from 'react';
import { T, CALENDLY_URL } from '@/lib/constants';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

interface CompletionScreenProps {
  scanId: string | null;
  email: string | null;
}

type Phase = 'generating' | 'ready' | 'error';

export default function CompletionScreen({ scanId, email }: CompletionScreenProps) {
  // Initial phase is derived from scanId presence — no synchronous setState
  // inside the effect (which would trigger cascading renders).
  const [phase, setPhase] = useState<Phase>(scanId ? 'generating' : 'error');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Poll status until complete / failed.
  useEffect(() => {
    if (!scanId) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // ~2 min at 2s intervals

    const poll = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch(`/api/scan/${scanId}/status`, { cache: 'no-store' });
        const data = await res.json();
        if (data.status === 'complete' && data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
          setPhase('ready');
          return;
        }
        if (data.status === 'failed') {
          setPhase('error');
          return;
        }
      } catch {
        // transient — keep polling
      }
      if (attempts >= MAX_ATTEMPTS) {
        setPhase('error');
        return;
      }
      setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  return (
    <div className="intake-wrap">
      <div className="intake-top">
        <Logo />
        <ThemeToggle />
      </div>
      <div
        className="intake-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: 72,
          maxWidth: 560,
        }}
      >
        {phase === 'generating' && (
          <div className="q-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Spinner />
            <h1
              className="h-display"
              style={{ fontSize: 27, fontWeight: 700, marginTop: 26, marginBottom: 0 }}
            >
              Generating your report…
            </h1>
            <p style={{ color: T.textSecondary, marginTop: 10, lineHeight: 1.55 }}>
              We&apos;re computing your scores and building your PDF. This usually
              takes under a minute.
            </p>
          </div>
        )}

        {phase === 'ready' && (
          <div className="q-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SuccessCheck />
            <h1
              className="h-display"
              style={{ fontSize: 27, fontWeight: 700, marginTop: 26, marginBottom: 0 }}
            >
              Your AI Intelligence Report is ready.
            </h1>
            <p style={{ color: T.textSecondary, marginTop: 10 }}>
              We&apos;ve emailed it to{' '}
              <strong style={{ color: T.textPrimary }}>{email ?? 'your inbox'}</strong>.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 28,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="remap-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    textDecoration: 'none',
                  }}
                >
                  Download PDF →
                </a>
              )}
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                Book a 15-minute call →
              </a>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="q-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1
              className="h-display"
              style={{ fontSize: 25, fontWeight: 700, marginTop: 24, marginBottom: 0 }}
            >
              Something went wrong generating your report.
            </h1>
            <p style={{ color: T.textSecondary, marginTop: 10, lineHeight: 1.55 }}>
              Your details were saved. If the report doesn&apos;t arrive shortly,
              please try again or contact hello@remap.ai.
            </p>
            <button
              className="remap-btn"
              style={{ marginTop: 24, padding: '0 26px' }}
              onClick={() => location.reload()}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `4px solid ${T.pillBg}`,
          borderTopColor: T.orange,
          animation: 'spin 800ms linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// Green success badge with a stroke-drawn check (same drawCheck animation as
// the journey rail).
function SuccessCheck() {
  return (
    <div
      style={{
        width: 68,
        height: 68,
        borderRadius: '50%',
        background: T.greenBg,
        border: `1.5px solid ${T.green}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke={T.green}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M4.5 12.5 9.5 17.5 19.5 6.5"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation: 'drawCheck 500ms 150ms cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        />
      </svg>
    </div>
  );
}
