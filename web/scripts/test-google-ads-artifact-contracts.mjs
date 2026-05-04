import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  GOOGLE_ADS_ARTIFACT_TYPES,
  GOOGLE_ADS_ARTIFACT_VERSIONS,
  artifactVersionFields,
  validateArtifactVersion,
} from './google-ads-artifact-contracts.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptsDir);
const tempDir = mkdtempSync(join(tmpdir(), 'atlas-google-ads-artifacts-'));
let cleanedUp = false;

function cleanupTempDir() {
  if (cleanedUp) {
    return;
  }
  cleanedUp = true;
  rmSync(tempDir, { recursive: true, force: true });
}

process.once('exit', cleanupTempDir);
process.once('SIGINT', () => {
  cleanupTempDir();
  process.exit(130);
});
process.once('SIGTERM', () => {
  cleanupTempDir();
  process.exit(143);
});

function writeJson(name, payload) {
  const filePath = join(tempDir, name);
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function runScript(scriptName, args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [join(scriptsDir, scriptName), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.error, undefined, `${scriptName} failed to spawn: ${result.error?.message || result.error}`);
  assert.notEqual(
    result.status,
    null,
    `${scriptName} exited without a status; signal=${result.signal || 'unknown'}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.equal(
    result.status,
    expectedStatus,
    `${scriptName} exited ${result.status}; expected ${expectedStatus}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );

  return result;
}

function createResult(overrides = {}) {
  return {
    ok: true,
    artifactVersion: GOOGLE_ADS_ARTIFACT_VERSIONS.CREATE_PAUSED,
    mode: 'CREATE_PAUSED',
    apiCalls: true,
    mutations: true,
    apiVersion: 'v22',
    targetCustomerId: '***-***-7890',
    targetCustomerFingerprint: 'fingerprint-123',
    // Shape mirrors create-paused-google-ads-campaign.mjs success path. If you change
    // one, change the other — the readiness validator depends on this provenance block
    // being an object, not a path string.
    preflightResult: {
      path: '/tmp/google-ads-preflight.json',
      ok: true,
      targetCustomerFingerprint: 'fingerprint-123',
      apiVersion: 'v22',
    },
    campaign: {
      // v2: campaign.id is required so the live enable command can resolve the exact
      // campaign by resource name (customers/<customer>/campaigns/<id>) instead of by
      // name with LIMIT 1.
      id: '987654321',
      name: 'Atlas AI Content Ops Station',
      status: 'PAUSED',
      dailyBudgetUsd: 50,
      adGroups: 2,
    },
    createdResources: [
      { type: 'campaignBudget' },
      { type: 'campaign' },
      { type: 'adGroup' },
      { type: 'keyword' },
      { type: 'negativeKeyword' },
      { type: 'responsiveSearchAd' },
    ],
    ...overrides,
  };
}

function funnelReport(overrides = {}) {
  return {
    ok: true,
    artifactVersion: GOOGLE_ADS_ARTIFACT_VERSIONS.ADVERTISING_FUNNEL,
    mode: 'ADVERTISING_FUNNEL_REPORT',
    apiCalls: false,
    mutations: false,
    campaignName: 'Atlas AI Content Ops Station',
    // Carried through by combine-advertising-reports from the Google Ads performance
    // report; required by the readiness gate so a duplicate-name campaign cannot
    // satisfy validation.
    campaignId: '987654321',
    dateRange: {
      googleAds: { startDate: '2026-04-01', endDate: '2026-04-07' },
      ga4: { startDate: '2026-04-01', endDate: '2026-04-07' },
      aligned: true,
    },
    funnel: { impressions: 0, clicks: 0, costUsd: 0, landingSessions: 0, landingActiveUsers: 0, auditRequests: 0, googleAdsConversions: 0 },
    rates: {},
    ...overrides,
  };
}

function statusResult(overrides = {}) {
  return {
    ok: true,
    artifactVersion: GOOGLE_ADS_ARTIFACT_VERSIONS.STATUS,
    mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
    apiCalls: true,
    mutations: false,
    apiVersion: 'v22',
    targetCustomerId: '***-***-7890',
    targetCustomerFingerprint: 'fingerprint-123',
    campaignName: 'Atlas AI Content Ops Station',
    campaignFound: true,
    campaign: {
      // v2: status result must include campaign.id and the readiness gate verifies it
      // matches the create-result campaign.id to defend against name-collision
      // substitution.
      id: '987654321',
      status: 'PAUSED',
      budget: {
        amountUsd: 50,
      },
    },
    adGroups: {
      count: 1,
    },
    ads: {
      count: 1,
    },
    nextSteps: {
      enableSafe: true,
    },
    ...overrides,
  };
}

function requiredConfirmations() {
  return [
    '--confirm-assets-reviewed',
    '--confirm-budget-reviewed',
    '--confirm-conversion-tracking-reviewed',
    '--confirm-negative-keywords-reviewed',
  ];
}

function assertStdoutContains(result, text) {
  assert.ok(result.stdout.includes(text), `Expected stdout to include ${JSON.stringify(text)}\nstdout:\n${result.stdout}`);
}

function artifactVersionError(label, type) {
  return `${label} artifactVersion must be ${GOOGLE_ADS_ARTIFACT_VERSIONS[type]}`;
}

// Smoke tests for the per-artifact version helpers.
for (const type of Object.values(GOOGLE_ADS_ARTIFACT_TYPES)) {
  const expected = GOOGLE_ADS_ARTIFACT_VERSIONS[type];
  assert.deepEqual(artifactVersionFields(type), { artifactVersion: expected });
  assert.deepEqual(
    validateArtifactVersion({ artifactVersion: expected }, 'test artifact', type),
    [],
  );
  assert.deepEqual(
    validateArtifactVersion({}, 'test artifact', type),
    [artifactVersionError('test artifact', type)],
  );
  // An artifact advertising another type's version is rejected — versions are no
  // longer interchangeable across types.
  for (const otherType of Object.values(GOOGLE_ADS_ARTIFACT_TYPES)) {
    if (otherType === type) continue;
    const otherVersion = GOOGLE_ADS_ARTIFACT_VERSIONS[otherType];
    if (otherVersion === expected) continue;
    assert.deepEqual(
      validateArtifactVersion({ artifactVersion: otherVersion }, 'test artifact', type),
      [artifactVersionError('test artifact', type)],
    );
  }
}
assert.throws(() => artifactVersionFields('UNKNOWN_TYPE'), /Unknown Google Ads artifact type/);

const createPath = writeJson('create-result.json', createResult());
const statusPath = writeJson('status-result.json', statusResult());
const readinessPath = join(tempDir, 'readiness-result.json');
const readinessRun = runScript('check-google-ads-enable-readiness.mjs', [
  '--create-result',
  createPath,
  '--status-result',
  statusPath,
  ...requiredConfirmations(),
  '--json',
  '--output',
  readinessPath,
]);
const readinessPayload = JSON.parse(readinessRun.stdout);
assert.equal(readinessPayload.artifactVersion, GOOGLE_ADS_ARTIFACT_VERSIONS.READINESS);
assert.equal(readJson(readinessPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSIONS.READINESS);

const staleCreate = createResult();
delete staleCreate.artifactVersion;
const staleCreatePath = writeJson('stale-create-result.json', staleCreate);
const staleCreateRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    staleCreatePath,
    '--status-result',
    statusPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(staleCreateRun, artifactVersionError('create result', GOOGLE_ADS_ARTIFACT_TYPES.CREATE_PAUSED));

const staleStatus = statusResult();
delete staleStatus.artifactVersion;
const staleStatusPath = writeJson('stale-status-result.json', staleStatus);
const staleStatusRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    staleStatusPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(staleStatusRun, artifactVersionError('status result', GOOGLE_ADS_ARTIFACT_TYPES.STATUS));

// v2: create result missing campaign.id must be rejected.
const createMissingIdPath = writeJson(
  'create-missing-id.json',
  createResult({
    campaign: {
      name: 'Atlas AI Content Ops Station',
      status: 'PAUSED',
      dailyBudgetUsd: 50,
      adGroups: 2,
    },
  }),
);
const createMissingIdRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createMissingIdPath,
    '--status-result',
    statusPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(createMissingIdRun, 'Create result must include numeric campaign.id (artifact contract v2)');

// v2: status result with a different campaign.id than the create result must be rejected.
// Defends against a status packet substituted from a different campaign in the same account.
const mismatchStatusPath = writeJson(
  'status-id-mismatch.json',
  statusResult({
    campaign: {
      id: '111222333',
      status: 'PAUSED',
      budget: { amountUsd: 50 },
    },
  }),
);
const mismatchStatusRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    mismatchStatusPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(mismatchStatusRun, 'Status result campaign.id must match the create-result campaign.id');

// Create result with the preflightResult provenance block omitted must be rejected.
// Without this check, a hand-edited shell of a JSON satisfies the readiness gate.
const createNoPreflight = createResult();
delete createNoPreflight.preflightResult;
const createNoPreflightPath = writeJson('create-no-preflight.json', createNoPreflight);
const createNoPreflightRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createNoPreflightPath,
    '--status-result',
    statusPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(createNoPreflightRun, 'Create result must include the preflightResult provenance block');

// Create result whose preflightResult.targetCustomerFingerprint disagrees with the
// outer targetCustomerFingerprint must be rejected — defends against a preflight
// from one customer being stapled into a create result for another.
const createPreflightMismatchPath = writeJson(
  'create-preflight-mismatch.json',
  createResult({
    preflightResult: { ok: true, targetCustomerFingerprint: 'fingerprint-DIFFERENT' },
  }),
);
const createPreflightMismatchRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPreflightMismatchPath,
    '--status-result',
    statusPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(
  createPreflightMismatchRun,
  'Create result preflightResult.targetCustomerFingerprint must match the create result targetCustomerFingerprint',
);

// Funnel report whose campaignName doesn't match the create-result campaign name
// must be rejected — defends against an unrelated campaign's funnel satisfying the gate.
const mismatchedFunnelPath = writeJson(
  'funnel-wrong-campaign.json',
  funnelReport({ campaignName: 'Some Other Campaign' }),
);
const mismatchedFunnelRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    statusPath,
    '--funnel-report',
    mismatchedFunnelPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(mismatchedFunnelRun, 'Funnel report campaignName');

// Bare --funnel-report flag (no path) must error rather than silently skip the report.
const bareFunnelRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    statusPath,
    '--funnel-report',
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(bareFunnelRun, 'Refusing to continue with bare --funnel-report');

// Funnel report missing the artifactVersion field must be rejected — pre-versioning
// (legacy) funnel artifacts now fail closed; operators regenerate via combine-advertising-reports.
const unversionedFunnel = funnelReport();
delete unversionedFunnel.artifactVersion;
const unversionedFunnelPath = writeJson('funnel-unversioned.json', unversionedFunnel);
const unversionedFunnelRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    statusPath,
    '--funnel-report',
    unversionedFunnelPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(
  unversionedFunnelRun,
  artifactVersionError('funnel report', GOOGLE_ADS_ARTIFACT_TYPES.ADVERTISING_FUNNEL),
);

// Funnel report whose campaignName matches but campaignId differs must be rejected.
// Defends against the duplicate-name collision class — two campaigns can share a
// name in Google Ads, so name-only binding is not sufficient.
const sameNameDifferentIdFunnelPath = writeJson(
  'funnel-same-name-different-id.json',
  funnelReport({ campaignId: '111222333' }),
);
const sameNameDifferentIdFunnelRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    statusPath,
    '--funnel-report',
    sameNameDifferentIdFunnelPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(sameNameDifferentIdFunnelRun, 'Funnel report campaignId (111222333) must match');

// Funnel report missing campaignId entirely must be rejected when create-result
// carries one — operator must regenerate the funnel report against the current
// Google Ads performance artifact (which now emits campaignId).
const missingCampaignIdFunnel = funnelReport();
delete missingCampaignIdFunnel.campaignId;
const missingCampaignIdFunnelPath = writeJson('funnel-no-campaign-id.json', missingCampaignIdFunnel);
const missingCampaignIdFunnelRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    statusPath,
    '--funnel-report',
    missingCampaignIdFunnelPath,
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(missingCampaignIdFunnelRun, 'Funnel report must include campaignId');

// Aligned funnel report whose campaignName AND campaignId both match must pass.
const matchedFunnelPath = writeJson('funnel-aligned.json', funnelReport());
runScript('check-google-ads-enable-readiness.mjs', [
  '--create-result',
  createPath,
  '--status-result',
  statusPath,
  '--funnel-report',
  matchedFunnelPath,
  ...requiredConfirmations(),
  '--json',
]);

const enableDryRunPath = join(tempDir, 'enable-dry-run.json');
const enableDryRun = runScript('enable-google-ads-campaign.mjs', [
  '--dry-run',
  '--readiness-result',
  readinessPath,
  '--json',
  '--output',
  enableDryRunPath,
]);
const enablePayload = JSON.parse(enableDryRun.stdout);
assert.equal(enablePayload.artifactVersion, GOOGLE_ADS_ARTIFACT_VERSIONS.ENABLE);
assert.equal(readJson(enableDryRunPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSIONS.ENABLE);

const staleReadiness = readJson(readinessPath);
delete staleReadiness.artifactVersion;
const staleReadinessPath = writeJson('stale-readiness-result.json', staleReadiness);
const staleReadinessRun = runScript(
  'enable-google-ads-campaign.mjs',
  ['--dry-run', '--readiness-result', staleReadinessPath, '--json'],
  1,
);
assertStdoutContains(staleReadinessRun, artifactVersionError('readiness result', GOOGLE_ADS_ARTIFACT_TYPES.READINESS));

const statusDryRunPath = join(tempDir, 'status-dry-run.json');
runScript('status-google-ads-campaign.mjs', ['--dry-run', '--json', '--output', statusDryRunPath]);
assert.equal(readJson(statusDryRunPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSIONS.STATUS);

const createDryRunPath = join(tempDir, 'create-dry-run.json');
runScript('create-paused-google-ads-campaign.mjs', ['--dry-run', '--json', '--output', createDryRunPath]);
assert.equal(readJson(createDryRunPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSIONS.CREATE_PAUSED);

// Equals-form `--campaign-id=` (empty value after =) must be rejected the same way as
// the bare flag form. parseArgs() puts the empty value into `values`, not `flags`, so
// the guard has to check both. The reporter's bare-flag guard fires before env
// validation, so this works in a no-env environment.
const equalsFormCampaignIdRun = runScript(
  'report-google-ads-performance.mjs',
  ['--dry-run', '--campaign-id=', '--json'],
  1,
);
assertStdoutContains(equalsFormCampaignIdRun, 'Refusing to continue with bare --campaign-id');

// Bare equals-form `--funnel-report=` (empty value) must be rejected the same way as
// the bare flag form. parseArgs() puts an empty value into `values`, not `flags`, so
// the guard has to check both — otherwise the operator's intent to attach a report is
// silently dropped and the gate accepts the readiness check without the funnel binding.
const equalsFormFunnelRun = runScript(
  'check-google-ads-enable-readiness.mjs',
  [
    '--create-result',
    createPath,
    '--status-result',
    statusPath,
    '--funnel-report=',
    ...requiredConfirmations(),
    '--json',
  ],
  1,
);
assertStdoutContains(equalsFormFunnelRun, 'Refusing to continue with bare --funnel-report');

// Combiner: Google Ads report missing campaignId must fail closed at combine time
// (operator gets a clear "regenerate" hint) instead of producing a misleading funnel
// artifact that fails later at the readiness gate with a less obvious error.
const legacyAdsReport = {
  ok: true,
  mode: 'GOOGLE_ADS_PERFORMANCE_REPORT',
  apiCalls: true,
  mutations: false,
  campaignName: 'Atlas AI Content Ops Station',
  // No campaignId — pre-versioned legacy report.
  dateRange: { startDate: '2026-04-01', endDate: '2026-04-07' },
  totals: { impressions: 0, clicks: 0, costUsd: 0, conversions: 0 },
};
const minimalGa4Report = {
  ok: true,
  mode: 'GA4_PERFORMANCE_REPORT',
  apiCalls: true,
  mutations: false,
  dateRange: { startDate: '2026-04-01', endDate: '2026-04-07' },
  landingPage: '/audit',
  conversionEvent: 'audit_request_submitted',
  landingPageReport: { totals: { sessions: 0, activeUsers: 0 } },
  conversionEventReport: { totals: { eventCount: 0 } },
};
const legacyAdsReportPath = writeJson('google-ads-legacy.json', legacyAdsReport);
const ga4ReportPath = writeJson('ga4-aligned.json', minimalGa4Report);
const combinerLegacyRun = runScript(
  'combine-advertising-reports.mjs',
  [
    '--google-ads-report',
    legacyAdsReportPath,
    '--ga4-report',
    ga4ReportPath,
    '--json',
  ],
  1,
);
assertStdoutContains(combinerLegacyRun, 'Google Ads report must include numeric campaignId');

// Combiner: same fail-closed must fire for dry-run Google Ads reports without
// campaignId — a dry-run-derived funnel artifact with empty campaignId is still
// guaranteed to fail at the readiness gate, so failing earlier with a clear hint
// is better than producing a misleading-looking artifact.
const dryRunAdsReportPath = writeJson('google-ads-dry-run.json', {
  ...legacyAdsReport,
  mode: 'GOOGLE_ADS_PERFORMANCE_DRY_RUN',
  apiCalls: false,
});
const combinerDryRunRun = runScript(
  'combine-advertising-reports.mjs',
  [
    '--google-ads-report',
    dryRunAdsReportPath,
    '--ga4-report',
    ga4ReportPath,
    '--json',
  ],
  1,
);
assertStdoutContains(combinerDryRunRun, 'Google Ads report must include numeric campaignId');

console.log('Google Ads artifact contract tests passed.');
cleanupTempDir();
