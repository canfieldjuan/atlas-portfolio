import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-checkout-'));
const sourceUrl = new URL('../src/lib/deflection-checkout.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-checkout.cjs');
const seoStubDir = join(testDir, 'node_modules', '@', 'lib');
const ENV_KEYS = [
  'ATLAS_SAAS_STRIPE_RAK',
  'ATLAS_SAAS_STRIPE_SECRET_KEY',
  'ATLAS_ACCOUNT_ID',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID',
];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
let calls = [];

function resetEnv(values = {}) {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, values);
}

function installFetchMock() {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      headers: init?.headers ?? {},
      body: new URLSearchParams(String(init?.body ?? '')),
    });
    return new Response(JSON.stringify({ url: 'https://checkout.stripe.test/session' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) {
      process.env[key] = originalEnv[key];
    }
  }
}

try {
  await mkdir(seoStubDir, { recursive: true });
  await writeFile(join(seoStubDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

  const require = createRequire(compiledPath);
  const { createDeflectionCheckoutSession } = require(compiledPath);
  installFetchMock();

  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer rk_live_unit_restricted');
  assert.equal(calls[0].body.get('line_items[0][price]'), 'price_12345678');
  assert.equal(calls[0].body.has('line_items[0][price_data][unit_amount]'), false);
  assert.equal(calls[0].body.get('metadata[account_id]'), 'acct_unit');
  assert.equal(calls[0].body.get('metadata[request_id]'), 'request-123');

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(calls.length, 0);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    ATLAS_ACCOUNT_ID: 'acct_unit',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer sk_test_unit_secret');
  assert.equal(calls[0].body.get('line_items[0][price_data][unit_amount]'), '150000');
  assert.equal(calls[0].body.has('line_items[0][price]'), false);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_live_unit_secret',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(calls.length, 0);

  console.log('Deflection checkout tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
