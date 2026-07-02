'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/constants';
import Logo from '@/components/Logo';
import ScanTracker from '@/components/ScanTracker';
import QuestionFlow from '@/components/QuestionFlow';

export default function IntakePage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [competitor, setCompetitor] = useState('');

  const [scanId, setScanId] = useState<string | null>(null);
  const [initiated, setInitiated] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionsComplete, setQuestionsComplete] = useState(false);

  const canInitiate =
    !!email.trim() && !!name.trim() && !!website.trim() && !initiating;

  const handleInitiate = async () => {
    if (!canInitiate) return;
    setInitiating(true);
    setError(null);
    try {
      const res = await fetch('/api/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, website, competitor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start your scan');
      setScanId(data.scanId);
      setInitiated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setInitiating(false);
    }
  };

  const goToCompletion = () => {
    const params = new URLSearchParams();
    if (scanId) params.set('scanId', scanId);
    if (email) params.set('email', email);
    router.push(`/completion?${params.toString()}`);
  };

  return (
    <div className="intake-wrap">
      <div className="intake-top">
        <Logo />
        <span className="micro-label" style={{ color: T.textSecondary }}>
          Free AI readiness report · ~2 min
        </span>
      </div>

      <div className="intake-body">
        {/* Section A — Details */}
        <section className="remap-card" style={{ padding: 24, marginBottom: 28 }}>
          <p className="micro-label" style={{ color: T.orange, marginBottom: 10 }}>
            Step 1 · Your details
          </p>
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              marginBottom: 18,
            }}
          >
            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                flex: '1 1 280px',
                lineHeight: 1.1,
              }}
            >
              Clarity out of the chaos.
            </h1>
            <p
              style={{
                color: T.textSecondary,
                margin: 0,
                flex: '1 1 280px',
                fontSize: 14.5,
                lineHeight: 1.5,
              }}
            >
              Get your AI Readiness Report in under 3 minutes. Free — no sales
              call required.
            </p>
          </div>

          <div className="field-row">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              disabled={initiated}
            />
            <Field
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Your name"
              disabled={initiated}
            />
            <Field
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="yourcompany.com"
              disabled={initiated}
            />
            <Field
              label="Competitor (optional)"
              value={competitor}
              onChange={setCompetitor}
              placeholder="competitor.com"
              disabled={initiated}
            />
            <div>
              <button
                className="remap-btn"
                onClick={handleInitiate}
                disabled={!canInitiate || initiated}
                style={{
                  width: '100%',
                  opacity: initiated ? 0.5 : canInitiate ? 1 : 0.45,
                }}
              >
                {initiated ? 'Scanning…' : initiating ? 'Starting…' : 'Initiate →'}
              </button>
            </div>
          </div>

          <p style={{ color: T.textMuted, fontSize: 12.5, marginTop: 14, marginBottom: 0 }}>
            We&apos;re already scanning 11 data sources below — answer the 5
            questions while it runs. We&apos;ll benchmark you against your
            competitor.
          </p>
          {error && <p style={{ color: T.red, fontSize: 13, marginTop: 10 }}>{error}</p>}
        </section>

        {/* Section B — Scan + Questions */}
        <section>
          <p className="micro-label" style={{ color: T.orange, marginBottom: 6 }}>
            Step 2 · Live scan & questions
          </p>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '0 0 18px',
            }}
          >
            While we scan, answer 5 quick questions
          </h2>

          <div className="scan-grid">
            <ScanTracker active={initiated} questionsComplete={questionsComplete} />

            <div className="remap-card" style={{ padding: 24, minHeight: 280 }}>
              {!initiated ? (
                <p style={{ color: T.textMuted, fontSize: 14 }}>
                  Enter your details above and hit{' '}
                  <strong style={{ color: T.textSecondary }}>Initiate</strong> to
                  begin. Your questions will appear here.
                </p>
              ) : (
                <QuestionFlow
                  scanId={scanId}
                  onAllAnswered={() => setQuestionsComplete(true)}
                  onComplete={goToCompletion}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        className="micro-label"
        style={{ color: T.textSecondary, display: 'block', marginBottom: 6 }}
      >
        {label}
      </label>
      <input
        className="field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={disabled ? { opacity: 0.6 } : undefined}
      />
    </div>
  );
}
