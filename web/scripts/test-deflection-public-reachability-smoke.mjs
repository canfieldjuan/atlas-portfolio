import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runDeflectionPublicReachabilitySmoke } from './smoke-deflection-public-reachability.mjs';

const LANDING_URL = 'https://portfolio.example.com/systems/support-ticket-deflection';
const INTAKE_URL = `${LANDING_URL}/intake`;
const GOOD_LANDING = [
  'SUPPORT TICKET DEFLECTION',
  '<a href="/systems/support-ticket-deflection/intake">',
  'Upload your tickets, get a free Deflection Snapshot',
  'PRICING',
].join('');
const GOOD_INTAKE = [
  'UPLOAD YOUR CSV',
  'Upload your tickets. Get the repeat-question snapshot in seconds.',
  'Work email',
  'Upload CSV, get your free Deflection Snapshot',
].join('');

function routes({ landing = {}, intake = {} } = {}) {
  return new Map([
    [LANDING_URL, { status: landing.status ?? 200, body: landing.body ?? GOOD_LANDING, reject: landing.reject }],
    [INTAKE_URL, { status: intake.status ?? 200, body: intake.body ?? GOOD_INTAKE, reject: intake.reject }],
  ]);
}

async function run({ baseUrl = 'https://portfolio.example.com/', responses = routes() } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const key = String(url);
    calls.push({ url: key, init });
    const response = responses.get(key);
    if (!response) throw new Error(`Unexpected fetch: ${key}`);
    if (response.reject) throw new Error(response.reject);
    return new Response(response.body ?? '', { status: response.status });
  };
  const result = await runDeflectionPublicReachabilitySmoke(
    { baseUrl },
    { fetchImpl, now: () => '2026-06-01T16:00:00.000Z' },
  );
  return { result, calls };
}

{
  const { result, calls } = await run({
    responses: routes({
      landing: { body: `${GOOD_LANDING}<template>This page could not be found</template>` },
      intake: { body: `${GOOD_INTAKE}<template>This page could not be found</template>` },
    }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.baseUrl, 'https://portfolio.example.com');
  assert.equal(result.landingUrl, LANDING_URL);
  assert.equal(result.intakeUrl, INTAKE_URL);
  assert.deepEqual(result.landingMarkers, {
    productEyebrow: true,
    snapshotCta: true,
    pricing: true,
    intakeHref: true,
  });
  assert.deepEqual(result.intakeMarkers, {
    uploadEyebrow: true,
    headline: true,
    workEmail: true,
    submitCta: true,
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[1].init.cache, 'no-store');
}

const cases = [
  {
    name: 'invalid base',
    baseUrl: 'http://evil.example.com',
    error: 'Deflection public reachability smoke base URL is invalid.',
    calls: 0,
  },
  {
    name: 'landing HTTP failure',
    responses: routes({ landing: { status: 404, body: 'not found' } }),
    stage: 'landing',
    error: 'Deflection public landing page failed with HTTP 404.',
    calls: 1,
  },
  {
    name: 'landing network failure',
    responses: routes({ landing: { reject: 'network reset' } }),
    stage: 'landing',
    error: 'Deflection public landing page fetch failed before an HTTP response.',
    calls: 1,
  },
  {
    name: 'landing marker missing',
    responses: routes({ landing: { body: GOOD_LANDING.replace('PRICING', '') } }),
    stage: 'landing',
    error: 'Deflection public landing page is missing required render markers.',
    missing: ['pricing'],
    calls: 1,
  },
  {
    name: 'landing intake href missing',
    responses: routes({
      landing: { body: GOOD_LANDING.replace('href="/systems/support-ticket-deflection/intake"', '') },
    }),
    stage: 'landing',
    error: 'Deflection public landing page is missing the CSV intake CTA href.',
    missing: ['intakeHref'],
    calls: 1,
  },
  {
    name: 'intake HTTP failure',
    responses: routes({ intake: { status: 500, body: 'server error' } }),
    stage: 'intake',
    error: 'Deflection public intake page failed with HTTP 500.',
    calls: 2,
  },
  {
    name: 'intake marker missing',
    responses: routes({ intake: { body: GOOD_INTAKE.replace('Work email', '') } }),
    stage: 'intake',
    error: 'Deflection public intake page is missing required render markers.',
    missing: ['workEmail'],
    calls: 2,
  },
  {
    name: 'intake rendered error',
    responses: routes({ intake: { body: 'Application error' } }),
    stage: 'intake',
    error: 'Deflection public intake page rendered an error marker: Application error.',
    missing: ['uploadEyebrow', 'headline', 'workEmail', 'submitCta'],
    calls: 2,
  },
];

for (const testCase of cases) {
  const { result, calls } = await run(testCase);
  assert.equal(result.ok, false, testCase.name);
  assert.equal(result.apiCalls, testCase.calls > 0, testCase.name);
  assert.equal(result.stage, testCase.stage, testCase.name);
  assert.equal(result.error, testCase.error, testCase.name);
  assert.deepEqual(result.missing, testCase.missing, testCase.name);
  assert.equal(calls.length, testCase.calls, testCase.name);
}

const intakePageSource = await readFile(
  new URL('../src/components/landing/SupportTicketCsvIntakePage.tsx', import.meta.url),
  'utf8',
);
const intakeRouteSource = await readFile(
  new URL('../src/app/systems/support-ticket-deflection/intake/page.tsx', import.meta.url),
  'utf8',
);
const intakeLayoutSource = await readFile(
  new URL('../src/app/systems/support-ticket-deflection/intake/layout.tsx', import.meta.url),
  'utf8',
);
const staleDeliverySources = [
  [
    'long-form landing config',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/landingConfig-v2.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'shared pricing config',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/landingConfig.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'partner metadata',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/partner/layout.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'confirmation email fallback',
    await readFile(new URL('../src/lib/gap-report-intake.ts', import.meta.url), 'utf8'),
  ],
];

assert.ok(
  intakePageSource.includes('Upload your tickets. Get the repeat-question snapshot in seconds.'),
  'intake headline should promise seconds, not 24-hour delivery',
);
assert.ok(
  !intakePageSource.includes('24 hours'),
  'intake visible copy should not retain 24-hour delivery language',
);
assert.ok(
  !intakeLayoutSource.includes('24 hours'),
  'intake metadata should not retain 24-hour delivery language',
);
assert.ok(
  intakeRouteSource.includes("'/systems/support-ticket-deflection/snapshot'"),
  'non-partner intake should route back/source attribution to the Snapshot landing',
);
assert.ok(
  intakeRouteSource.includes("'/systems/support-ticket-deflection/partner'"),
  'partner intake should keep partner route attribution',
);
for (const [label, source] of staleDeliverySources) {
  assert.ok(
    !source.includes('24 hours'),
    `${label} should not retain stale 24-hour deflection delivery copy`,
  );
}

console.log('Deflection public reachability smoke tests passed.');
