import { NextResponse } from 'next/server';
import {
  fetchDeflectionArtifact,
  fetchDeflectionReportModel,
} from '@/lib/atlas-deflection-client';
import { consumeDeflectionRateLimit } from '@/lib/deflection-rate-limit';

export const runtime = 'nodejs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const STATUS_RATE_LIMIT = {
  scope: 'deflection-report-status',
  limit: 40,
  windowMs: 60 * 1000,
};

export async function GET(request: Request) {
  const requestId = new URL(request.url).searchParams.get('requestId') ?? '';
  if (!REQUEST_ID_RE.test(requestId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const rateLimit = consumeDeflectionRateLimit(request.headers, requestId, STATUS_RATE_LIMIT);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many status checks. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const modelResult = await fetchDeflectionReportModel(requestId);
  if (modelResult.ok) return NextResponse.json({ status: 'unlocked' });
  if (modelResult.reason === 'locked') return NextResponse.json({ status: 'locked' });
  if (modelResult.reason !== 'not_found') {
    return NextResponse.json({ error: 'Report status unavailable.' }, { status: 503 });
  }

  const result = await fetchDeflectionArtifact(requestId);
  if (result.ok) return NextResponse.json({ status: 'unlocked' });
  if (result.reason === 'locked') return NextResponse.json({ status: 'locked' });
  if (result.reason === 'not_found') {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }
  return NextResponse.json({ error: 'Report status unavailable.' }, { status: 503 });
}
