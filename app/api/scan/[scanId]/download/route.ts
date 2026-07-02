import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Serve the PDF by redirecting to its public Storage URL (or 404 if not ready).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  try {
    const row = await db.getScanStatus(scanId);
    if (!row || !row.pdf_url) {
      return NextResponse.json(
        { error: 'Report not ready yet' },
        { status: 404 },
      );
    }
    return NextResponse.redirect(row.pdf_url);
  } catch (err) {
    console.error('[download] error', err);
    return NextResponse.json({ error: 'Could not fetch report' }, { status: 500 });
  }
}
