import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { runDeflectionStandardPriceChainSmoke } from '../../scripts/smoke-deflection-standard-price-chain.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const ATTEMPT_ID = 'attempt-unit-12345678';
const ALLOWED_AMOUNT_ENV =
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';
const DEFAULT_ENV = {
  [ALLOWED_AMOUNT_ENV]: '180000,200000',
  ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit',
};
const PAID_HTML = [
  '<main>',
  '<span>FULL RESOLUTION AUDIT</span>',
  '<h1>Your Resolution Audit is ready.</h1>',
  '<div>Full audit contents</div>',
  '<strong>Your Help-Desk SEO Targeting List</strong>',
  '<strong>Publishable Help-Center Copy</strong>',
  '<div>Reviewer guidance</div>',
  '</main>',
].join('');

function termsBody(amountCents = 180000) {
  return {
    ok: true,
    variant: 'standard',
    status: 'configured',
    amount_cents: amountCents,
    currency: 'USD',
    price_label: '$1,800',
  };
}

function stripeSessionBody(amountCents = 180000) {
  return {
    id: 'cs_test_unit',
    amount_total: amountCents,
    currency: 'usd',
    metadata: {
      request_id: REQUEST_ID,
      price_id: 'price_standard_unit',
      price_amount_cents: String(amountCents),
      price_currency: 'usd',
    },
  };
}

