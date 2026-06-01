import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateDeflectionCheckoutEnv } from './check-deflection-checkout-env.mjs';

function validate(env, environment) {
  return validateDeflectionCheckoutEnv(env, { environment });
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_legacy_ignored',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    },
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_RAK, 'live_restricted');
  assert(result.warnings.some((warning) => warning.includes('ignored')));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_legacy_only',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['ATLAS_SAAS_STRIPE_RAK']);
  assert.deepEqual(result.invalid, []);
  assert(result.errors.includes('Missing ATLAS_SAAS_STRIPE_RAK.'));
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY, 'test_secret');
  assert(result.warnings.includes('ATLAS_SAAS_STRIPE_SECRET_KEY is ignored by production checkout.'));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, ['ATLAS_SAAS_STRIPE_RAK must start with rk_live_ in production.']);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['STRIPE_DEFLECTION_REPORT_PRICE_ID']);
  assert(result.errors.includes('Missing STRIPE_DEFLECTION_REPORT_PRICE_ID.'));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'lookup_key_not_price',
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, ['STRIPE_DEFLECTION_REPORT_PRICE_ID must be a Stripe price_ id.']);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    },
    'preview',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_RAK, 'test_restricted');
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, ['Non-production checkout env must not use an rk_live_ key.']);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'local',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['STRIPE_DEFLECTION_REPORT_PRICE_ID']);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'development',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY, 'test_secret');
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_live_unit_secret',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [
    'ATLAS_SAAS_STRIPE_SECRET_KEY fallback must be sk_test_ outside production.',
  ]);
}

{
  const result = validate({}, 'preview');
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [
    'ATLAS_ACCOUNT_ID',
    'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY',
  ]);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['ATLAS_ACCOUNT_ID']);
  assert(result.errors.includes('Missing ATLAS_ACCOUNT_ID.'));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['ATLAS_ACCOUNT_ID']);
  assert.deepEqual(result.invalid, []);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_with_under_score',
    },
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.invalid, []);
}

{
  const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-checkout-env-'));
  const envFile = join(testDir, 'prod.env');
  const validEnvFile = join(testDir, 'prod-valid.env');
  await writeFile(
    envFile,
    [
      'ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_legacy_only',
      'ATLAS_ACCOUNT_ID=acct_unit',
      'STRIPE_DEFLECTION_REPORT_PRICE_ID=price_12345678',
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    validEnvFile,
    [
      'ATLAS_SAAS_STRIPE_RAK=rk_live_candidate_restricted',
      'ATLAS_ACCOUNT_ID=acct_unit',
      'STRIPE_DEFLECTION_REPORT_PRICE_ID=price_12345678',
      '',
    ].join('\n'),
    'utf8',
  );
  try {
    const run = spawnSync(
      process.execPath,
      [
        new URL('./check-deflection-checkout-env.mjs', import.meta.url).pathname,
        '--environment',
        'production',
        '--env-file',
        envFile,
        '--json',
      ],
      {
        cwd: new URL('..', import.meta.url).pathname,
        env: { PATH: process.env.PATH, ATLAS_SAAS_STRIPE_RAK: 'rk_live_shell_must_not_mask_file' },
        encoding: 'utf8',
      },
    );
    assert.equal(run.status, 1);
    const payload = JSON.parse(run.stdout);
    assert.equal(payload.ok, false);
    assert.deepEqual(payload.missing, ['ATLAS_SAAS_STRIPE_RAK']);
    assert.equal(payload.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY, 'test_secret');
    assert.equal(run.stderr, '');

    const validRun = spawnSync(
      process.execPath,
      [
        new URL('./check-deflection-checkout-env.mjs', import.meta.url).pathname,
        '--environment',
        'production',
        '--env-file',
        validEnvFile,
        '--json',
      ],
      {
        cwd: new URL('..', import.meta.url).pathname,
        env: { PATH: process.env.PATH },
        encoding: 'utf8',
      },
    );
    assert.equal(validRun.status, 0);
    const validPayload = JSON.parse(validRun.stdout);
    assert.equal(validPayload.ok, true);
    assert.equal(validPayload.keyModes.ATLAS_SAAS_STRIPE_RAK, 'live_restricted');
    assert.equal(validPayload.keyModes.ATLAS_ACCOUNT_ID, 'configured');
    assert.equal(validRun.stderr, '');
  } finally {
    await rm(testDir, { recursive: true, force: true });
  }
}

console.log('Deflection checkout env tests passed.');
