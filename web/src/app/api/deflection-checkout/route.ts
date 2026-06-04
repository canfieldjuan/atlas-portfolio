import { NextResponse } from 'next/server';
import { createDeflectionCheckoutSession } from '@/lib/deflection-checkout';
import { fetchDeflectionArtifact } from '@/lib/atlas-deflection-client';
import { consumeDeflectionRateLimit } from '@/lib/deflection-rate-limit';
import { getGapReportPriceVariantByReportRequestId } from '@/lib/gap-report-intake-database';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from '@/lib/deflection-pricing';

export const runtime = 'nodejs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;
const CHECKOUT_RATE_LIMIT = {
  scope: 'deflection-checkout',
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

async function serverBoundPriceVariantId(requestId: string): Promise<DeflectionPriceVariantId> {
  try {
    return (
      (await getGapReportPriceVariantByReportRequestId(requestId)) ||
      DEFLECTION_DEFAULT_PRICE_VARIANT_ID
    );
  } catch (error) {
    console.error(
      'deflection checkout: failed to load saved price variant:',
      error instanceof Error ? error.message : error,
    );
    return DEFLECTION_DEFAULT_PRICE_VARIANT_ID;
  }
}

// Creates a Stripe Checkout Session for the configured Backlog Report unlock
// and returns its hosted URL for the client to redirect to. Before charging, we
// probe the paid-gated artifact:
//   200 (already unlocked) -> { alreadyPaid: true }  (don't double-charge)
//   404 (no such report)   -> 404                    (don't sell a phantom)
//   403 (exists, unpaid)   -> create the session     (the expected path)
//   error/not_configured   -> 503                    (could be already paid but
//     unparsable; fail closed rather than risk a duplicate charge)
export async function POST(request: Request) {
  let requestId: string;
  let attemptId: string;
  let priceVariantId: DeflectionPriceVariantId;
  try {
    const body = (await request.json()) as {
      requestId?: unknown;
      attemptId?: unknown;
      priceVariant?: unknown;
    };
    if (
      typeof body.requestId !== 'string' ||
      !REQUEST_ID_RE.test(body.requestId) ||
      typeof body.attemptId !== 'string' ||
      !ATTEMPT_ID_RE.test(body.attemptId)
    ) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    requestId = body.requestId;
    attemptId = body.attemptId;
    const priceVariant = resolveDeflectionPriceVariant(body.priceVariant);
    if (!priceVariant) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    priceVariantId = priceVariant.id;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const rateLimit = consumeDeflectionRateLimit(request.headers, requestId, CHECKOUT_RATE_LIMIT);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    );
  }
  const expectedPriceVariantId = await serverBoundPriceVariantId(requestId);
  if (priceVariantId !== expectedPriceVariantId) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const artifact = await fetchDeflectionArtifact(requestId);
  if (artifact.ok) return NextResponse.json({ alreadyPaid: true });
  if (artifact.reason === 'not_found') {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }
  if (artifact.reason !== 'locked') {
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 503 },
    );
  }

  const result = await createDeflectionCheckoutSession(requestId, attemptId, priceVariantId);
  if (!result.ok) {
    const status =
      result.reason === 'invalid_request' ? 400 : result.reason === 'not_configured' ? 503 : 500;
    return NextResponse.json({ error: 'Could not start checkout.' }, { status });
  }
  return NextResponse.json({ url: result.url });
}
