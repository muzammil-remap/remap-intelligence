import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest.config';
import * as db from '@/lib/db/queries';
import type { ScanAnswers } from '@/types/scan';

export const runtime = 'nodejs';

interface SubmitBody {
  answers?: {
    q1?: string;
    q2Current?: string;
    q2Capacity?: string;
    q3?: string[];
    q4?: string;
    q5?: string;
  };
  checkboxSelections?: string[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const answers: ScanAnswers = {
    q1: body.answers?.q1,
    q2Current: body.answers?.q2Current,
    q2Capacity: body.answers?.q2Capacity,
    q3: Array.isArray(body.answers?.q3) ? body.answers?.q3 : [],
    q4: body.answers?.q4,
    q5: body.answers?.q5,
  };
  const checkboxSelections = Array.isArray(body.checkboxSelections)
    ? body.checkboxSelections
    : [];

  try {
    await db.saveAnswers(scanId, answers, checkboxSelections);
  } catch (err) {
    console.error('[submit-answers] saveAnswers error', err);
    return NextResponse.json({ error: 'Could not save answers' }, { status: 500 });
  }

  try {
    await inngest.send({
      name: 'scan.answers-submitted',
      data: { scanId },
    });
  } catch (err) {
    console.error('[submit-answers] inngest.send error', err);
    // Answers are saved; the job's waitForEvent may time out and still proceed.
  }

  return NextResponse.json({ success: true });
}
