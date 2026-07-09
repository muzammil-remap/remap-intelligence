'use client';

import { useState } from 'react';
import { T, QUESTIONS } from '@/lib/constants';
import QuestionCard, { AnswerValue } from './QuestionCard';
import CheckboxGrid from './CheckboxGrid';

interface QuestionFlowProps {
  scanId: string | null;
  onProgress?: (answered: number) => void; // fires after each question, 1..5
  onAllAnswered: () => void; // Q5 answered → manual-tasks checklist shows
  onSubmitStart?: () => void; // final submit kicked off
  onSubmitError?: () => void; // final submit failed (rail leaves compiling state)
  onComplete: () => void; // navigate to completion screen
}

// Normalised answers payload sent to the API.
interface AnswersPayload {
  q1?: string;
  q2Current?: string;
  q2Capacity?: string;
  q3?: string[];
  q4?: string;
  q5?: string;
}

function summarise(value: AnswerValue): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    return `${value.q2Current} now · capacity ${value.q2Capacity}`;
  }
  return value;
}

export default function QuestionFlow({
  scanId,
  onProgress,
  onAllAnswered,
  onSubmitStart,
  onSubmitError,
  onComplete,
}: QuestionFlowProps) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [answers, setAnswers] = useState<AnswersPayload>({});
  const [showChecklist, setShowChecklist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = (value: AnswerValue) => {
    const question = QUESTIONS[index];
    const next: AnswersPayload = { ...answers };

    switch (question.id) {
      case 'q1':
        next.q1 = value as string;
        break;
      case 'q2': {
        const v = value as { q2Current: string; q2Capacity: string };
        next.q2Current = v.q2Current;
        next.q2Capacity = v.q2Capacity;
        break;
      }
      case 'q3':
        next.q3 = value as string[];
        break;
      case 'q4':
        next.q4 = value as string;
        break;
      case 'q5':
        next.q5 = value as string;
        break;
    }

    setAnswers(next);
    setHistory((h) => [...h, { q: question.q, a: summarise(value) }]);
    onProgress?.(index + 1);

    if (index < QUESTIONS.length - 1) {
      setIndex((i) => i + 1);
    } else {
      // After Q5 → show the manual tasks checklist.
      onAllAnswered();
      setShowChecklist(true);
    }
  };

  const handleSubmit = async (selections: string[]) => {
    setSubmitting(true);
    setError(null);
    onSubmitStart?.();
    try {
      if (!scanId) throw new Error('Scan not ready');
      const res = await fetch(`/api/scan/${scanId}/submit-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, checkboxSelections: selections }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not submit answers');
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
      onSubmitError?.();
    }
  };

  return (
    <div>
      {/* Answered history as dimmed transcript */}
      {history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {history.map((h, i) => (
            <div key={i} style={{ opacity: 0.7 }}>
              <p style={{ fontSize: 12.5, color: T.textMuted, margin: '0 0 2px' }}>
                {h.q}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: T.textSecondary,
                  margin: 0,
                  background: T.pillBg,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 10,
                  padding: '9px 12px',
                }}
              >
                {h.a}
              </p>
            </div>
          ))}
        </div>
      )}

      {!showChecklist ? (
        <QuestionCard
          key={QUESTIONS[index].id}
          question={QUESTIONS[index]}
          onAnswer={handleAnswer}
        />
      ) : (
        <CheckboxGrid onSubmit={handleSubmit} submitting={submitting} />
      )}

      {error && (
        <p style={{ color: T.red, fontSize: 13, marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}
