'use client';

import { useState } from 'react';
import { T } from '@/lib/constants';
import type { QuestionDef } from '@/lib/constants';

// Value shapes per question type:
//  - text:     string
//  - capacity: { q2Current: string; q2Capacity: string }
//  - pills:    string (single) OR string[] (multi)
export type AnswerValue = string | string[] | { q2Current: string; q2Capacity: string };

interface QuestionCardProps {
  question: QuestionDef;
  onAnswer: (value: AnswerValue) => void;
}

const pillBase: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 99,
  fontSize: 13.5,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 150ms ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

// Inline overrides layered on top of the .remap-btn class.
function nextButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    marginTop: 18,
    padding: '0 22px',
    opacity: enabled ? 1 : 0.45,
  };
}

export default function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  return (
    <div className="q-enter">
      <p className="micro-label" style={{ color: T.orange, marginBottom: 8 }}>
        {question.id.toUpperCase()}
      </p>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: T.textPrimary,
          margin: '0 0 4px',
          lineHeight: 1.25,
        }}
      >
        {question.q}
      </h3>
      {question.hint && (
        <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 14px' }}>
          {question.hint}
        </p>
      )}
      <div style={{ marginTop: 14 }}>
        {question.type === 'text' && (
          <TextAnswer question={question} onAnswer={onAnswer} />
        )}
        {question.type === 'capacity' && (
          <CapacityAnswer question={question} onAnswer={onAnswer} />
        )}
        {question.type === 'pills' && (
          <PillAnswer question={question} onAnswer={onAnswer} />
        )}
      </div>
    </div>
  );
}

function TextAnswer({ question, onAnswer }: QuestionCardProps) {
  const [value, setValue] = useState('');
  const enabled = value.trim().length > 0;
  return (
    <div>
      <textarea
        className="field-input"
        rows={3}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ resize: 'vertical', minHeight: 84 }}
      />
      <button
        className="remap-btn"
        style={nextButtonStyle(enabled)}
        disabled={!enabled}
        onClick={() => enabled && onAnswer(value.trim())}
      >
        Next →
      </button>
    </div>
  );
}

function CapacityAnswer({ question, onAnswer }: QuestionCardProps) {
  const fields = question.fields ?? [];
  const [vals, setVals] = useState<Record<string, string>>({});
  const enabled = fields.every((f) => (vals[f.key] ?? '').trim().length > 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {fields.map((f) => (
          <div key={f.key} style={{ flex: '1 1 180px' }}>
            <label
              className="micro-label"
              style={{ color: T.textSecondary, display: 'block', marginBottom: 6 }}
            >
              {f.label}
            </label>
            <input
              className="field-input"
              type="number"
              min={0}
              value={vals[f.key] ?? ''}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
            />
            <span style={{ fontSize: 11, color: T.textMuted }}>{f.suffix}</span>
          </div>
        ))}
      </div>
      <button
        className="remap-btn"
        style={nextButtonStyle(enabled)}
        disabled={!enabled}
        onClick={() =>
          enabled &&
          onAnswer({
            q2Current: vals.q2Current ?? '',
            q2Capacity: vals.q2Capacity ?? '',
          })
        }
      >
        Next →
      </button>
    </div>
  );
}

function PillAnswer({ question, onAnswer }: QuestionCardProps) {
  const multi = !!question.multi;
  const [selected, setSelected] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState('');

  const toggle = (opt: string) => {
    if (multi) {
      setSelected((s) =>
        s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt],
      );
    } else {
      // Single-select: commit immediately.
      onAnswer(opt);
    }
  };

  const finalMulti = () => {
    const out = [...selected];
    if (showOther && otherText.trim()) out.push(otherText.trim());
    onAnswer(out);
  };

  const multiEnabled = selected.length > 0 || (showOther && otherText.trim().length > 0);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(question.options ?? []).map((opt) => {
          const active = multi ? selected.includes(opt) : false;
          return (
            <span
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                ...pillBase,
                border: `1px solid ${active ? T.orangeBorder : T.borderVisible}`,
                background: active ? T.orangeDim : 'rgba(148,163,184,0.05)',
                color: active ? T.textPrimary : T.textSecondary,
              }}
            >
              {multi && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: `1.5px solid ${active ? T.orange : T.borderVisible}`,
                    background: active ? T.orange : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: '#fff',
                  }}
                >
                  {active ? '✓' : ''}
                </span>
              )}
              {opt}
            </span>
          );
        })}
        {question.other && (
          <span
            onClick={() => setShowOther((v) => !v)}
            style={{
              ...pillBase,
              border: `1px dashed ${showOther ? T.orange : T.borderVisible}`,
              background: showOther ? T.orangeDim : 'transparent',
              color: showOther ? T.textPrimary : T.textSecondary,
            }}
          >
            Other…
          </span>
        )}
      </div>

      {showOther && (
        <input
          className="field-input"
          style={{ marginTop: 10 }}
          placeholder="Tell us more…"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
        />
      )}

      {multi && (
        <button
          className="remap-btn"
          style={nextButtonStyle(multiEnabled)}
          disabled={!multiEnabled}
          onClick={() => multiEnabled && finalMulti()}
        >
          Next →
        </button>
      )}
    </div>
  );
}
