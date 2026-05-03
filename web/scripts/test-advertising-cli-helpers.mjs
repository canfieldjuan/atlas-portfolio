import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs, readJsonArtifact, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { escapeGaqlString, sanitizeGoogleAdsMessage } from './google-ads-api.mjs';

async function testParseArgs() {
  const { values, flags } = parseArgs(['--json', '--output', '/tmp/result.json', '--campaign-name=Audit', '--dry-run']);
  assert.equal(flags.has('--json'), true);
  assert.equal(flags.has('--dry-run'), true);
  assert.equal(values.get('--output'), '/tmp/result.json');
  assert.equal(values.get('--campaign-name'), 'Audit');
}

async function testJsonArtifacts() {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-ads-helper-test-'));
  try {
    const defaultPath = join(dir, 'default.json');
    const defaultResolved = await writeJsonArtifact(defaultPath, { ok: true });
    const { payload: defaultPayload, resolvedPath } = await readJsonArtifact(defaultPath);
    assert.equal(resolvedPath, defaultResolved);
    assert.equal(defaultPayload.ok, true);
    assert.equal(defaultPayload.outputPath, defaultResolved);

    const preflightPath = join(dir, 'preflight.json');
    await writeJsonArtifact(preflightPath, { ok: true }, { includeOutputPath: false });
    const { payload: preflightPayload } = await readJsonArtifact(preflightPath);
    assert.equal(preflightPayload.ok, true);
    assert.equal(Object.hasOwn(preflightPayload, 'outputPath'), false);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}

function testGoogleAdsHelpers() {
  const previousCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const previousLoginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  process.env.GOOGLE_ADS_CUSTOMER_ID = '123-456-7890';
  process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = '9876543210';
  try {
    assert.equal(escapeGaqlString("Bob's \\ campaign"), "Bob\\'s \\\\ campaign");
    const safe = sanitizeGoogleAdsMessage('customers/1234567890 123-456-7890 login 9876543210');
    assert.equal(safe.includes('1234567890'), false);
    assert.equal(safe.includes('123-456-7890'), false);
    assert.equal(safe.includes('9876543210'), false);
    assert.equal(safe.includes('******7890'), true);
    assert.equal(safe.includes('******3210'), true);
  } finally {
    if (previousCustomerId === undefined) {
      delete process.env.GOOGLE_ADS_CUSTOMER_ID;
    } else {
      process.env.GOOGLE_ADS_CUSTOMER_ID = previousCustomerId;
    }
    if (previousLoginCustomerId === undefined) {
      delete process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    } else {
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = previousLoginCustomerId;
    }
  }
}

await testParseArgs();
await testJsonArtifacts();
testGoogleAdsHelpers();

console.log('Advertising CLI helper tests passed.');
