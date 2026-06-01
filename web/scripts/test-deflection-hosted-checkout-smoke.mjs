import assert from 'node:assert/strict';
import { runDeflectionHostedCheckoutSmoke } from './smoke-deflection-hosted-checkout.mjs';

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
  return { result, fetchImpl };
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, 'checkout_created');
  assert.equal(result.requestId, REQUEST_ID);
  assert.equal(result.attemptId, ATTEMPT_ID);
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_unit');
  assert.equal(result.checkoutMode, 'test');
  assert.equal(result.expectedMode, 'any');
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].url, 'https://portfolio.example.com/api/deflection-checkout');
  assert.equal(fetchImpl.calls[0].init.method, 'POST');
  assert.equal(fetchImpl.calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), {
    requestId: REQUEST_ID,
    attemptId: ATTEMPT_ID,
  });
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expectMode: 'test' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, true);
  assert.equal(result.checkoutMode, 'test');
  assert.equal(result.expectedMode, 'test');
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expectMode: 'live' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
  );
  assert.equal(result.ok, true);
  assert.equal(result.checkoutMode, 'live');
  assert.equal(result.expectedMode, 'live');
}

{
  const { result } = await run(
    {
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
      baseUrl: 'https://portfolio.example.com',
      expectMode: 'live',
    },
    { status: 200, body: { alreadyPaid: true } },
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, 'already_paid');
  assert.equal(result.checkoutUrl, undefined);
  assert.equal(result.checkoutMode, undefined);
}

{
  const { result, fetchImpl } = await run(
    { requestId: '../bad', baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted Checkout smoke request id is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, attemptId: 'short', baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted Checkout smoke attempt id is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com', expectMode: 'banana' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted Checkout smoke expected mode is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(result.expectedMode, 'banana');
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'http://evil.example.com' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted Checkout smoke base URL is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 503, body: { error: 'Could not start checkout.' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout');
  assert.equal(result.error, 'Hosted Checkout route failed with HTTP 503.');
  assert.equal(fetchImpl.calls.length, 1);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com', expectMode: 'live' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout_mode');
  assert.equal(result.error, 'Hosted Checkout route returned test mode, expected live.');
  assert.equal(result.checkoutMode, 'test');
  assert.equal(result.expectedMode, 'live');
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/session-without-mode' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout_mode');
  assert.equal(
    result.error,
    'Hosted Checkout route returned a Stripe URL without a Checkout Session id.',
  );
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: { url: 'https://evil.example.com/checkout' } },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout');
  assert.equal(result.error, 'Hosted Checkout route did not return a Stripe Checkout URL.');
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { reject: 'network reset' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout');
  assert.equal(result.error, 'Hosted Checkout route failed before an HTTP response.');
}

console.log('Deflection hosted Checkout smoke tests passed.');
