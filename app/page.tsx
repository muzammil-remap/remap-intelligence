'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/constants';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import JourneyRail from '@/components/JourneyRail';
import QuestionFlow from '@/components/QuestionFlow';
import HeroVisual from '@/components/HeroVisual';

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

  // Journey progress mirrored into the left rail.
  const [answered, setAnswered] = useState(0);
  const [checklistReached, setChecklistReached] = useState(false);
  const [compiling, setCompiling] = useState(false);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="top-meta micro-label">
            <span className="pulse-dot" style={{ width: 7, height: 7 }} />
            Free · No sales call · ~2 min
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="intake-body">
        {/* ---- Pre-scan: hero + form. Post-scan: journey. ---- */}
        {!initiated ? (
          <>
            <div className="hero fade-up">
              <div>
                <span
                  className="chip micro-label"
                  style={{ color: T.orange, marginBottom: 18 }}
                >
                  <SparkIcon />
                  AI Intelligence Report
                </span>
                <h1
                  className="h-display"
                  style={{
                    fontSize: 'clamp(34px, 5vw, 54px)',
                    fontWeight: 700,
                    margin: '0 0 16px',
                  }}
                >
                  Clarity out of{' '}
                  <span className="text-gradient">the chaos.</span>
                </h1>
                <p
                  style={{
                    color: T.textSecondary,
                    margin: 0,
                    fontSize: 16.5,
                    lineHeight: 1.6,
                    maxWidth: 460,
                  }}
                >
                  We scan 11 data sources across your web presence, benchmark your
                  AI readiness, and email you a scored report — in under three
                  minutes. No sales call required.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 22,
                    marginTop: 26,
                    flexWrap: 'wrap',
                  }}
                >
                  <Stat value="11" label="Data sources" />
                  <Stat value="5" label="Score dimensions" />
                  <Stat value="~2 min" label="To your inbox" />
                </div>
              </div>

              <div className="hero-visual">
                <HeroVisual />
              </div>
            </div>

            {/* Form card */}
            <section
              className="remap-card fade-up"
              style={{ padding: 28, animationDelay: '80ms' }}
            >
              <p className="micro-label" style={{ color: T.orange, marginBottom: 6 }}>
                Step 1 · Your details
              </p>
              <h2
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: '0 0 20px',
                }}
              >
                Tell us where to look — and where to send the report
              </h2>

              <div className="details-grid">
                <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                <Field label="Website" value={website} onChange={setWebsite} placeholder="yourcompany.com" />
                <Field label="Competitor (optional)" value={competitor} onChange={setCompetitor} placeholder="competitor.com" />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginTop: 22,
                }}
              >
                <button
                  className="remap-btn"
                  onClick={handleInitiate}
                  disabled={!canInitiate}
                  style={{ padding: '0 32px' }}
                >
                  {initiating ? 'Starting…' : 'Initiate scan →'}
                </button>
                <p style={{ color: T.textMuted, fontSize: 13, margin: 0, flex: 1, minWidth: 220 }}>
                  The scan starts immediately — answer 5 quick questions on the
                  next step while it runs.
                </p>
              </div>
              {error && (
                <p style={{ color: T.red, fontSize: 13, marginTop: 12, marginBottom: 0 }}>
                  {error}
                </p>
              )}
            </section>

            {/* Feature strip — fills the page, explains the value */}
            <div className="feature-strip">
              <Feature
                icon={<ScanIcon />}
                title="Deep web scan"
                body="Homepage, sitemap, DNS, subdomains and domain history — analysed automatically."
                delay="140ms"
              />
              <Feature
                icon={<GaugeIcon />}
                title="Five scored dimensions"
                body="AEO, GEO, AI readiness, opportunity and ICP fit — each rated out of ten."
                delay="200ms"
              />
              <Feature
                icon={<DocIcon />}
                title="Actionable PDF"
                body="A consultant-grade report with ranked opportunities, delivered to your inbox."
                delay="260ms"
              />
            </div>
          </>
        ) : (
          <div className="journey-grid" style={{ marginTop: 8 }}>
            {/* Left — animated journey checklist */}
            <JourneyRail
              initiated={initiated}
              answered={answered}
              checklistReached={checklistReached}
              compiling={compiling}
            />

            {/* Right — the current step's card */}
            <div style={{ minWidth: 0 }} className="q-enter">
              {/* Compact summary of the submitted details */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <SummaryChip label="Scanning" value={website} highlight />
                {competitor.trim() && <SummaryChip label="vs" value={competitor} />}
                <SummaryChip label="Report to" value={email} />
              </div>

              <section className="remap-card" style={{ padding: 28, minHeight: 300 }}>
                <QuestionFlow
                  scanId={scanId}
                  onProgress={setAnswered}
                  onAllAnswered={() => setChecklistReached(true)}
                  onSubmitStart={() => setCompiling(true)}
                  onSubmitError={() => setCompiling(false)}
                  onComplete={goToCompletion}
                />
              </section>
            </div>
          </div>
        )}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        className="micro-label"
        style={{ color: T.textSecondary, display: 'block', marginBottom: 7 }}
      >
        {label}
      </label>
      <input
        className="field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        className="h-display"
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: T.textPrimary,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div className="micro-label" style={{ color: T.textMuted, marginTop: 5 }}>
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: string;
}) {
  return (
    <div
      className="remap-card card-hover fade-up"
      style={{ padding: 20, animationDelay: delay }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: T.orangeDim,
          border: `1px solid ${T.orangeBorder}`,
          color: T.orange,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: T.textSecondary, margin: 0, lineHeight: 1.55 }}>
        {body}
      </p>
    </div>
  );
}

function SummaryChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span
      className="chip"
      style={{
        fontSize: 12.5,
        background: highlight ? T.orangeDim : undefined,
        borderColor: highlight ? T.orangeBorder : undefined,
        maxWidth: '100%',
      }}
    >
      <span className="micro-label" style={{ color: highlight ? T.orange : T.textMuted }}>
        {label}
      </span>
      <span
        style={{
          color: T.textPrimary,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </span>
  );
}

/* --- Inline line icons (Lucide-style, per the handoff "no emoji" note) --- */
function SparkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M3 12h18" />
    </svg>
  );
}
function GaugeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 14 15 9" />
      <path d="M3.6 15a9 9 0 1 1 16.8 0" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
