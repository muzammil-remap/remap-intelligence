import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest.config';
import * as db from '@/lib/db/queries';
import {
  cleanDomain,
  isValidEmail,
  isValidDomain,
} from '@/lib/utils/domain';

export const runtime = 'nodejs';

interface InitiateBody {
  email?: string;
  name?: string;
  website?: string;
  competitor?: string;
}

export async function POST(req: NextRequest) {
  let body: InitiateBody;
  try {
    body = (await req.json()) as InitiateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = body.email?.trim() ?? '';
  const name = body.name?.trim() ?? '';

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (!body.website?.trim()) {
    return NextResponse.json({ error: 'A website is required' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'A name is required' }, { status: 400 });
  }

  const clean = cleanDomain(body.website);
  if (!isValidDomain(clean)) {
    return NextResponse.json(
      { error: 'That does not look like a valid website' },
      { status: 400 },
    );
  }

  const competitorClean = body.competitor?.trim()
    ? cleanDomain(body.competitor)
    : null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const rate = await db.checkAndLogRateLimit(ip, email);
  if (!rate.allowed) {
    return NextResponse.json({ error: rate.reason }, { status: 429 });
  }

  let scanId: string;
  try {
    scanId = await db.createScan({
      domain: body.website.trim(),
      clean_domain: clean,
      contact_name: name,
      contact_email: email,
      competitor_domain: competitorClean,
    });
  } catch (err) {
    console.error('[initiate] createScan error', err);
    return NextResponse.json(
      { error: 'Could not start your scan. Please try again.' },
      { status: 500 },
    );
  }

  try {
    await inngest.send({
      name: 'scan.initiated',
      data: { scanId, domain: clean, competitorDomain: competitorClean },
    });
  } catch (err) {
    console.error('[initiate] inngest.send error', err);
    // Scan row exists; the background job can be retried. Don't fail the user.
  }

  return NextResponse.json({ scanId });
}
