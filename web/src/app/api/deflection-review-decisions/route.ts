import { NextResponse } from 'next/server';
import { fetchDeflectionReportModel } from '@/lib/atlas-deflection-client';
import { consumeDeflectionRateLimit } from '@/lib/deflection-rate-limit';
import {
  DEFLECTION_REVIEW_DECISIONS,
  deflectionReviewDecisionDatabaseConfigured,
  listDeflectionReviewDecisions,
  upsertDeflectionReviewDecision,
  type DeflectionReviewDecision,
} from '@/lib/deflection-review-decisions-database';
import type { DeflectionStructuredReport } from '@/lib/deflection-report-contract';

export const runtime = 'nodejs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const REVIEW_KEY_RE = /^review_[0-9a-f]{24}$/;
const REVIEW_DECISION_RATE_LIMIT = {
  scope: 'deflection-review-decisions',
  limit: 40,
  windowMs: 60 * 1000,
};

type ReportAccessResult =
  | { ok: true; reviewKeys: Set<string> }
  | { ok: false; response: NextResponse };

function isDeflectionReviewDecision(value: unknown): value is DeflectionReviewDecision {
  return typeof value === 'string' && DEFLECTION_REVIEW_DECISIONS.includes(value as DeflectionReviewDecision);
}

function reviewKeysFromModel(model: DeflectionStructuredReport): Set<string> {
  const section = model.sections.find((candidate) => candidate.id === 'suppressed_repeat_review_queue');
  const data = typeof section?.data === 'object' && section.data !== null ? section.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const reviewKeys = new Set<string>();
  for (const item of items) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
    const reviewKey = (item as Record<string, unknown>).review_key;
    if (typeof reviewKey === 'string' && REVIEW_KEY_RE.test(reviewKey)) {
      reviewKeys.add(reviewKey);
    }
  }
  return reviewKeys;
}

async function validateReportAccess(requestId: string): Promise<ReportAccessResult> {
  const modelResult = await fetchDeflectionReportModel(requestId);
  if (modelResult.ok) {
    return { ok: true, reviewKeys: reviewKeysFromModel(modelResult.model) };
  }
  if (modelResult.reason === 'locked') {
    return { ok: false, response: NextResponse.json({ error: 'Report is locked.' }, { status: 403 }) };
  }
  if (modelResult.reason === 'not_found') {
    return { ok: false, response: NextResponse.json({ error: 'Report not found.' }, { status: 404 }) };
  }
  return { ok: false, response: NextResponse.json({ error: 'Review decisions unavailable.' }, { status: 503 }) };
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Too many review decision requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}

function storageUnavailableResponse() {
  return NextResponse.json({ error: 'Review decision storage is unavailable.' }, { status: 503 });
}

export async function GET(request: Request) {
  const requestId = new URL(request.url).searchParams.get('requestId') ?? '';
  if (!REQUEST_ID_RE.test(requestId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const rateLimit = consumeDeflectionRateLimit(request.headers, requestId, REVIEW_DECISION_RATE_LIMIT);
  if (!rateLimit.ok) return rateLimitResponse(rateLimit.retryAfterSeconds);

  const access = await validateReportAccess(requestId);
  if (!access.ok) return access.response;

  let decisions;
  try {
    decisions = await listDeflectionReviewDecisions(requestId);
  } catch {
    return storageUnavailableResponse();
  }
  return NextResponse.json({
    decisions: decisions.filter((decision) => access.reviewKeys.has(decision.reviewKey)),
    persistence: deflectionReviewDecisionDatabaseConfigured() ? 'configured' : 'unconfigured',
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const reviewKey = typeof body?.reviewKey === 'string' ? body.reviewKey.trim() : '';
  const decision = body?.decision;
  if (
    !REQUEST_ID_RE.test(requestId) ||
    !REVIEW_KEY_RE.test(reviewKey) ||
    !isDeflectionReviewDecision(decision)
  ) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const rateLimit = consumeDeflectionRateLimit(request.headers, requestId, REVIEW_DECISION_RATE_LIMIT);
  if (!rateLimit.ok) return rateLimitResponse(rateLimit.retryAfterSeconds);

  const access = await validateReportAccess(requestId);
  if (!access.ok) return access.response;
  if (!access.reviewKeys.has(reviewKey)) {
    return NextResponse.json({ error: 'Review key not found.' }, { status: 404 });
  }
  if (!deflectionReviewDecisionDatabaseConfigured()) {
    return NextResponse.json({ error: 'Review decision storage is not configured.' }, { status: 503 });
  }

  let record;
  try {
    record = await upsertDeflectionReviewDecision({ requestId, reviewKey, decision });
  } catch {
    return storageUnavailableResponse();
  }
  if (!record) {
    return NextResponse.json({ error: 'Review decision storage is not configured.' }, { status: 503 });
  }
  return NextResponse.json({ decision: record });
}
