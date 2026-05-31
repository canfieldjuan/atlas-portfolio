import assert from 'node:assert/strict';
import { runDeflectionPaidUnlockSmoke } from './smoke-deflection-paid-unlock.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const ATTEMPT_ID = 'attempt-unit-12345678';
const PAID_HTML = [
  '<main>',
  '<span>FULL DEFLECTION REPORT</span>',
  '<h1>Your paid report is ready to review.</h1>',
  '<dt>Report summary</dt>',
  '<h2>Drill-down cards</h2>',
  '</main>',
].join('');

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

function run(options, responses) {
  let clock = 0;
  const fetchImpl = makeFetchMock(responses);
  return runDeflectionPaidUnlockSmoke(
    {
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
      baseUrl: 'https://portfolio.example.com',
      maxWaitMs: 5,
      pollMs: 2,
      ...options,
    },
    {
      fetchImpl,
      makeAttemptId: () => ATTEMPT_ID,
      now: () => '2026-05-31T17:45:00.000Z',
      nowMs: () => clock,
      sleepImpl: async (ms) => {
        clock += ms;
      },
    },
  ).then((result) => ({ result, fetchImpl }));
}

{
  const { result, fetchImpl } = await run({}, [
    { status: 200, body: { status: 'unlocked' } },
    { status: 200, kind: 'html', body: PAID_HTML },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'paid_rendered');
  assert.equal(result.initialStatus, 'unlocked');
  assert.equal(result.checkoutUrl, undefined);
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(
    fetchImpl.calls[0].url,
    'https://portfolio.example.com/api/deflection-report-status?requestId=content-ops-unit-123',
  );
  assert.equal(
    fetchImpl.calls[1].url,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  );
}

{
  const { result, fetchImpl } = await run({}, [
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { status: 'unlocked' } },
    { status: 200, kind: 'html', body: PAID_HTML },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.initialStatus, 'locked');
  assert.equal(result.checkoutMode, 'test');
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_unit');
  assert.equal(result.unlockPolls, 2);
  assert.equal(fetchImpl.calls.length, 5);
  assert.equal(fetchImpl.calls[1].init.method, 'POST');
  assert.deepEqual(JSON.parse(fetchImpl.calls[1].init.body), {
    requestId: REQUEST_ID,
    attemptId: ATTEMPT_ID,
  });
}

{
  const { result, fetchImpl } = await run({}, [
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout_mode');
  assert.equal(result.checkoutMode, 'live');
  assert.equal(result.error, 'Refusing to wait on a live-mode Stripe Checkout Session.');
  assert.equal(fetchImpl.calls.length, 2);
}

{
  const { result } = await run({ allowLiveCheckout: true }, [
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
    { status: 200, body: { status: 'unlocked' } },
    { status: 200, kind: 'html', body: PAID_HTML },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.checkoutMode, 'live');
}

{
  const { result } = await run({}, [
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { alreadyPaid: true } },
    { status: 200, kind: 'html', body: PAID_HTML },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.initialStatus, 'locked');
  assert.equal(result.checkoutMode, undefined);
}

{
  const { result, fetchImpl } = await run({ requestId: '../bad' }, [
    { status: 200, body: { status: 'unlocked' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Paid unlock smoke request id is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run({ baseUrl: 'http://evil.example.com' }, [
    { status: 200, body: { status: 'unlocked' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Paid unlock smoke base URL is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result } = await run({}, [
    { status: 503, body: { error: 'Report status unavailable.' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'status');
  assert.equal(result.error, 'Report status failed with HTTP 503.');
}

{
  const { result } = await run({}, [
    { status: 200, body: { status: 'pending' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'status');
  assert.equal(result.error, 'Report status returned an invalid envelope.');
}

{
  const { result } = await run({}, [
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { url: 'https://evil.example.com/c/pay/cs_test_unit' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'checkout');
  assert.equal(result.error, 'Checkout route did not return a Stripe Checkout URL.');
}

{
  const { result } = await run({}, [
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { status: 'locked' } },
    { status: 200, body: { status: 'locked' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'unlock');
  assert.equal(result.error, 'Timed out waiting for paid report unlock.');
  assert.equal(result.checkoutMode, 'test');
}

{
  const { result } = await run({}, [
    { status: 200, body: { status: 'unlocked' } },
    {
      status: 200,
      kind: 'html',
      body: PAID_HTML.replace('FULL DEFLECTION REPORT', 'YOUR DEFLECTION SNAPSHOT'),
    },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Paid results page did not render the unlocked report.');
  assert.deepEqual(result.missing, ['fullReportBadge']);
}

{
  const { result } = await run({}, [
    { status: 200, body: { status: 'unlocked' } },
    { status: 200, kind: 'html', body: `${PAID_HTML}<button>Unlock your full Backlog Report</button>` },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.deepEqual(result.lockedMarkers, ['Unlock your full Backlog Report']);
}

console.log('Deflection paid unlock smoke tests passed.');
