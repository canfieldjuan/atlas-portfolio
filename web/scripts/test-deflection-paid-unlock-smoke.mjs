import assert from 'node:assert/strict';
import {
  makeVercelCurlFetch,
  runDeflectionPaidUnlockSmoke,
} from './smoke-deflection-paid-unlock.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const ATTEMPT_ID = 'attempt-unit-12345678';
const PAID_HTML = [
  '<main>',
  '<span>FULL BACKLOG REPORT</span>',
  '<h1>Your complete Support Tax report is ready.</h1>',
  '<div>Paid report contents</div>',
  '<strong>Your Help-Desk SEO Targeting List</strong>',
  '<strong>Publishable Help-Center Copy</strong>',
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

function run(options, responses, deps = {}) {
  let clock = 0;
  const fetchImpl = makeFetchMock(responses);
  const awaitingPayment = [];
  const externalAwaitingPayment = deps.onAwaitingPayment;
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
      ...deps,
      onAwaitingPayment: async (artifact) => {
        awaitingPayment.push({ artifact, fetchCallsBeforePoll: fetchImpl.calls.length });
        if (externalAwaitingPayment) await externalAwaitingPayment(artifact);
      },
    },
  ).then((result) => ({ result, fetchImpl, awaitingPayment }));
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
  const { result, fetchImpl } = await run({ requireUnlocked: true }, [
    { status: 200, body: { status: 'unlocked' } },
    { status: 200, kind: 'html', body: PAID_HTML },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.initialStatus, 'unlocked');
  assert.equal(result.requireUnlocked, true);
  assert.equal(result.checkoutUrl, undefined);
  assert.equal(fetchImpl.calls.length, 2);
}

{
  const { result, fetchImpl } = await run({ requireUnlocked: true }, [
    { status: 200, body: { status: 'locked' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'status');
  assert.equal(result.initialStatus, 'locked');
  assert.equal(result.requireUnlocked, true);
  assert.equal(result.error, 'Paid unlock smoke requires an already-unlocked report.');
  assert.equal(fetchImpl.calls.length, 1);
}

{
  const { result, fetchImpl, awaitingPayment } = await run({}, [
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
  assert.equal(awaitingPayment.length, 1);
  assert.equal(awaitingPayment[0].fetchCallsBeforePoll, 2);
  assert.equal(awaitingPayment[0].artifact.stage, 'awaiting_payment');
  assert.equal(awaitingPayment[0].artifact.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_unit');
  assert.equal(awaitingPayment[0].artifact.requestId, REQUEST_ID);
  assert.equal(awaitingPayment[0].artifact.attemptId, ATTEMPT_ID);
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
      body: PAID_HTML.replace('FULL BACKLOG REPORT', 'YOUR DEFLECTION SNAPSHOT'),
    },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Paid results page did not render the unlocked report.');
  assert.deepEqual(result.missing, ['fullReportBadge']);
}

{
  const execCalls = [];
  const fetchImpl = makeVercelCurlFetch({
    deployment: 'https://atlas-portfolio-preview.vercel.app',
    cwd: '/tmp/portfolio',
    execFileImpl: async (command, args, options) => {
      execCalls.push({ command, args, options });
      return {
        stdout: '{"status":"locked"}\n__ATLAS_HTTP_STATUS__:200',
      };
    },
  });
  const response = await fetchImpl(
    'https://atlas-portfolio-preview.vercel.app/api/deflection-report-status?requestId=content-ops-unit-123',
    { headers: { Accept: 'application/json' } },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'locked' });
  assert.equal(execCalls.length, 1);
  assert.equal(execCalls[0].command, 'vercel');
  assert.deepEqual(execCalls[0].args, [
    'curl',
    '/api/deflection-report-status?requestId=content-ops-unit-123',
    '--deployment',
    'https://atlas-portfolio-preview.vercel.app',
    '--',
    '--request',
    'GET',
    '--silent',
    '--show-error',
    '--write-out',
    '\n__ATLAS_HTTP_STATUS__:%{http_code}',
    '--header',
    'Accept: application/json',
  ]);
  assert.equal(execCalls[0].options.cwd, '/tmp/portfolio');
}

{
  const execCalls = [];
  const fetchImpl = makeVercelCurlFetch({
    deployment: 'atlas-portfolio-preview',
    execFileImpl: async (command, args) => {
      execCalls.push({ command, args });
      return {
        stdout: '{"url":"https://checkout.stripe.com/c/pay/cs_test_unit"}\n__ATLAS_HTTP_STATUS__:201',
      };
    },
  });
  const response = await fetchImpl('https://portfolio.example.com/api/deflection-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: REQUEST_ID, attemptId: ATTEMPT_ID }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    url: 'https://checkout.stripe.com/c/pay/cs_test_unit',
  });
  assert.deepEqual(execCalls[0].args.slice(-4), [
    '--header',
    'Content-Type: application/json',
    '--data-binary',
    JSON.stringify({ requestId: REQUEST_ID, attemptId: ATTEMPT_ID }),
  ]);
}

{
  const fetchImpl = makeVercelCurlFetch({
    deployment: 'atlas-portfolio-preview',
    execFileImpl: async () => ({
      stdout: '{"error":"Protected deployment"}\n__ATLAS_HTTP_STATUS__:401',
    }),
  });
  const response = await fetchImpl('https://portfolio.example.com/api/deflection-checkout');

  assert.equal(response.ok, false);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Protected deployment' });
}

{
  const fetchImpl = makeVercelCurlFetch({
    deployment: 'atlas-portfolio-preview',
    execFileImpl: async () => ({ stdout: '{"status":"locked"}' }),
  });

  await assert.rejects(
    () => fetchImpl('https://portfolio.example.com/api/deflection-report-status'),
    /vercel curl did not return an HTTP status marker/,
  );
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
