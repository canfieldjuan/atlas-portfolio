import { NextResponse } from 'next/server';
import { createDeflectionCheckoutSession } from '@/lib/deflection-checkout';
import { authorizeDeflectionCheckout } from '@/lib/atlas-deflection-client';
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

async function serverBoundPriceVariantId(requestId: string): Promise<DeflectionPriceVariantId | null> {
  try {
    return await getGapReportPriceVariantByReportRequestId(requestId);
  } catch (error) {
    console.error(
      'deflection checkout: failed to load saved price variant:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// Creates a Stripe Checkout Session for the configured Backlog Report unlock
// and returns its hosted URL for the client to redirect to. Before charging, ask
// ATLAS to authorize the report and return the canonical Stripe terms. If ATLAS
// does not authorize, no Stripe call is made.
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
  if (!expectedPriceVariantId && priceVariantId !== DEFLECTION_DEFAULT_PRICE_VARIANT_ID) {
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 503 },
    );
  }
  if (priceVariantId !== (expectedPriceVariantId || DEFLECTION_DEFAULT_PRICE_VARIANT_ID)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const authorization = await authorizeDeflectionCheckout(requestId);
  if (!authorization.ok && authorization.reason === 'already_paid') {
    return NextResponse.json({ alreadyPaid: true });
  }
  if (!authorization.ok && authorization.reason === 'not_found') {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }
  if (!authorization.ok) {
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 503 },
    );
  }

  const result = await createDeflectionCheckoutSession(
    requestId,
    attemptId,
    authorization.checkout,
    priceVariantId,
  );
  if (!result.ok) {
    const status =
      result.reason === 'invalid_request' ? 400 : result.reason === 'not_configured' ? 503 : 500;
    return NextResponse.json({ error: 'Could not start checkout.' }, { status });
  }
  return NextResponse.json({ url: result.url });
}
