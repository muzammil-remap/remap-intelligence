'use client';

import { useEffect, useState } from 'react';
import { T, CALENDLY_URL } from '@/lib/constants';
import Logo from './Logo';

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
      </div>
      <div
        className="intake-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: 80,
          maxWidth: 560,
        }}
      >
        {phase === 'generating' && (
          <>
            <Spinner />
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 24 }}>
              Generating your report…
            </h1>
            <p style={{ color: T.textSecondary, marginTop: 8 }}>
              We&apos;re computing your scores and building your PDF. This usually
              takes under a minute.
            </p>
          </>
        )}

        {phase === 'ready' && (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: T.green,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}
            >
              ✓
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 24 }}>
              Your AI Intelligence Report is ready.
            </h1>
            <p style={{ color: T.textSecondary, marginTop: 8 }}>
              We&apos;ve emailed it to{' '}
              <strong style={{ color: T.textPrimary }}>{email ?? 'your inbox'}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={primaryBtn}>
                  Download PDF →
                </a>
              )}
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={secondaryBtn}>
                Book a 15-minute call →
              </a>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 24 }}>
              Something went wrong generating your report.
            </h1>
            <p style={{ color: T.textSecondary, marginTop: 8 }}>
              Your details were saved. If the report doesn&apos;t arrive shortly,
              please try again or contact hello@remap.ai.
            </p>
            <button style={{ ...primaryBtn, marginTop: 24 }} onClick={() => location.reload()}>
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f97316, #ea6c0a)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '13px 24px',
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
  display: 'inline-block',
  boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
};

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  color: T.textPrimary,
  border: `1px solid ${T.borderVisible}`,
  borderRadius: 10,
  padding: '13px 24px',
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
};

function Spinner() {
  return (
    <>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `4px solid ${T.elevated}`,
          borderTopColor: T.orange,
          animation: 'spin 800ms linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
