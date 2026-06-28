import { NextResponse } from 'next/server';
import { consumeDeflectionRateLimit } from '@/lib/deflection-rate-limit';
import { purgeGapReportSubmissionByReportRequestId } from '@/lib/gap-report-cleanup';

export const runtime = 'nodejs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const PURGE_RATE_LIMIT = {
  scope: 'deflection-report-purge',
  limit: 3,
  windowMs: 10 * 60 * 1000,
};

type PurgeRequestBody = {
  requestId?: unknown;
};

function customerError(reason: string) {
  if (reason === 'not_found') {
    return NextResponse.json(
      { ok: false, error: 'Report not found or already deleted.' },
      { status: 404 },
    );
  }
  if (reason === 'not_configured') {
    return NextResponse.json(
      { ok: false, error: 'Report deletion is temporarily unavailable.' },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { ok: false, error: 'Could not finish deletion. Please try again.' },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  let body: PurgeRequestBody;
  try {
    body = (await request.json()) as PurgeRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  if (!REQUEST_ID_RE.test(requestId)) {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const rateLimit = consumeDeflectionRateLimit(request.headers, requestId, PURGE_RATE_LIMIT);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many deletion attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const result = await purgeGapReportSubmissionByReportRequestId(requestId);
  if (result.ok) {
    return NextResponse.json({ ok: true, status: result.status });
  }
  return customerError(result.reason);
}
