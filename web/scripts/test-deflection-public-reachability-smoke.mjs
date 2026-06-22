import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runDeflectionPublicReachabilitySmoke } from './smoke-deflection-public-reachability.mjs';

const LANDING_URL = 'https://portfolio.example.com/systems/support-ticket-deflection';
const INTAKE_URL = `${LANDING_URL}/intake`;
const GOOD_LANDING = [
  '<span data-smoke="productEyebrow">Any product</span>',
  '<a data-smoke="snapshotCta" href="/systems/support-ticket-deflection/intake">Any CTA</a>',
  '<section data-smoke="pricing">Any pricing</section>',
].join('');
const GOOD_INTAKE = [
  '<section data-smoke="inlineForm uploadEyebrow">',
  '<h2 data-smoke="headline">Any headline</h2>',
  '<input data-smoke="workEmail" />',
  '<p data-smoke="deterministicBadge">Any trust badge</p>',
  '<button data-smoke="submitCta resolutionReportCta">Any submit</button>',
  '</section>',
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
    deterministicBadge: true,
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
    name: 'landing visible not-found error',
    responses: routes({ landing: { body: 'This page could not be found' } }),
    stage: 'landing',
    error: 'Deflection public landing page rendered an error marker: This page could not be found.',
    missing: ['productEyebrow', 'snapshotCta', 'pricing'],
    calls: 1,
  },
  {
    name: 'landing marker missing',
    responses: routes({ landing: { body: GOOD_LANDING.replace('data-smoke="pricing"', '') } }),
    stage: 'landing',
    error: 'Deflection public landing page is missing required render markers.',
    missing: ['pricing'],
    calls: 1,
  },
  {
    name: 'landing marker requires exact token',
    responses: routes({
      landing: {
        body: GOOD_LANDING.replace('data-smoke="pricing"', 'data-smoke="x-pricing"'),
      },
    }),
    stage: 'landing',
    error: 'Deflection public landing page is missing required render markers.',
    missing: ['pricing'],
    calls: 1,
  },
  {
    name: 'landing marker missing with dormant not-found payload',
    responses: routes({
      landing: {
        body: [
          GOOD_LANDING.replace('data-smoke="pricing"', ''),
          '<script>self.__next_f.push(["This page could not be found"])</script>',
          '<template>This page could not be found</template>',
        ].join(''),
      },
    }),
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
    responses: routes({ intake: { body: GOOD_INTAKE.replace('data-smoke="workEmail"', '') } }),
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
    missing: ['uploadEyebrow', 'headline', 'workEmail', 'deterministicBadge', 'submitCta'],
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
const intakeFormSource = await readFile(
  new URL('../src/components/landing/SupportTicketCsvIntakeForm.tsx', import.meta.url),
  'utf8',
);
const intakeClientSource = `${intakePageSource}\n${intakeFormSource}`;
const intakeRouteSource = await readFile(
  new URL('../src/app/systems/support-ticket-deflection/intake/page.tsx', import.meta.url),
  'utf8',
);
const intakeLayoutSource = await readFile(
  new URL('../src/app/systems/support-ticket-deflection/intake/layout.tsx', import.meta.url),
  'utf8',
);
const snapshotRouteSource = await readFile(
  new URL('../src/app/systems/support-ticket-deflection/snapshot/page.tsx', import.meta.url),
  'utf8',
);
const publicMetadataSources = [
  [
    'support-ticket-deflection layout metadata',
    await readFile(new URL('../src/app/systems/support-ticket-deflection/layout.tsx', import.meta.url), 'utf8'),
  ],
  [
    'support-ticket-deflection demo metadata',
    await readFile(new URL('../src/app/systems/support-ticket-deflection/demo/layout.tsx', import.meta.url), 'utf8'),
  ],
  [
    'AI Content Ops metadata',
    await readFile(new URL('../src/app/systems/ai-content-ops/layout.tsx', import.meta.url), 'utf8'),
  ],
];
const combinedPublicMetadataSource = publicMetadataSources
  .map(([label, source]) => `\n--- ${label} ---\n${source}`)
  .join('');
const partnerClientSource = await readFile(
  new URL('../src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx', import.meta.url),
  'utf8',
);
const nonPartnerEntrySources = [
  [
    'systems support-ops card',
    await readFile(new URL('../src/app/systems/page.tsx', import.meta.url), 'utf8'),
  ],
  [
    'AI Content Ops cross-sell',
    await readFile(new URL('../src/app/systems/ai-content-ops/page.tsx', import.meta.url), 'utf8'),
  ],
  [
    'public landing pricing config',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/landingConfig.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'public landing v2 config',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/landingConfig-v2.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'demo page CTA',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/demo/page.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'playbook CTA',
    await readFile(
      new URL('../src/app/systems/support-ticket-deflection/playbook/page.tsx', import.meta.url),
      'utf8',
    ),
  ],
  [
    'thirty-second calculator CTA',
    await readFile(new URL('../src/components/deflection-demo/ThirtySecondCalculator.tsx', import.meta.url), 'utf8'),
  ],
  [
    'support-tax calculator CTA',
    await readFile(new URL('../src/components/deflection-demo/SupportTaxCalculator.tsx', import.meta.url), 'utf8'),
  ],
  [
    'support-tax mini calculator CTA',
    await readFile(new URL('../src/components/deflection-demo/SupportTaxMiniCalculator.tsx', import.meta.url), 'utf8'),
  ],
];
const combinedNonPartnerEntrySource = nonPartnerEntrySources
  .map(([label, source]) => `\n--- ${label} ---\n${source}`)
  .join('');
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
  intakeClientSource.includes('Identify the cost exposure behind your unresolved questions.'),
  'intake headline should frame the cost-exposure audit question',
);
assert.ok(
  intakeClientSource.includes('Upload your 30-day ticket export.') &&
    intakeClientSource.includes('high-volume repeat') &&
    intakeClientSource.includes('where documentation alone cannot carry the load.'),
  'intake subcopy should use the 30-day export, repeat-question, and operational-gap framing',
);
assert.ok(
  !intakeClientSource.includes('Upload your support-ticket export. The audit ranks repeated questions') &&
    !intakeClientSource.includes('prepares one review-ready drafted answer'),
  'intake subcopy should remove the previous generic audit phrasing',
);
assert.ok(
  intakeClientSource.includes('No LLM or Generative models.'),
  'intake page should render the deterministic trust badge',
);
assert.ok(
  intakeClientSource.includes('We use deterministic clustering to sort repeated questions.'),
  'intake trust badge subtext should use deterministic clustering phrasing',
);
assert.ok(
  !intakeClientSource.includes('exact mathematical clustering'),
  'intake trust badge subtext should not use exact mathematical clustering wording',
);
assert.ok(
  !intakeClientSource.includes('24 hours'),
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
  intakeRouteSource.includes("'Back to Resolution Audit'") &&
    intakeRouteSource.includes("snapshotName: isPartner ? 'Deflection Report' : 'Resolution Audit'") &&
    intakeRouteSource.includes("submitLabel: isPartner ? 'Upload my CSV for my partner audit' : 'Start Your Forensic Audit'"),
  'non-partner intake route should stay in the Resolution Audit offer path',
);
assert.ok(
  !intakeRouteSource.includes('Upload my CSV, get my free Deflection Snapshot'),
  'intake route should not send linked audit CTAs back to the old Deflection Snapshot submit copy',
);
assert.ok(
  intakeLayoutSource.includes('Resolution Audit Intake') &&
    intakeLayoutSource.includes('deterministic Resolution Audit intake'),
  'intake metadata should frame the linked route as the Resolution Audit intake',
);
assert.ok(
  snapshotRouteSource.includes('The Resolution Audit: Find Support Ticket Cost Exposure') &&
    snapshotRouteSource.includes('forensic Snapshot of repeat contacts'),
  'Snapshot route metadata should align with the Resolution Audit offer',
);
assert.ok(
  combinedPublicMetadataSource.includes('Resolution Audit: Find Repeat Support Ticket Cost Exposure') &&
    combinedPublicMetadataSource.includes('Start with the Resolution Audit, then expand.') &&
    combinedPublicMetadataSource.includes('a Resolution Audit would surface for review.'),
  'public metadata should use Resolution Audit offer wording',
);
assert.ok(
  !combinedPublicMetadataSource.includes('Support Ticket Deflection Report'),
  'public metadata should not retain the old Support Ticket Deflection Report label',
);
assert.ok(
  !snapshotRouteSource.includes('Free Deflection Snapshot') &&
    !snapshotRouteSource.includes('Upload 30 days of closed tickets'),
  'Snapshot route metadata should not retain the old free-Snapshot/30-day framing',
);
assert.ok(
  combinedNonPartnerEntrySource.includes('Resolution Audit Snapshot') &&
    combinedNonPartnerEntrySource.includes('Full Resolution Audit') &&
    combinedNonPartnerEntrySource.includes('Start Your Forensic Audit') &&
    combinedNonPartnerEntrySource.includes('Best after the first full audit proves the work is useful.') &&
    combinedNonPartnerEntrySource.includes('one review-ready answer when your tickets contain resolution evidence.'),
  'non-partner entry surfaces should use the Resolution Audit and forensic-audit CTA labels',
);
assert.ok(
  combinedNonPartnerEntrySource.includes('Free Snapshot to full audit') &&
    !combinedNonPartnerEntrySource.includes('DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL'),
  'AI Content Ops card should not import the old Snapshot/full-report offer label into the renamed entry surface',
);
for (const [oldLabel, sourceLabel] of [
  ['Deflection Snapshot', 'Deflection Snapshot'],
  ['free Deflection Snapshot', 'free Deflection Snapshot'],
  ['Support Ticket Deflection Report', 'Support Ticket Deflection Report'],
  ['Full Deflection Report', 'Full Deflection Report'],
  ['Get the free Snapshot first', 'Get the free Snapshot first'],
  ['Upload your CSV, get a free Snapshot', 'Upload your CSV, get a free Snapshot'],
  ['Upload tickets, get a free Deflection Snapshot', 'Upload tickets, get a free Deflection Snapshot'],
  ['Stop the leak: get a free Deflection Snapshot', 'Stop the leak: get a free Deflection Snapshot'],
  ['Get a free Deflection Snapshot', 'Get a free Deflection Snapshot'],
]) {
  assert.ok(
    !combinedNonPartnerEntrySource.includes(oldLabel),
    `non-partner entry surfaces should not retain old ${sourceLabel} wording`,
  );
}
assert.ok(
  partnerClientSource.includes("title: 'Deflection Snapshot'") &&
    partnerClientSource.includes("title: 'Full Deflection Report'") &&
    partnerClientSource.includes("title: 'Start with the snapshot. Upgrade when the repeat pattern is clear.'") &&
    partnerClientSource.includes("note: 'Best after the first full Deflection Report proves the work is useful.'") &&
    partnerClientSource.includes('free Deflection Snapshot') &&
    partnerClientSource.includes('What do I get in the full Deflection Report?') &&
    partnerClientSource.includes('structuredData: generateFaqJsonLd(') &&
    partnerClientSource.includes('items: partnerFaqItems'),
  'partner client should override shared pricing and FAQ copy back to the partner-scoped Deflection Snapshot offer',
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
