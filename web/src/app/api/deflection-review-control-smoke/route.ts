import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SUCCESS_REQUEST_ID = 'smoke-review-control';
const UNCONFIGURED_REQUEST_ID = 'smoke-review-control-unconfigured';
const FAILURE_REQUEST_ID = 'smoke-review-control-failure';
const SUCCESS_REVIEW_KEY = 'review_111111111111111111111111';
const FAILURE_REVIEW_KEY = 'review_222222222222222222222222';
const REVIEW_KEY_RE = /^review_[0-9a-f]{24}$/;
const DECISIONS = new Set(['keep_suppressed', 'promote_to_review']);

function unavailableInProduction() {
  if (process.env.NODE_ENV !== 'production') return null;
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}

function invalidRequest() {
  return NextResponse.json({ error: 'Invalid smoke request.' }, { status: 400 });
}

export async function GET(request: Request) {
  const productionResponse = unavailableInProduction();
  if (productionResponse) return productionResponse;

  const requestId = new URL(request.url).searchParams.get('requestId') ?? '';
  if (requestId === SUCCESS_REQUEST_ID || requestId === FAILURE_REQUEST_ID) {
    return NextResponse.json({
      decisions: [
        {
          requestId,
          reviewKey: SUCCESS_REVIEW_KEY,
          decision: 'keep_suppressed',
          updatedAt: '2026-06-24T00:00:00.000Z',
        },
      ],
      persistence: 'configured',
    });
  }
  if (requestId === UNCONFIGURED_REQUEST_ID) {
    return NextResponse.json({
      decisions: [],
      persistence: 'unconfigured',
    });
  }

  return invalidRequest();
}

export async function POST(request: Request) {
  const productionResponse = unavailableInProduction();
  if (productionResponse) return productionResponse;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const reviewKey = typeof body?.reviewKey === 'string' ? body.reviewKey.trim() : '';
  const decision = body?.decision;

  if (
    ![SUCCESS_REQUEST_ID, FAILURE_REQUEST_ID].includes(requestId) ||
    !REVIEW_KEY_RE.test(reviewKey) ||
    typeof decision !== 'string' ||
    !DECISIONS.has(decision)
  ) {
    return invalidRequest();
  }
  if (requestId === FAILURE_REQUEST_ID && reviewKey === FAILURE_REVIEW_KEY) {
    return NextResponse.json({ error: 'Smoke save failed.' }, { status: 503 });
  }

  return NextResponse.json({
    decision: {
      requestId,
      reviewKey,
      decision,
      updatedAt: new Date().toISOString(),
    },
  });
}
