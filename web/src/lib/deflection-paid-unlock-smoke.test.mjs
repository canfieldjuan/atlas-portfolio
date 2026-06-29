import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  makeVercelCurlFetch,
  runDeflectionPaidUnlockSmoke,
} from '../../scripts/smoke-deflection-paid-unlock.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const ATTEMPT_ID = 'attempt-unit-12345678';
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
const PARTNER_PAID_HTML = PAID_HTML.replace(
  'FULL RESOLUTION AUDIT',
  'FULL DEFLECTION REPORT',
).replace(
  'Your Resolution Audit is ready.',
  'Your Deflection Report is ready.',
).replace('Full audit contents', 'Full report contents');
const MODEL_PAID_HTML = [
  '<main>',
  '<span>FULL RESOLUTION AUDIT</span>',
  '<h1>Your Resolution Audit is ready.</h1>',
  '<div>Full audit dashboard</div>',
  '<strong>Help-desk SEO targeting list</strong>',
  '<strong>Ranked question opportunities</strong>',
  '<div>Top publishable answers and gaps</div>',
  '</main>',
].join('');
const PARTNER_MODEL_PAID_HTML = MODEL_PAID_HTML.replace(
  'FULL RESOLUTION AUDIT',
  'FULL DEFLECTION REPORT',
).replace(
  'Your Resolution Audit is ready.',
  'Your Deflection Report is ready.',
).replace('Full audit dashboard', 'Full report dashboard');

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
  ).then((result) => ({ awaitingPayment, fetchImpl, result }));
}

function expectPaidMarkers(markers) {
  expect(markers).toEqual({
    paidReportBadge: true,
    paidHeadline: true,
    reportContents: true,
    seoTargeting: true,
    rankedQuestions: true,
    reviewerGuidance: true,
  });
}

async function readReportPageSource() {
  return readFile(new URL('../components/landing/DeflectionReportArtifactPage.tsx', import.meta.url), 'utf8');
}

