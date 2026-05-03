import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  GOOGLE_ADS_ARTIFACT_VERSION,
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
    artifactVersion: GOOGLE_ADS_ARTIFACT_VERSION,
    mode: 'CREATE_PAUSED',
    apiCalls: true,
    mutations: true,
    apiVersion: 'v22',
    targetCustomerId: '***-***-7890',
    targetCustomerFingerprint: 'fingerprint-123',
    campaign: {
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

function statusResult(overrides = {}) {
  return {
    ok: true,
    artifactVersion: GOOGLE_ADS_ARTIFACT_VERSION,
    mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
    apiCalls: true,
    mutations: false,
    apiVersion: 'v22',
    targetCustomerId: '***-***-7890',
    targetCustomerFingerprint: 'fingerprint-123',
    campaignName: 'Atlas AI Content Ops Station',
    campaignFound: true,
    campaign: {
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

function artifactVersionError(label) {
  return `${label} artifactVersion must be ${GOOGLE_ADS_ARTIFACT_VERSION}`;
}

assert.deepEqual(artifactVersionFields(), { artifactVersion: GOOGLE_ADS_ARTIFACT_VERSION });
assert.deepEqual(validateArtifactVersion({ artifactVersion: GOOGLE_ADS_ARTIFACT_VERSION }, 'test artifact'), []);
assert.deepEqual(validateArtifactVersion({}, 'test artifact'), [artifactVersionError('test artifact')]);

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
assert.equal(readinessPayload.artifactVersion, GOOGLE_ADS_ARTIFACT_VERSION);
assert.equal(readJson(readinessPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSION);

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
assertStdoutContains(staleCreateRun, artifactVersionError('create result'));

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
assertStdoutContains(staleStatusRun, artifactVersionError('status result'));

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
assert.equal(enablePayload.artifactVersion, GOOGLE_ADS_ARTIFACT_VERSION);
assert.equal(readJson(enableDryRunPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSION);

const staleReadiness = readJson(readinessPath);
delete staleReadiness.artifactVersion;
const staleReadinessPath = writeJson('stale-readiness-result.json', staleReadiness);
const staleReadinessRun = runScript(
  'enable-google-ads-campaign.mjs',
  ['--dry-run', '--readiness-result', staleReadinessPath, '--json'],
  1,
);
assertStdoutContains(staleReadinessRun, artifactVersionError('readiness result'));

const statusDryRunPath = join(tempDir, 'status-dry-run.json');
runScript('status-google-ads-campaign.mjs', ['--dry-run', '--json', '--output', statusDryRunPath]);
assert.equal(readJson(statusDryRunPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSION);

const createDryRunPath = join(tempDir, 'create-dry-run.json');
runScript('create-paused-google-ads-campaign.mjs', ['--dry-run', '--json', '--output', createDryRunPath]);
assert.equal(readJson(createDryRunPath).artifactVersion, GOOGLE_ADS_ARTIFACT_VERSION);

console.log('Google Ads artifact contract tests passed.');
cleanupTempDir();
