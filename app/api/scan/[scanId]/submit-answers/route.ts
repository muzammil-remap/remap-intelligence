import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db/queries';
import { generateReportPipeline } from '@/lib/pipeline/generateReport';
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

  // Answers are durably saved. Kick off report generation in the background —
  // we do NOT await it so the response returns immediately; the frontend polls
  // GET /api/scan/[scanId]/status for progress. The pipeline handles its own
  // errors by marking the scan row `failed`.
  void generateReportPipeline(scanId);

  return NextResponse.json({ success: true });
}