describe('deflection paid unlock smoke guard', () => {
  it('renders an already-unlocked paid Resolution Audit report', async () => {
    const { fetchImpl, result } = await run({}, [
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: PAID_HTML },
    ]);

    expect(result).toMatchObject({
      ok: true,
      status: 'paid_rendered',
      initialStatus: 'unlocked',
      checkoutUrl: undefined,
    });
    expectPaidMarkers(result.markers);
    expect(fetchImpl.calls).toHaveLength(2);
    expect(fetchImpl.calls[0].url).toBe(
      'https://portfolio.example.com/api/deflection-report-status?requestId=content-ops-unit-123',
    );
    expect(fetchImpl.calls[1].url).toBe(
      'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
    );
  });

  it('renders an already-unlocked report when requireUnlocked is enabled', async () => {
    const { fetchImpl, result } = await run({ requireUnlocked: true }, [
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: PAID_HTML },
    ]);

    expect(result).toMatchObject({
      ok: true,
      initialStatus: 'unlocked',
      requireUnlocked: true,
      checkoutUrl: undefined,
    });
    expect(fetchImpl.calls).toHaveLength(2);
  });

  it.each([
    ['partner legacy artifact', PARTNER_PAID_HTML],
    ['partner model-backed artifact', PARTNER_MODEL_PAID_HTML],
    ['standard model-backed artifact', MODEL_PAID_HTML],
  ])('accepts %s paid render markers', async (_name, html) => {
    const { fetchImpl, result } = await run({ requireUnlocked: true }, [
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: html },
    ]);

    expect(result).toMatchObject({
      ok: true,
      initialStatus: 'unlocked',
      requireUnlocked: true,
    });
    expectPaidMarkers(result.markers);
    expect(fetchImpl.calls).toHaveLength(2);
  });

  it('fails closed when requireUnlocked sees a locked report', async () => {
    const { fetchImpl, result } = await run({ requireUnlocked: true }, [
      { status: 200, body: { status: 'locked' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'status',
      initialStatus: 'locked',
      requireUnlocked: true,
      error: 'Paid unlock smoke requires an already-unlocked report.',
    });
    expect(fetchImpl.calls).toHaveLength(1);
  });

  it('creates a test Checkout session, emits awaiting-payment artifact, and polls until unlocked', async () => {
    const { awaitingPayment, fetchImpl, result } = await run({}, [
      { status: 200, body: { status: 'locked' } },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
      { status: 200, body: { status: 'locked' } },
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: PAID_HTML },
    ]);

    expect(result).toMatchObject({
      ok: true,
      initialStatus: 'locked',
      checkoutMode: 'test',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_unit',
      unlockPolls: 2,
    });
    expect(fetchImpl.calls).toHaveLength(5);
    expect(awaitingPayment).toHaveLength(1);
    expect(awaitingPayment[0]).toMatchObject({
      fetchCallsBeforePoll: 2,
      artifact: {
        stage: 'awaiting_payment',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_unit',
        requestId: REQUEST_ID,
        attemptId: ATTEMPT_ID,
      },
    });
    expect(fetchImpl.calls[1].init.method).toBe('POST');
    expect(JSON.parse(fetchImpl.calls[1].init.body)).toEqual({
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
    });
  });

  it('waits on a provided test Checkout URL without creating a new session', async () => {
    const { awaitingPayment, fetchImpl, result } = await run(
      { checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_existing' },
      [
        { status: 200, body: { status: 'locked' } },
        { status: 200, body: { status: 'unlocked' } },
        { status: 200, kind: 'html', body: PAID_HTML },
      ],
    );

    expect(result).toMatchObject({
      ok: true,
      initialStatus: 'locked',
      checkoutMode: 'test',
      checkoutSource: 'provided',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_existing',
      unlockPolls: 1,
    });
    expect(fetchImpl.calls).toHaveLength(3);
    expect(fetchImpl.calls.some((call) => call.init.method === 'POST')).toBe(false);
    expect(awaitingPayment).toHaveLength(1);
    expect(awaitingPayment[0].artifact.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_existing');
  });

  it('refuses to wait on a live-mode Checkout URL by default', async () => {
    const { fetchImpl, result } = await run({}, [
      { status: 200, body: { status: 'locked' } },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'checkout_mode',
      checkoutMode: 'live',
      error: 'Refusing to wait on a live-mode Stripe Checkout Session.',
    });
    expect(fetchImpl.calls).toHaveLength(2);
  });

  it('allows live Checkout polling only when explicitly enabled', async () => {
    const { result } = await run({ allowLiveCheckout: true }, [
      { status: 200, body: { status: 'locked' } },
      { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_live_unit' } },
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: PAID_HTML },
    ]);

    expect(result).toMatchObject({
      ok: true,
      checkoutMode: 'live',
    });
  });

  it('renders immediately when checkout reports the request is already paid', async () => {
    const { result } = await run({}, [
      { status: 200, body: { status: 'locked' } },
      { status: 200, body: { alreadyPaid: true } },
      { status: 200, kind: 'html', body: PAID_HTML },
    ]);

    expect(result).toMatchObject({
      ok: true,
      initialStatus: 'locked',
      checkoutMode: undefined,
    });
  });

  it.each([
    {
      name: 'invalid request id',
      options: { requestId: '../bad' },
      responses: [{ status: 200, body: { status: 'unlocked' } }],
      error: 'Paid unlock smoke request id is invalid.',
    },
    {
      name: 'invalid base URL',
      options: { baseUrl: 'http://evil.example.com' },
      responses: [{ status: 200, body: { status: 'unlocked' } }],
      error: 'Paid unlock smoke base URL is invalid.',
    },
  ])('fails closed before network calls for $name', async ({ error, options, responses }) => {
    const { fetchImpl, result } = await run(options, responses);

    expect(result).toMatchObject({
      ok: false,
      error,
      apiCalls: false,
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it.each([
    {
      name: 'status HTTP failure',
      responses: [{ status: 503, body: { error: 'Report status unavailable.' } }],
      stage: 'status',
      error: 'Report status failed with HTTP 503.',
    },
    {
      name: 'invalid status envelope',
      responses: [{ status: 200, body: { status: 'pending' } }],
      stage: 'status',
      error: 'Report status returned an invalid envelope.',
    },
    {
      name: 'non-Stripe checkout URL',
      responses: [
        { status: 200, body: { status: 'locked' } },
        { status: 200, body: { url: 'https://evil.example.com/c/pay/cs_test_unit' } },
      ],
      stage: 'checkout',
      error: 'Checkout route did not return a Stripe Checkout URL.',
    },
    {
      name: 'unlock timeout',
      responses: [
        { status: 200, body: { status: 'locked' } },
        { status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_unit' } },
        { status: 200, body: { status: 'locked' } },
        { status: 200, body: { status: 'locked' } },
        { status: 200, body: { status: 'locked' } },
        { status: 200, body: { status: 'locked' } },
      ],
      stage: 'unlock',
      error: 'Timed out waiting for paid report unlock.',
      checkoutMode: 'test',
    },
  ])('reports $name with exact stage and error', async ({ checkoutMode, error, responses, stage }) => {
    const { result } = await run({}, responses);

    expect(result).toMatchObject({
      ok: false,
      stage,
      error,
      ...(checkoutMode ? { checkoutMode } : {}),
    });
  });

  it('reports missing paid render markers exactly', async () => {
    const { result } = await run({}, [
      { status: 200, body: { status: 'unlocked' } },
      {
        status: 200,
        kind: 'html',
        body: PAID_HTML.replace('FULL RESOLUTION AUDIT', 'YOUR RESOLUTION AUDIT SNAPSHOT'),
      },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'render',
      error: 'Paid results page did not render the unlocked report.',
    });
    expect(result.missing).toEqual(['paidReportBadge']);
  });

  it('routes protected-preview GET requests through vercel curl', async () => {
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

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'locked' });
    expect(execCalls).toHaveLength(1);
    expect(execCalls[0].command).toBe('vercel');
    expect(execCalls[0].args).toEqual([
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
    expect(execCalls[0].options.cwd).toBe('/tmp/portfolio');
  });

  it('routes protected-preview POST bodies through vercel curl', async () => {
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

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test_unit',
    });
    expect(execCalls[0].args.slice(-4)).toEqual([
      '--header',
      'Content-Type: application/json',
      '--data-binary',
      JSON.stringify({ requestId: REQUEST_ID, attemptId: ATTEMPT_ID }),
    ]);
  });

  it('preserves non-OK vercel curl responses', async () => {
    const fetchImpl = makeVercelCurlFetch({
      deployment: 'atlas-portfolio-preview',
      execFileImpl: async () => ({
        stdout: '{"error":"Protected deployment"}\n__ATLAS_HTTP_STATUS__:401',
      }),
    });
    const response = await fetchImpl('https://portfolio.example.com/api/deflection-checkout');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Protected deployment' });
  });

  it('rejects vercel curl output without an HTTP status marker', async () => {
    const fetchImpl = makeVercelCurlFetch({
      deployment: 'atlas-portfolio-preview',
      execFileImpl: async () => ({ stdout: '{"status":"locked"}' }),
    });

    await expect(fetchImpl('https://portfolio.example.com/api/deflection-report-status')).rejects.toThrow(
      /vercel curl did not return an HTTP status marker/,
    );
  });

  it('fails paid render when a locked-page CTA leaks into the paid page', async () => {
    const { result } = await run({}, [
      { status: 200, body: { status: 'unlocked' } },
      { status: 200, kind: 'html', body: `${PAID_HTML}<button>Unlock your full Resolution Audit</button>` },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'render',
    });
    expect(result.lockedMarkers).toEqual(['Unlock your full Resolution Audit']);
  });

  it('pins paid artifact source copy and stacked layout', async () => {
    const source = await readReportPageSource();
    const primerRender = '<ReportContentsPrimer artifact={artifact} contentsLabel={copy.contentsLabel} />';
    const reportRender = '<MarkdownDeliverable markdown={artifact.markdown} />';

    expect(source).toContain('function ReportContentsPrimer');
    expect(source).not.toContain('function ReportContentsPanel');
    expect(source).toContain("badge: 'FULL RESOLUTION AUDIT'");
    expect(source).toContain("badge: 'FULL DEFLECTION REPORT'");
    expect(source).toContain("contentsLabel: 'Full audit contents'");
    expect(source).toContain("contentsLabel: 'Full report contents'");
    expect(source).toContain('Relative ranking signal: repeat volume weighted by failure-risk signals.');
    expect(source).toContain('Not a dollar figure or percentage.');
    expect(source).not.toContain('FULL BACKLOG REPORT');
    expect(source).not.toContain('Your complete Support Tax report is ready.');
    expect(source).not.toContain('Paid report contents');
    expect(source).toContain('mt-8 space-y-8');
    expect(source).toContain(primerRender);
    expect(source).toContain(reportRender);
    expect(source.indexOf(primerRender)).toBeLessThan(source.indexOf(reportRender));
    expect(source).not.toContain('lg:grid-cols-[minmax(0,1fr)_320px]');
    expect(source).not.toContain('lg:sticky');
    expect(source).not.toContain('lg:top-6');
    expect(source).not.toContain('lg:self-start');
    expect(source).toContain('overflow-x-auto rounded-xl border border-border');
    expect(source).toContain('w-full min-w-[760px] border-collapse text-left text-sm');
  });
});
