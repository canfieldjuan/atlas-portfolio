import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-checkout-'));
const sourceUrl = new URL('../src/lib/deflection-checkout.ts', import.meta.url);
const pricingSourceUrl = new URL('../src/lib/deflection-pricing.ts', import.meta.url);
const requirementsSourceUrl = new URL(
  '../src/lib/deflection-checkout-requirements.js',
  import.meta.url,
);
const pricingCatalogSourceUrl = new URL(
  '../src/lib/deflection-pricing-catalog.js',
  import.meta.url,
);
const partnerTokenSourceUrl = new URL('../src/lib/deflection-partner-token.js', import.meta.url);
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
  'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID',
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS',
  'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS',
  'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS',
  'VERCEL_ENV',
];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
let calls = [];
let defaultStripeSession = {
  url: 'https://checkout.stripe.test/session',
  amount_total: 1500 * 100,
  currency: 'usd',
};

function resetEnv(values = {}) {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, values);
}

function installFetchMock(session = defaultStripeSession, status = 200) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      headers: init?.headers ?? {},
      body: new URLSearchParams(String(init?.body ?? '')),
    });
    return new Response(JSON.stringify(session), {
      status,
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
  resetEnv();
  const pricingSource = await readFile(pricingSourceUrl, 'utf8');
  const compiledPricing = ts.transpileModule(pricingSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPricingPath, compiledPricing.outputText);
  const requirementsSource = await readFile(requirementsSourceUrl, 'utf8');
  const pricingCatalogSource = await readFile(pricingCatalogSourceUrl, 'utf8');
  const compiledRequirements = ts.transpileModule(requirementsSource, {
    compilerOptions: {
      allowJs: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(
    join(seoStubDir, 'deflection-checkout-requirements.js'),
    compiledRequirements.outputText,
  );
  await writeFile(join(testDir, 'deflection-pricing-catalog.js'), pricingCatalogSource);
  await writeFile(
    join(seoStubDir, 'deflection-pricing-catalog.js'),
    pricingCatalogSource,
  );
  await writeFile(
    join(seoStubDir, 'deflection-partner-token.js'),
    await readFile(partnerTokenSourceUrl, 'utf8'),
  );
  const {
    DEFLECTION_DEFAULT_PRICE_VARIANT,
    DEFLECTION_PARTNER_PRICE_VARIANT,
    DEFLECTION_FULL_REPORT_PRICE_CENTS,
  } = require(compiledPricingPath);
  const variantAmountCents = DEFLECTION_FULL_REPORT_PRICE_CENTS + 30_000;
  defaultStripeSession = {
    ...defaultStripeSession,
    amount_total: DEFLECTION_FULL_REPORT_PRICE_CENTS,
  };
  const standardCheckout = {
    amountCents: DEFLECTION_FULL_REPORT_PRICE_CENTS,
    currency: 'usd',
    priceId: 'price_atlas_standard123',
  };
  const partnerCheckout = {
    amountCents: DEFLECTION_PARTNER_PRICE_VARIANT.amountCents,
    currency: 'usd',
    priceId: 'price_atlas_partner123',
  };

  await writeFile(join(seoStubDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");
  await writeFile(
    join(seoStubDir, 'deflection-pricing.js'),
    [
      `exports.DEFLECTION_DEFAULT_PRICE_VARIANT = ${JSON.stringify(DEFLECTION_DEFAULT_PRICE_VARIANT)};`,
      `exports.DEFLECTION_DEFAULT_PRICE_VARIANT_ID = ${JSON.stringify(DEFLECTION_DEFAULT_PRICE_VARIANT.id)};`,
      `exports.DEFLECTION_PARTNER_PRICE_VARIANT = ${JSON.stringify(DEFLECTION_PARTNER_PRICE_VARIANT)};`,
      `exports.DEFLECTION_FULL_REPORT_PRICE_CENTS = ${DEFLECTION_FULL_REPORT_PRICE_CENTS};`,
      'exports.DEFLECTION_PRICE_VARIANTS = [exports.DEFLECTION_DEFAULT_PRICE_VARIANT, exports.DEFLECTION_PARTNER_PRICE_VARIANT];',
      'exports.resolveDeflectionPriceVariant = (value) => {',
      '  if (value === undefined || value === null) return exports.DEFLECTION_DEFAULT_PRICE_VARIANT;',
      "  if (typeof value !== 'string') return null;",
      '  return exports.DEFLECTION_PRICE_VARIANTS.find((variant) => variant.id === value.trim()) || null;',
      '};',
      '',
    ].join('\n'),
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
  const createSession = (checkout = standardCheckout, priceVariantId = undefined) =>
    createDeflectionCheckoutSession(
      'request-123',
      'attempt-12345678',
      checkout,
      priceVariantId,
    );
  installFetchMock();

  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'price_standard123',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_legacy123',
  });
  assert.deepEqual(
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer rk_live_unit_restricted');
  assert.equal(calls[0].body.get('line_items[0][price]'), 'price_atlas_standard123');
  assert.equal(calls[0].body.has('line_items[0][price_data][unit_amount]'), false);
  assert.equal(calls[0].body.get('metadata[account_id]'), 'acct_unit');
  assert.equal(calls[0].body.get('metadata[request_id]'), 'request-123');
  assert.equal(calls[0].body.get('metadata[price_variant]'), 'standard');
  assert.equal(calls[0].body.get('metadata[price_id]'), 'price_atlas_standard123');
  assert.equal(
    calls[0].body.get('metadata[price_amount_cents]'),
    String(DEFLECTION_FULL_REPORT_PRICE_CENTS),
  );
  assert.equal(calls[0].body.get('metadata[price_currency]'), 'usd');
  assert.equal(
    calls[0].body.get('success_url'),
    'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=success',
  );
  assert.equal(
    calls[0].body.get('cancel_url'),
    'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=cancel',
  );

  installFetchMock({
    ...defaultStripeSession,
    amount_total: DEFLECTION_PARTNER_PRICE_VARIANT.amountCents,
  });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'price_standard123',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123',
    ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
      `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${DEFLECTION_PARTNER_PRICE_VARIANT.amountCents}`,
  });
  assert.deepEqual(
    await createSession(partnerCheckout, 'partner'),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.get('line_items[0][price]'), 'price_atlas_partner123');
  assert.equal(calls[0].body.get('metadata[price_variant]'), 'partner');
  assert.equal(calls[0].body.get('metadata[price_id]'), 'price_atlas_partner123');
  assert.equal(
    calls[0].body.get('success_url'),
    'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=success&priceVariant=partner',
  );
  assert.equal(
    calls[0].body.get('cancel_url'),
    'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=cancel&priceVariant=partner',
  );

  installFetchMock({
    ...defaultStripeSession,
    amount_total: DEFLECTION_FULL_REPORT_PRICE_CENTS,
  });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'price_standard123',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123',
    ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
      `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${DEFLECTION_PARTNER_PRICE_VARIANT.amountCents}`,
  });
  assert.deepEqual(
    await createSession(partnerCheckout, 'partner'),
    { ok: false, reason: 'error' },
  );
  assert.equal(calls.length, 1);

  installFetchMock({
    ...defaultStripeSession,
    amount_total: DEFLECTION_PARTNER_PRICE_VARIANT.amountCents,
  });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'price_standard123',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123',
  });
  assert.deepEqual(
    await createSession(partnerCheckout, 'partner'),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'not_a_price',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_legacy123',
  });
  assert.deepEqual(
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.get('line_items[0][price]'), 'price_atlas_standard123');

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
  });
  assert.deepEqual(
    await createSession(standardCheckout, 'unknown'),
    { ok: false, reason: 'invalid_request' },
  );
  assert.equal(calls.length, 0);

  installFetchMock({ ...defaultStripeSession, amount_total: variantAmountCents });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
  });
  assert.deepEqual(
    await createSession(),
    { ok: false, reason: 'error' },
  );
  assert.equal(calls.length, 1);

  installFetchMock({ ...defaultStripeSession, amount_total: variantAmountCents });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
      `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${variantAmountCents}`,
  });
  assert.deepEqual(
    await createSession(),
    { ok: false, reason: 'error' },
  );
  assert.equal(calls.length, 1);

  installFetchMock({ ...defaultStripeSession, currency: 'eur' });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
  });
  assert.deepEqual(
    await createSession(),
    { ok: false, reason: 'error' },
  );
  assert.equal(calls.length, 1);

  installFetchMock({ url: 'https://checkout.stripe.test/session', currency: 'usd' });
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
  });
  assert.deepEqual(
    await createSession(),
    { ok: false, reason: 'error' },
  );
  assert.equal(calls.length, 1);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
      `${DEFLECTION_FULL_REPORT_PRICE_CENTS},,${variantAmountCents}`,
  });
  assert.deepEqual(
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS: '1500.00',
  });
  assert.deepEqual(
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    VERCEL_ENV: 'production',
  });
  assert.deepEqual(
    await createSession(),
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
    await createSession(),
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
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    VERCEL_ENV: 'preview',
  });
  assert.deepEqual(
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, 'Bearer sk_test_unit_secret');
  assert.equal(calls[0].body.get('line_items[0][price]'), 'price_atlas_standard123');
  assert.equal(calls[0].body.has('line_items[0][price_data][unit_amount]'), false);
  assert.equal(calls[0].body.get('metadata[price_variant]'), 'standard');
  assert.equal(
    calls[0].body.get('metadata[price_amount_cents]'),
    String(DEFLECTION_FULL_REPORT_PRICE_CENTS),
  );
  assert.equal(calls[0].body.get('metadata[price_id]'), 'price_atlas_standard123');

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    VERCEL_ENV: 'preview',
    ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
      String(variantAmountCents),
  });
  assert.deepEqual(
    await createSession(),
    { ok: true, url: 'https://checkout.stripe.test/session' },
  );
  assert.equal(calls.length, 1);

  installFetchMock();
  resetEnv({
    ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    ATLAS_ACCOUNT_ID: 'acct_unit',
    VERCEL_ENV: 'production',
  });
  assert.deepEqual(
    await createSession(),
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
    await createSession(),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(calls.length, 0);

  await writeFile(
    join(seoStubDir, 'atlas-deflection-client.js'),
    [
      'const authorizationCalls = [];',
      'let authorizationResult = {',
      '  ok: true,',
      '  checkout: { amountCents: 150000, currency: "usd", priceId: "price_atlas_route123" },',
      '};',
      'exports.authorizationCalls = authorizationCalls;',
      'exports.setAuthorizationResult = (value) => { authorizationResult = value; };',
      'exports.authorizeDeflectionCheckout = async (requestId) => {',
      '  authorizationCalls.push({ requestId });',
      '  return authorizationResult;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(seoStubDir, 'deflection-checkout.js'),
    [
      'const calls = [];',
      'exports.calls = calls;',
      'exports.createDeflectionCheckoutSession = async (requestId, attemptId, checkout, priceVariantId) => {',
      '  calls.push({ requestId, attemptId, checkout, priceVariantId });',
      "  return { ok: false, reason: 'not_configured' };",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(seoStubDir, 'deflection-rate-limit.js'),
    "exports.consumeDeflectionRateLimit = () => ({ ok: true });\n",
  );
  await writeFile(
    join(seoStubDir, 'gap-report-intake-database.js'),
    [
      'let savedPriceVariantId = null;',
      'exports.setSavedPriceVariantId = (value) => { savedPriceVariantId = value; };',
      'exports.getGapReportPriceVariantByReportRequestId = async () => savedPriceVariantId;',
      '',
    ].join('\n'),
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
  const checkoutRouteStub = require(join(seoStubDir, 'deflection-checkout.js'));
  const atlasRouteStub = require(join(seoStubDir, 'atlas-deflection-client.js'));
  const checkoutDatabaseStub = require(join(seoStubDir, 'gap-report-intake-database.js'));
  checkoutDatabaseStub.setSavedPriceVariantId(null);
  atlasRouteStub.setAuthorizationResult({
    ok: true,
    checkout: { amountCents: 150000, currency: 'usd', priceId: 'price_atlas_route123' },
  });
  const routeResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'request-123',
        attemptId: 'attempt-12345678',
        priceVariant: 'standard',
      }),
    }),
  );
  assert.equal(routeResponse.status, 503);
  assert.deepEqual(await routeResponse.json(), { error: 'Could not start checkout.' });
  assert.deepEqual(atlasRouteStub.authorizationCalls, [{ requestId: 'request-123' }]);
  assert.deepEqual(checkoutRouteStub.calls, [
    {
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      checkout: { amountCents: 150000, currency: 'usd', priceId: 'price_atlas_route123' },
      priceVariantId: 'standard',
    },
  ]);

  checkoutRouteStub.calls.length = 0;
  atlasRouteStub.authorizationCalls.length = 0;
  checkoutDatabaseStub.setSavedPriceVariantId(null);
  const unsignedDiscountResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'request-123',
        attemptId: 'attempt-12345678',
        priceVariant: 'partner',
      }),
    }),
  );
  assert.equal(unsignedDiscountResponse.status, 503);
  assert.deepEqual(await unsignedDiscountResponse.json(), {
    error: 'Could not start checkout. Please try again.',
  });
  assert.deepEqual(atlasRouteStub.authorizationCalls, []);
  assert.deepEqual(checkoutRouteStub.calls, []);

  checkoutRouteStub.calls.length = 0;
  atlasRouteStub.authorizationCalls.length = 0;
  checkoutDatabaseStub.setSavedPriceVariantId('partner');
  const partnerVariantResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'request-123',
        attemptId: 'attempt-12345678',
        priceVariant: 'partner',
      }),
    }),
  );
  assert.equal(partnerVariantResponse.status, 503);
  assert.deepEqual(await partnerVariantResponse.json(), {
    error: 'Could not start checkout. Please try again.',
  });
  assert.deepEqual(atlasRouteStub.authorizationCalls, []);
  assert.deepEqual(checkoutRouteStub.calls, []);

  checkoutRouteStub.calls.length = 0;
  atlasRouteStub.authorizationCalls.length = 0;
  checkoutDatabaseStub.setSavedPriceVariantId(null);
  atlasRouteStub.setAuthorizationResult({ ok: false, reason: 'not_found' });
  const missingReportResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'missing-123',
        attemptId: 'attempt-12345678',
        priceVariant: 'standard',
      }),
    }),
  );
  assert.equal(missingReportResponse.status, 404);
  assert.deepEqual(await missingReportResponse.json(), { error: 'Report not found.' });
  assert.deepEqual(atlasRouteStub.authorizationCalls, [{ requestId: 'missing-123' }]);
  assert.deepEqual(checkoutRouteStub.calls, []);

  atlasRouteStub.setAuthorizationResult({ ok: false, reason: 'already_paid' });
  atlasRouteStub.authorizationCalls.length = 0;
  const alreadyPaidResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'request-123',
        attemptId: 'attempt-12345678',
        priceVariant: 'standard',
      }),
    }),
  );
  assert.equal(alreadyPaidResponse.status, 200);
  assert.deepEqual(await alreadyPaidResponse.json(), { alreadyPaid: true });
  assert.deepEqual(atlasRouteStub.authorizationCalls, [{ requestId: 'request-123' }]);
  assert.deepEqual(checkoutRouteStub.calls, []);

  atlasRouteStub.setAuthorizationResult({
    ok: true,
    checkout: { amountCents: 150000, currency: 'usd', priceId: 'price_atlas_route123' },
  });
  atlasRouteStub.authorizationCalls.length = 0;
  const invalidVariantResponse = await POST(
    new Request('https://unit.test/api/deflection-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'request-123',
        attemptId: 'attempt-12345678',
        priceVariant: 'unknown',
      }),
    }),
  );
  assert.equal(invalidVariantResponse.status, 400);
  assert.deepEqual(await invalidVariantResponse.json(), { error: 'Invalid request.' });
  assert.deepEqual(atlasRouteStub.authorizationCalls, []);
  assert.deepEqual(checkoutRouteStub.calls, []);

  console.log('Deflection checkout tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
