import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-checkout-'));
const sourceUrl = new URL('../src/lib/deflection-checkout.ts', import.meta.url);
const pricingSourceUrl = new URL('../src/lib/deflection-pricing.ts', import.meta.url);
const routeSourceUrl = new URL('../src/app/api/deflection-checkout/route.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-checkout.cjs');
const compiledPricingPath = join(testDir, 'deflection-pricing.cjs');
const compiledRoutePath = join(testDir, 'deflection-checkout-route.cjs');
const seoStubDir = join(testDir, 'node_modules', '@', 'lib');
const nextStubDir = join(testDir, 'node_modules', 'next');
const ENV_KEYS = [
  'ATLAS_SAAS_STRIPE_RAK',
  'ATLAS_SAAS_STRIPE_SECRET_KEY',
  'ATLAS_ACCOUNT_ID',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID',
  'VERCEL_ENV',
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
  await mkdir(nextStubDir, { recursive: true });
  const require = createRequire(compiledPath);
  const pricingSource = await readFile(pricingSourceUrl, 'utf8');
  const compiledPricing = ts.transpileModule(pricingSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPricingPath, compiledPricing.outputText);
  const { DEFLECTION_FULL_REPORT_PRICE_CENTS } = require(compiledPricingPath);

  await writeFile(join(seoStubDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");
  await writeFile(
    join(seoStubDir, 'deflection-pricing.js'),
    `exports.DEFLECTION_FULL_REPORT_PRICE_CENTS = ${DEFLECTION_FULL_REPORT_PRICE_CENTS};\n`,
  );
  await writeFile(
    join(nextStubDir, 'server.js'),
    "exports.NextResponse = { json: (body, init) => Response.json(body, init) };\n",
  );

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

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
    ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    VERCEL_ENV: 'production',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(calls.length, 0);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    VERCEL_ENV: 'preview',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer rk_test_unit_restricted');

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
    VERCEL_ENV: 'preview',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer sk_test_unit_secret');
  assert.equal(
    calls[0].body.get('line_items[0][price_data][unit_amount]'),
    String(DEFLECTION_FULL_REPORT_PRICE_CENTS),
  );
  assert.equal(calls[0].body.has('line_items[0][price]'), false);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    VERCEL_ENV: 'production',
  });
  assert.deepEqual(
    await createDeflectionCheckoutSession('request-123', 'attempt-12345678'),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(calls.length, 0);

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

  await writeFile(
    join(seoStubDir, 'atlas-deflection-client.js'),
    "exports.fetchDeflectionArtifact = async () => ({ ok: false, reason: 'locked' });\n",
  );
  await writeFile(
    join(seoStubDir, 'deflection-checkout.js'),
    "exports.createDeflectionCheckoutSession = async () => ({ ok: false, reason: 'not_configured' });\n",
  );
  await writeFile(
    join(seoStubDir, 'deflection-rate-limit.js'),
    "exports.consumeDeflectionRateLimit = () => ({ ok: true });\n",
  );
  const routeSource = await readFile(routeSourceUrl, 'utf8');
  const compiledRoute = ts.transpileModule(routeSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledRoutePath, compiledRoute.outputText);
  const { POST } = require(compiledRoutePath);
  const routeResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'request-123', attemptId: 'attempt-12345678' }),
    }),
  );
  assert.equal(routeResponse.status, 503);
  assert.deepEqual(await routeResponse.json(), { error: 'Could not start checkout.' });

  console.log('Deflection checkout tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
