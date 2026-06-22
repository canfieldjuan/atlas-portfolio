import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { runDeflectionSnapshotLandingSmoke } from './smoke-deflection-snapshot-landing.mjs';

const SNAPSHOT_URL = 'https://portfolio.example.com/systems/support-ticket-deflection/snapshot';
const MARKER_KEYS = [
  'snapshotBadge',
  'promiseHeadline',
  'heroProofStrip',
  'inlineForm',
  'supportPlatformField',
  'resolutionReportCta',
  'submitSecurityLine',
  'deterministicBadge',
  'supportTaxProjection',
  'assistedContactCost',
  'valueAnchor',
  'blindSpots',
  'snapshotFirst',
  'finalSnapshotAsk',
  'ctaLabel',
];
const GOOD_HTML = [
  '<main>',
  '<span data-smoke="snapshotBadge">Any badge</span>',
  '<h1 data-smoke="promiseHeadline">Any promise</h1>',
  '<section data-smoke="heroProofStrip">Any hero proof strip</section>',
  '<section data-smoke="inlineForm uploadEyebrow">',
  '<select data-smoke="supportPlatformField"></select>',
  '<button data-smoke="resolutionReportCta submitCta">Any submit</button>',
  '<p data-smoke="submitSecurityLine">Any submit reassurance</p>',
  '<p data-smoke="deterministicBadge">Any trust badge</p>',
  '</section>',
  '<section data-smoke="supportTaxProjection assistedContactCost valueAnchor">Any value band</section>',
  '<section data-smoke="blindSpots">Any blind spots section</section>',
  '<section data-smoke="snapshotFirst finalSnapshotAsk">Any final ask</section>',
  '<a data-smoke="ctaLabel" href="/systems/support-ticket-deflection/intake">Any CTA</a>',
  '</main>',
].join('');

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function makeFetchMock(response) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (response.reject) throw new Error(response.reject);
    return new Response(response.body ?? '', { status: response.status ?? 200 });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function run({ baseUrl = 'https://portfolio.example.com/', response = {} } = {}) {
  const fetchImpl = makeFetchMock({ body: GOOD_HTML, ...response });
  const result = await runDeflectionSnapshotLandingSmoke(
    { baseUrl },
    { fetchImpl, now: () => '2026-06-04T00:30:00.000Z' },
  );
  return { result, calls: fetchImpl.calls };
}

