import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runDeflectionStandardPriceChainSmoke } from './smoke-deflection-standard-price-chain.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const ATTEMPT_ID = 'attempt-unit-12345678';
const ALLOWED_AMOUNT_ENV =
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';
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
      env: {
        [ALLOWED_AMOUNT_ENV]: '180000,200000',
        ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit',
      },
      ...options,
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
  return { result, fetchImpl, stripeFetchImpl, awaitingPayment };
}

{
  const source = await readFile(
    new URL('./smoke-deflection-standard-price-chain.mjs', import.meta.url),
    'utf8',
  );
  assert(
    source.includes('const logProgress = outputJson ? console.error : console.log;'),
    'JSON mode should keep interim progress prompts off stdout',
  );
  assert(
    source.includes("if (!fallbackKey.startsWith('sk_test_'))"),
    'full live secret keys should not be accepted as fallback Stripe read keys',
  );
}

{
  const { result, fetchImpl, stripeFetchImpl } = await run(
    { env: { [ALLOWED_AMOUNT_ENV]: '180000' } },
    [
      { status: 200, body: termsBody() },
    ],
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, 'stripe_env');
  assert.equal(
    result.error,
    'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY is required to read the Stripe Session.',
  );
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(stripeFetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl, stripeFetchImpl } = await run(
    { env: { [ALLOWED_AMOUNT_ENV]: '180000', ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_live_unit' } },
    [
      { status: 200, body: termsBody() },
    ],
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, 'stripe_env');
  assert.equal(result.error, 'ATLAS_SAAS_STRIPE_SECRET_KEY must start with sk_test_.');
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(stripeFetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl, stripeFetchImpl, awaitingPayment } = await run({}, [
    { status: 200, body: termsBody() },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { status: 'unlocked' } },
    { status: 200, kind: 'html', body: PAID_HTML },
  ], [
    { status: 200, body: stripeSessionBody() },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'DEFLECTION_STANDARD_PRICE_CHAIN_SMOKE');
  assert.deepEqual(result.terms, {
    variant: 'standard',
    status: 'configured',
    amountCents: 180000,
    currency: 'usd',
    priceLabel: '$1,800',
  });
  assert.deepEqual(result.allowedAmountsCents, [180000, 200000]);
  assert.equal(result.checkoutMode, 'test');
  assert.equal(result.stripeSessionId, 'cs_test_unit');
  assert.equal(result.stripeSession.amountCents, 180000);
  assert.equal(result.paidUnlock.checkoutSource, 'provided');
  assert.equal(result.paidUnlock.resultsUrl, 'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123');
  assert.equal(awaitingPayment.length, 1);
  assert.equal(awaitingPayment[0].checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_unit');
  assert.equal(fetchImpl.calls.length, 5);
  assert.deepEqual(JSON.parse(fetchImpl.calls[1].init.body), {
    requestId: REQUEST_ID,
    attemptId: ATTEMPT_ID,
    priceVariant: 'standard',
  });
  assert.equal(fetchImpl.calls.filter((call) => call.init.method === 'POST').length, 1);
  assert.equal(stripeFetchImpl.calls.length, 1);
  assert.equal(
    stripeFetchImpl.calls[0].url,
    'https://api.stripe.com/v1/checkout/sessions/cs_test_unit',
  );
  assert.equal(stripeFetchImpl.calls[0].init.headers['Stripe-Version'], '2026-05-27.dahlia');
}

{
  const { result, fetchImpl, stripeFetchImpl } = await run(
    { env: { [ALLOWED_AMOUNT_ENV]: '200000', ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit' } },
    [
      { status: 200, body: termsBody() },
    ],
  );

  assert.equal(result.ok, false);
  assert.equal(result.stage, 'allowed_amounts');
  assert.equal(
    result.error,
    'ATLAS standard pricing amount is not present in the portfolio allowed amount set.',
  );
  assert.deepEqual(result.allowedAmountsCents, [200000]);
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(stripeFetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl, stripeFetchImpl } = await run({}, [
    { status: 200, body: termsBody() },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  ], [
    { status: 200, body: stripeSessionBody(170000) },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.stage, 'stripe_session');
  assert.equal(
    result.error,
    'Stripe Checkout Session amount_total does not match ATLAS terms.',
  );
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(stripeFetchImpl.calls.length, 1);
}

{
  const { result, fetchImpl, stripeFetchImpl } = await run({}, [
    { status: 200, body: termsBody() },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout_mode');
  assert.equal(result.checkoutMode, 'live');
  assert.equal(result.error, 'Refusing to verify and wait on a live-mode Stripe Checkout Session.');
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(stripeFetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run({}, [
    { status: 503, body: { ok: false, error: 'Price unavailable.' } },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.stage, 'pricing_terms');
  assert.equal(result.error, 'Standard pricing terms failed with HTTP 503.');
  assert.equal(fetchImpl.calls.length, 1);
}

console.log('Deflection standard price-chain smoke tests passed.');