function makeFetchMock(responses) {
  const calls = [];
  const queue = [...responses];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const response = queue.shift();
    if (!response) throw new Error(`Unexpected fetch: ${url}`);
    if (response.reject) throw new Error(response.reject);
    if (response.kind === 'html') {
      return new Response(response.body ?? '', { status: response.status });
    }
    return Response.json(response.body, { status: response.status });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function run(options = {}, portfolioResponses = [], stripeResponses = [], deps = {}) {
  let clock = 0;
  const fetchImpl = makeFetchMock(portfolioResponses);
  const stripeFetchImpl = makeFetchMock(stripeResponses);
  const awaitingPayment = [];
  const result = await runDeflectionStandardPriceChainSmoke(
    {
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
      baseUrl: 'https://portfolio.example.com',
      maxWaitMs: 5,
      pollMs: 2,
      ...options,
      env: { ...DEFAULT_ENV, ...(options.env ?? {}) },
    },
    {
      fetchImpl,
      stripeFetchImpl,
      makeAttemptId: () => ATTEMPT_ID,
      now: () => '2026-06-23T19:00:00.000Z',
      nowMs: () => clock,
      sleepImpl: async (ms) => {
        clock += ms;
      },
      ...deps,
      onAwaitingPayment: async (artifact) => {
        awaitingPayment.push(artifact);
        if (deps.onAwaitingPayment) await deps.onAwaitingPayment(artifact);
      },
    },
  );
  return { awaitingPayment, fetchImpl, result, stripeFetchImpl };
}

describe('deflection standard price-chain smoke guard', () => {
  it('keeps JSON progress and fallback Stripe key safety in the CLI source', async () => {
    const source = await readFile(
      new URL('../../scripts/smoke-deflection-standard-price-chain.mjs', import.meta.url),
      'utf8',
    );

    expect(source).toContain('const logProgress = outputJson ? console.error : console.log;');
    expect(source).toContain("if (!fallbackKey.startsWith('sk_test_'))");
  });

  it('fails closed before checkout when Stripe read credentials are absent or live-only', async () => {
    const missingKey = await run(
      { env: { [ALLOWED_AMOUNT_ENV]: '180000', ATLAS_SAAS_STRIPE_RAK: '' } },
      [{ status: 200, body: termsBody() }],
    );
    expect(missingKey.result).toMatchObject({
      ok: false,
      stage: 'stripe_env',
      error:
        'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY is required to read the Stripe Session.',
    });
    expect(missingKey.fetchImpl.calls).toHaveLength(1);
    expect(missingKey.stripeFetchImpl.calls).toHaveLength(0);

    const liveFallbackKey = await run(
      {
        env: {
          [ALLOWED_AMOUNT_ENV]: '180000',
          ATLAS_SAAS_STRIPE_RAK: '',
          ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_live_unit',
        },
      },
      [{ status: 200, body: termsBody() }],
    );
    expect(liveFallbackKey.result).toMatchObject({
      ok: false,
      stage: 'stripe_env',
      error: 'ATLAS_SAAS_STRIPE_SECRET_KEY must start with sk_test_.',
    });
    expect(liveFallbackKey.fetchImpl.calls).toHaveLength(1);
    expect(liveFallbackKey.stripeFetchImpl.calls).toHaveLength(0);
  });

  it('verifies standard terms, hosted checkout, Stripe Session, and paid unlock handoff', async () => {
    const { awaitingPayment, fetchImpl, result, stripeFetchImpl } = await run({}, [
      { status: 200, body: termsBody() },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
      { status: 200, body: { status: 'locked' } },
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: PAID_HTML },
    ], [
      { status: 200, body: stripeSessionBody() },
    ]);

    expect(result).toMatchObject({
      ok: true,
      mode: 'DEFLECTION_STANDARD_PRICE_CHAIN_SMOKE',
      allowedAmountsCents: [180000, 200000],
      checkoutMode: 'test',
      stripeSessionId: 'cs_test_unit',
      stripeSession: { amountCents: 180000 },
      paidUnlock: {
        checkoutSource: 'provided',
        resultsUrl: 'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
      },
    });
    expect(result.terms).toEqual({
      variant: 'standard',
      status: 'configured',
      amountCents: 180000,
      currency: 'usd',
      priceLabel: '$1,800',
    });
    expect(awaitingPayment).toHaveLength(1);
    expect(awaitingPayment[0].checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_unit');
    expect(fetchImpl.calls).toHaveLength(5);
    expect(JSON.parse(fetchImpl.calls[1].init.body)).toEqual({
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
      priceVariant: 'standard',
    });
    expect(fetchImpl.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
    expect(stripeFetchImpl.calls).toHaveLength(1);
    expect(stripeFetchImpl.calls[0].url).toBe(
      'https://api.stripe.com/v1/checkout/sessions/cs_test_unit',
    );
    expect(stripeFetchImpl.calls[0].init.headers['Stripe-Version']).toBe('2026-05-27.dahlia');
  });

  it('fails when the portfolio standard price is outside the ATLAS allowed amount set', async () => {
    const { fetchImpl, result, stripeFetchImpl } = await run(
      { env: { [ALLOWED_AMOUNT_ENV]: '200000', ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit' } },
      [{ status: 200, body: termsBody() }],
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'allowed_amounts',
      error: 'ATLAS standard pricing amount is not present in the portfolio allowed amount set.',
      allowedAmountsCents: [200000],
    });
    expect(fetchImpl.calls).toHaveLength(1);
    expect(stripeFetchImpl.calls).toHaveLength(0);
  });

  it('fails when Stripe Session amount does not match ATLAS terms', async () => {
    const { fetchImpl, result, stripeFetchImpl } = await run({}, [
      { status: 200, body: termsBody() },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    ], [
      { status: 200, body: stripeSessionBody(170000) },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'stripe_session',
      error: 'Stripe Checkout Session amount_total does not match ATLAS terms.',
    });
    expect(fetchImpl.calls).toHaveLength(2);
    expect(stripeFetchImpl.calls).toHaveLength(1);
  });

  it('refuses to verify and wait on live-mode Checkout Sessions by default', async () => {
    const { fetchImpl, result, stripeFetchImpl } = await run({}, [
      { status: 200, body: termsBody() },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'checkout_mode',
      checkoutMode: 'live',
      error: 'Refusing to verify and wait on a live-mode Stripe Checkout Session.',
    });
    expect(fetchImpl.calls).toHaveLength(2);
    expect(stripeFetchImpl.calls).toHaveLength(0);
  });

  it('surfaces standard pricing terms HTTP failures before checkout', async () => {
    const { fetchImpl, result } = await run({}, [
      { status: 503, body: { ok: false, error: 'Price unavailable.' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'pricing_terms',
      error: 'Standard pricing terms failed with HTTP 503.',
    });
    expect(fetchImpl.calls).toHaveLength(1);
  });
});
