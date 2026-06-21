import { NextRequest, NextResponse } from 'next/server';
import { matchLocal, type DeflectionSearchResponse } from '@/lib/deflection-demo';
import {
  fetchDeflectionArtifact,
  fetchDeflectionReportModel,
  searchUploadedDeflectionReport,
} from '@/lib/atlas-deflection-client';
import {
  consumeDeflectionRateLimit,
  type DeflectionRateLimitConfig,
} from '@/lib/deflection-rate-limit';
import { uploadedDeflectionSearchEnabled } from '@/lib/deflection-uploaded-search-config';

// Backend seam for the Support Ticket Deflection demo.
//
//   GET /api/demo/deflection-search?q=<query>
//   -> 200 { match: TicketFAQItem | null, source: 'local' }
//
//   POST /api/demo/deflection-search { requestId, q }
//   -> 200 { match: TicketFAQItem | null, source: 'atlas' }
//
// The canonical ATLAS report contract is
// docs/frontend/content_ops_faq_report_contract.md in canfieldjuan/ATLAS.
// Compact search rows are only previews and do not include term_mappings,
// evidence, steps, or the top-level artifact markdown, so this endpoint does
// not adapt compact search into a fake full report item. Wire live hydration to
// the full FAQDeflectionReportArtifact / TicketFAQItem source in a later slice.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_Q = 256;
const UPLOADED_SEARCH_RATE_LIMIT = {
  scope: 'deflection-uploaded-search',
  limit: 20,
  windowMs: 60 * 1000,
} satisfies DeflectionRateLimitConfig;
const UPLOADED_SEARCH_CLIENT_RATE_LIMIT = {
  scope: 'deflection-uploaded-search-client',
  limit: 40,
  windowMs: 60 * 1000,
} satisfies DeflectionRateLimitConfig;
const UPLOADED_SEARCH_CLIENT_BUCKET = 'all';
const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

function uploadedSearchFailureResponse(reason: string) {
  const status =
    reason === 'not_configured'
      ? 503
      : reason === 'not_found'
        ? 404
        : reason === 'locked'
          ? 403
          : 502;
  return NextResponse.json(
    {
      match: null,
      source: 'atlas',
      error: 'Uploaded report search is temporarily unavailable. Please try again.',
    },
    { status },
  );
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { match: null, source: 'atlas', error: 'Too many searches. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}

async function uploadedSearchAccessReason(
  requestId: string,
): Promise<'ok' | 'locked' | 'not_found' | 'not_configured' | 'error'> {
  const model = await fetchDeflectionReportModel(requestId);
  if (model.ok) return 'ok';
  if (model.reason === 'locked') return 'locked';
  if (model.reason === 'not_configured') return 'not_configured';
  if (model.reason !== 'not_found') return 'error';
  const artifact = await fetchDeflectionArtifact(requestId);
  if (artifact.ok) return 'ok';
  return artifact.reason;
}

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_Q);
    const response: DeflectionSearchResponse = {
      match: q ? matchLocal(q) : null,
      source: 'local',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('deflection-search: unexpected error:', error);
    return NextResponse.json(
      { match: null, error: 'Search failed. Please try again.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!uploadedDeflectionSearchEnabled()) {
      return NextResponse.json(
        {
          match: null,
          source: 'atlas',
          error: 'Uploaded report search is not enabled.',
        },
        { status: 404 },
      );
    }

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const requestId = typeof payload?.requestId === 'string' ? payload.requestId.trim() : '';
    const q = typeof payload?.q === 'string' ? payload.q.trim().slice(0, MAX_Q) : '';
    if (!REQUEST_ID_RE.test(requestId)) {
      return NextResponse.json({ match: null, source: 'atlas', error: 'Invalid request.' }, { status: 400 });
    }
    const clientRateLimit = consumeDeflectionRateLimit(
      request.headers,
      UPLOADED_SEARCH_CLIENT_BUCKET,
      UPLOADED_SEARCH_CLIENT_RATE_LIMIT,
    );
    if (!clientRateLimit.ok) return rateLimitResponse(clientRateLimit.retryAfterSeconds);

    const rateLimit = consumeDeflectionRateLimit(
      request.headers,
      requestId,
      UPLOADED_SEARCH_RATE_LIMIT,
    );
    if (!rateLimit.ok) return rateLimitResponse(rateLimit.retryAfterSeconds);
    const accessReason = await uploadedSearchAccessReason(requestId);
    if (accessReason !== 'ok') return uploadedSearchFailureResponse(accessReason);

    const result = await searchUploadedDeflectionReport({ requestId, query: q });
    if (!result.ok) return uploadedSearchFailureResponse(result.reason);
    return NextResponse.json({
      match: result.item,
      source: 'atlas',
    } satisfies DeflectionSearchResponse);
  } catch (error) {
    console.error('deflection uploaded search: unexpected error:', error);
    return uploadedSearchFailureResponse('error');
  }
}
