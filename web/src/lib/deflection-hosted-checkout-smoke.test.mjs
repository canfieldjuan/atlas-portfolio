import { describe, expect, it } from 'vitest';
import { runDeflectionHostedCheckoutSmoke } from '../../scripts/smoke-deflection-hosted-checkout.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const ATTEMPT_ID = 'attempt-unit-12345678';

function makeFetchMock(response) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (response.reject) {
      throw new Error(response.reject);
    }
    if (response.body === undefined) {
      return new Response(null, { status: response.status });
    }
    return Response.json(response.body, { status: response.status });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function run(options, response) {
  const fetchImpl = makeFetchMock(response);
  const result = await runDeflectionHostedCheckoutSmoke(options, {
    fetchImpl,
    makeAttemptId: () => ATTEMPT_ID,
    now: () => '2026-05-31T16:15:00.000Z',
  });
  return { fetchImpl, result };
}

describe('deflection hosted Checkout smoke guard', () => {
  it('creates a standard Checkout session by default without sending priceVariant', async () => {
    const { fetchImpl, result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/' },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    );

    expect(result).toMatchObject({
      ok: true,
      status: 'checkout_created',
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_unit',
      checkoutMode: 'test',
      expectedMode: 'any',
      priceVariant: 'standard',
      priceVariantProvided: false,
    });
    expect(fetchImpl.calls).toHaveLength(1);
    expect(fetchImpl.calls[0].url).toBe('https://portfolio.example.com/api/deflection-checkout');
    expect(fetchImpl.calls[0].init.method).toBe('POST');
    expect(fetchImpl.calls[0].init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(fetchImpl.calls[0].init.body)).toEqual({
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
    });
  });

  it.each([
    ['standard', 'test', 'https://checkout.stripe.com/c/pay/cs_test_unit'],
    ['partner', 'live', 'https://checkout.stripe.com/c/pay/cs_live_unit'],
  ])('sends explicit %s price variant and classifies %s checkout mode', async (
    priceVariant,
    checkoutMode,
    checkoutUrl,
  ) => {
    const { fetchImpl, result } = await run(
      {
        requestId: REQUEST_ID,
        baseUrl: 'https://portfolio.example.com/',
        priceVariant,
      },
      { status: 200, body: { url: checkoutUrl } },
    );

    expect(result).toMatchObject({
      ok: true,
      priceVariant,
      priceVariantProvided: true,
      checkoutMode,
    });
    expect(JSON.parse(fetchImpl.calls[0].init.body)).toEqual({
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
      priceVariant,
    });
  });

  it.each([
    ['test', 'https://checkout.stripe.com/c/pay/cs_test_unit'],
    ['live', 'https://checkout.stripe.com/c/pay/cs_live_unit'],
  ])('honors explicit expected %s mode', async (expectMode, checkoutUrl) => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expectMode },
      { status: 200, body: { url: checkoutUrl } },
    );

    expect(result).toMatchObject({
      ok: true,
      checkoutMode: expectMode,
      expectedMode: expectMode,
    });
  });

  it('allows already-paid results unless a Checkout Session is required', async () => {
    const alreadyPaid = await run(
      {
        requestId: REQUEST_ID,
        attemptId: ATTEMPT_ID,
        baseUrl: 'https://portfolio.example.com',
        expectMode: 'live',
      },
      { status: 200, body: { alreadyPaid: true } },
    );
    expect(alreadyPaid.result).toMatchObject({
      ok: true,
      status: 'already_paid',
      expectedMode: 'live',
      requireCheckoutSession: false,
    });
    expect(alreadyPaid.result.checkoutUrl).toBeUndefined();
    expect(alreadyPaid.result.checkoutMode).toBeUndefined();

    const requiredSession = await run(
      {
        requestId: REQUEST_ID,
        attemptId: ATTEMPT_ID,
        baseUrl: 'https://portfolio.example.com',
        expectMode: 'live',
        requireCheckoutSession: true,
      },
      { status: 200, body: { alreadyPaid: true } },
    );
    expect(requiredSession.result).toMatchObject({
      ok: false,
      stage: 'checkout_session',
      error: 'Hosted Checkout route returned already_paid before creating a Checkout Session.',
      expectedMode: 'live',
      requireCheckoutSession: true,
    });
  });

  it.each([
    [
      'request id',
      { requestId: '../bad', baseUrl: 'https://portfolio.example.com' },
      'Hosted Checkout smoke request id is invalid.',
      { requestId: '../bad' },
    ],
    [
      'attempt id',
      { requestId: REQUEST_ID, attemptId: 'short', baseUrl: 'https://portfolio.example.com' },
      'Hosted Checkout smoke attempt id is invalid.',
      { requestId: REQUEST_ID, attemptId: 'short' },
    ],
    [
      'expected mode',
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com', expectMode: 'banana' },
      'Hosted Checkout smoke expected mode is invalid.',
      { expectedMode: 'banana' },
    ],
    [
      'price variant',
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com', priceVariant: 'coupon' },
      'Hosted Checkout smoke price variant is invalid.',
      { priceVariant: 'coupon', priceVariantProvided: true },
    ],
    [
      'base URL',
      { requestId: REQUEST_ID, baseUrl: 'http://evil.example.com' },
      'Hosted Checkout smoke base URL is invalid.',
      {},
    ],
  ])('fails before API calls for invalid %s', async (_label, options, error, expected) => {
    const { fetchImpl, result } = await run(
      options,
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    );

    expect(result).toMatchObject({
      ok: false,
      error,
      apiCalls: false,
      ...expected,
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it('surfaces hosted checkout HTTP and fetch failures', async () => {
    const httpFailure = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      { status: 503, body: { error: 'Could not start checkout.' } },
    );
    expect(httpFailure.result).toMatchObject({
      ok: false,
      stage: 'checkout',
      error: 'Hosted Checkout route failed with HTTP 503.',
    });
    expect(httpFailure.fetchImpl.calls).toHaveLength(1);

    const fetchFailure = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      { reject: 'network reset' },
    );
    expect(fetchFailure.result).toMatchObject({
      ok: false,
      stage: 'checkout',
      error: 'Hosted Checkout route failed before an HTTP response.',
    });
  });

  it('fails closed on checkout mode mismatches and invalid checkout URLs', async () => {
    const modeMismatch = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com', expectMode: 'live' },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    );
    expect(modeMismatch.result).toMatchObject({
      ok: false,
      stage: 'checkout_mode',
      error: 'Hosted Checkout route returned test mode, expected live.',
      checkoutMode: 'test',
      expectedMode: 'live',
    });

    const missingSession = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/session-without-mode' } },
    );
    expect(missingSession.result).toMatchObject({
      ok: false,
      stage: 'checkout_mode',
      error: 'Hosted Checkout route returned a Stripe URL without a Checkout Session id.',
    });

    const nonStripeUrl = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      { status: 200, body: { url: 'https://evil.example.com/checkout' } },
    );
    expect(nonStripeUrl.result).toMatchObject({
      ok: false,
      stage: 'checkout',
      error: 'Hosted Checkout route did not return a Stripe Checkout URL.',
    });
  });
});