async function runCli(args) {
  const child = spawn(
    process.execPath,
    [new URL('./smoke-deflection-snapshot-landing.mjs', import.meta.url).pathname, ...args],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const code = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  return { code, stdout, stderr };
}

function assertResultFields(result, expected, name) {
  for (const [field, value] of Object.entries(expected)) {
    assert.deepEqual(result[field], value, name);
  }
}

const snapshotLandingSource = await source('src/components/landing/DeflectionSnapshotLandingPage.tsx');
const compactSnapshotLandingSource = snapshotLandingSource.replace(/\s+/g, ' ');
const intakeFormSource = await source('src/components/landing/SupportTicketCsvIntakeForm.tsx');
const submitSecurityLineIndex = intakeFormSource.indexOf('data-smoke="submitSecurityLine"');
const submitCtaIndex = intakeFormSource.indexOf('data-smoke="resolutionReportCta submitCta"');

assert.ok(
  snapshotLandingSource.includes('Top Proven Resolutions'),
  'Snapshot artifact should still show the proven-resolution rows below the inline form.',
);
assert.ok(
  snapshotLandingSource.includes("sourceOffer: 'support-ticket-deflection-intake'"),
  'Inline Snapshot form should preserve the deflection source offer that triggers report generation.',
);
assert.equal(
  snapshotLandingSource.includes("sourceOffer: 'hero_intake'"),
  false,
  'Inline Snapshot form should not use the non-reporting hero_intake source offer.',
);
assert.ok(
  snapshotLandingSource.includes("const CTA_LABEL = 'Start Your Forensic Audit';"),
  'Snapshot landing should define the forensic audit CTA label.',
);
assert.ok(
  snapshotLandingSource.includes('submitLabel: CTA_LABEL'),
  'Snapshot inline form should receive the forensic audit CTA label.',
);
assert.ok(
  snapshotLandingSource.includes('Deflect tickets by actually resolving them.'),
  'Snapshot hero should keep the original hero H1.',
);
assert.ok(
  intakeFormSource.includes('Identify the cost exposure behind your unresolved questions.'),
  'Snapshot intake form should own the cost-exposure heading.',
);
assert.ok(
  intakeFormSource.includes('data-smoke="submitSecurityLine"'),
  'Snapshot submit security line should keep a stable smoke marker.',
);
assert.ok(
  intakeFormSource.includes('data-smoke="deterministicBadge"'),
  'Snapshot intake trust panel should keep the deterministic badge smoke marker.',
);
assert.ok(
  submitSecurityLineIndex !== -1 &&
    submitCtaIndex !== -1 &&
    submitSecurityLineIndex < submitCtaIndex,
  'Snapshot intake trust panel should render before the submit CTA.',
);
assert.ok(
  snapshotLandingSource.includes('data-smoke="heroProofStrip"'),
  'Snapshot hero proof strip should keep a stable smoke marker.',
);
assert.ok(
  snapshotLandingSource.includes('data-smoke="blindSpots"'),
  'Snapshot landing blind-spots section should keep a stable smoke marker.',
);
assert.ok(
  snapshotLandingSource.includes('Estimated Support Tax') &&
    snapshotLandingSource.includes('Repeat Contacts') &&
    snapshotLandingSource.includes('Draft + Gap'),
  'Snapshot hero proof strip should keep the support-tax, repeat-contact, and draft-gap metric labels.',
);
assert.ok(
  snapshotLandingSource.includes('one agent-backed answer and one unresolved finding'),
  'Snapshot hero proof strip should name the unresolved finding alongside the draft answer.',
);
assert.ok(
  snapshotLandingSource.includes('Customer wording &rarr; your long-tail SEO target list'),
  'Customer wording subsection should name the long-tail SEO target list.',
);
assert.ok(
  snapshotLandingSource.includes('const customerWordingExamples = top_questions'),
  'Customer wording subsection should derive examples from snapshot top questions.',
);
assert.ok(
  snapshotLandingSource.includes('aria-label="Customer wording examples"'),
  'Customer wording subsection should render actual wording examples when present.',
);
assert.ok(
  snapshotLandingSource.includes('A preview of the truth.'),
  'Snapshot artifact should keep the audit-preview lead-in heading after the hero form.',
);
assert.ok(
  snapshotLandingSource.includes('Decide if an audit is worth the investment before you commit.'),
  'Final Snapshot CTA should frame the Snapshot as an investment gate.',
);
assert.ok(
  compactSnapshotLandingSource.includes(
    'Upload your Zendesk or Freshdesk CSV to receive a Snapshot. You will immediately see your top deflection topic and a summary count.',
  ),
  'Final Snapshot CTA should name the Snapshot output and immediate summary count.',
);
assert.ok(
  compactSnapshotLandingSource.includes(
    'If the data is thin, you have a bounded starting point instead of a sales pitch.',
  ),
  'Final Snapshot CTA should keep the thin-data case bounded.',
);
assert.ok(
  compactSnapshotLandingSource.includes(
    'If the data warrants it, the full report provides a ranked, source-backed action queue.',
  ) &&
    compactSnapshotLandingSource.includes(
      'draft answers anchored to real agent resolutions and a list of operational blind spots.',
    ),
  'Final Snapshot CTA should define the full-report deliverable without overclaiming outcomes.',
);
assert.ok(
  compactSnapshotLandingSource.includes(
    'We do not promise guaranteed savings. We promise a usable audit trail.',
  ) &&
    compactSnapshotLandingSource.includes(
      'ranked, source-backed queue of questions and answers, we will correct the findings.',
    ),
  'Final Snapshot CTA should keep the audit-trail guarantee bounded.',
);
assert.equal(
  snapshotLandingSource.includes('Start with the Snapshot before you commit to a deeper audit.'),
  false,
  'Old final Snapshot CTA headline should be removed.',
);
assert.equal(
  snapshotLandingSource.includes('entirely-new findings'),
  false,
  'Old final Snapshot guarantee should not promise entirely-new findings.',
);
assert.ok(
  snapshotLandingSource.includes('When the upload includes customer phrasing'),
  'Customer wording claim should stay conditional when phrasing is absent.',
);
assert.ok(
  snapshotLandingSource.includes('stays hidden instead of inventing terms'),
  'Customer wording subsection should fail closed instead of inventing phrases.',
);
assert.ok(
  compactSnapshotLandingSource.includes('SEO outcomes vary; we make no ranking guarantees.'),
  'Customer wording subsection should avoid ranking guarantees.',
);
assert.ok(
  snapshotLandingSource.includes('SEO outcomes are not guaranteed rankings'),
  'Snapshot disclaimer should cover SEO ranking outcomes.',
);
assert.equal(
  snapshotLandingSource.includes('Customer wording can become the target list'),
  false,
  'Old target-list copy should be removed.',
);

{
  const { result, calls } = await run({
    response: {
      body: `${GOOD_HTML}<template>This page could not be found</template>`,
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'DEFLECTION_SNAPSHOT_LANDING_SMOKE');
  assert.equal(result.baseUrl, 'https://portfolio.example.com');
  assert.equal(result.url, SNAPSHOT_URL);
  assert.deepEqual(result.markers, Object.fromEntries(MARKER_KEYS.map((key) => [key, true])));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, SNAPSHOT_URL);
  assert.equal(calls[0].init.cache, 'no-store');
}

const failureCases = [
  ['invalid base URL', { baseUrl: 'http://evil.example.com' }, 0, {
    ok: false,
    error: 'Deflection Snapshot landing smoke base URL is invalid.',
    apiCalls: false,
  }],
  ['HTTP failure', { response: { status: 404, body: 'not found' } }, 1, {
    ok: false,
    stage: 'fetch',
    error: 'Snapshot landing page failed with HTTP 404.',
    apiCalls: true,
  }],
  ['network failure', { response: { reject: 'network reset' } }, 1, {
    ok: false,
    stage: 'fetch',
    error: 'Snapshot landing page fetch failed before an HTTP response.',
    apiCalls: true,
  }],
  ['missing inline form marker', { response: { body: GOOD_HTML.replace('data-smoke="inlineForm uploadEyebrow"', 'data-smoke="uploadEyebrow"') } }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page is missing required render markers.',
    missing: ['inlineForm'],
    forbidden: [],
  }],
  ['missing support platform marker', {
    response: { body: GOOD_HTML.replace('data-smoke="supportPlatformField"', '') },
  }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page is missing required render markers.',
    missing: ['supportPlatformField'],
    forbidden: [],
  }],
  ['paid-report-first copy', { response: { body: `${GOOD_HTML}<p>Full report unlock</p>` } }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page rendered forbidden paid-report-first copy.',
    missing: [],
    forbidden: ['fullReportUnlockMetric'],
  }],
  ['rendered error marker', { response: { body: 'Application error' } }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page rendered an error marker: Application error.',
    missing: MARKER_KEYS,
  }],
];

for (const [name, options, calls, expected] of failureCases) {
  const result = await run(options);
  assertResultFields(result.result, expected, name);
  if (calls !== undefined) assert.equal(result.calls.length, calls, name);
}

{
  const result = await runCli(['--output', '--json']);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, 'Refusing to continue without --output <path>.');
}

console.log('Deflection Snapshot landing smoke tests passed.');
