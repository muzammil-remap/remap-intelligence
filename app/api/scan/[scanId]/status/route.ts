import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db/queries';
import type { ScanStatus } from '@/types/scan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROGRESS: Record<ScanStatus, number> = {
  pending: 5,
  scanning: 30,
  questions_pending: 70,
  questions_received: 80,
  generating_pdf: 90,
  complete: 100,
  failed: 0,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  try {
    const row = await db.getScanStatus(scanId);
    if (!row) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }
    return NextResponse.json({
      status: row.status,
      scanProgress: PROGRESS[row.status] ?? 0,
      pdfUrl: row.pdf_url ?? null,
    });
  } catch (err) {
    console.error('[status] error', err);
    return NextResponse.json({ error: 'Could not fetch status' }, { status: 500 });
  }
}
