import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isBareFlag, parseArgs, readJsonArtifact, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { escapeGaqlString, sanitizeGoogleAdsMessage } from './google-ads-api.mjs';
import { maskResourceName } from './google-ads-env.mjs';

async function testParseArgs() {
  const { values, flags } = parseArgs(['--json', '--output', '/tmp/result.json', '--campaign-name=Audit', '--dry-run']);
  assert.equal(flags.has('--json'), true);
  assert.equal(flags.has('--dry-run'), true);
  assert.equal(values.get('--output'), '/tmp/result.json');
  assert.equal(values.get('--campaign-name'), 'Audit');

  // `--` ends option parsing; everything after is positional even if it starts
  // with a dash. Lets operators pass values like `--output -foo.json` if
  // needed, and prevents `--` itself from being misread as a value.
  const eooParsed = parseArgs(['--output', '/tmp/x.json', '--', '--not-a-flag', '-foo.json']);
  assert.equal(eooParsed.values.get('--output'), '/tmp/x.json');
  assert.deepEqual(eooParsed.positional, ['--not-a-flag', '-foo.json']);
  assert.equal(eooParsed.flags.has('--not-a-flag'), false);

  // `--foo --bar` puts --foo in flags (not values) because the next token is
  // another flag. `--foo --` (end-of-options follows) also keeps --foo as a
  // bare flag — `--` must not be consumed as --foo's value.
  const trailingEoo = parseArgs(['--funnel-report', '--']);
  assert.equal(trailingEoo.flags.has('--funnel-report'), true);
  assert.equal(trailingEoo.values.has('--funnel-report'), false);
}

function testIsBareFlag() {
  // Bare flag form
  assert.equal(isBareFlag(parseArgs(['--funnel-report']), '--funnel-report'), true);
  // Equals-empty form
  assert.equal(isBareFlag(parseArgs(['--funnel-report=']), '--funnel-report'), true);
  // Whitespace-only value form
  assert.equal(isBareFlag(parseArgs(['--funnel-report=  ']), '--funnel-report'), true);
  // Real value
  assert.equal(isBareFlag(parseArgs(['--funnel-report', '/tmp/funnel.json']), '--funnel-report'), false);
  assert.equal(isBareFlag(parseArgs(['--funnel-report=/tmp/funnel.json']), '--funnel-report'), false);
  // Not provided at all — must return false (the option is optional in many scripts)
  assert.equal(isBareFlag(parseArgs(['--other']), '--funnel-report'), false);
}

function testMaskResourceName() {
  // Masks the customers/<id> prefix using the canonical maskCustomerId rule.
  assert.equal(
    maskResourceName('customers/1234567890/campaigns/9876543210', '1234567890'),
    'customers/******7890/campaigns/9876543210',
  );
  // Accepts dashed ids the same way (they normalize to digits).
  assert.equal(
    maskResourceName('customers/1234567890/campaigns/9876543210', '123-456-7890'),
    'customers/******7890/campaigns/9876543210',
  );
  // Returns the value unchanged when no customer id is configured.
  assert.equal(
    maskResourceName('customers/1234567890/campaigns/9876543210', ''),
    'customers/1234567890/campaigns/9876543210',
  );
  // Returns empty string for nullish input rather than throwing.
  assert.equal(maskResourceName(undefined, '1234567890'), '');
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
testIsBareFlag();
testMaskResourceName();
await testJsonArtifacts();
testGoogleAdsHelpers();

console.log('Advertising CLI helper tests passed.');
