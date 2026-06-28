import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-price-display-'));
const atlasClientSourceUrl = new URL('../src/lib/atlas-deflection-client.ts', import.meta.url);
const pricingSourceUrl = new URL('../src/lib/deflection-pricing.ts', import.meta.url);
const pricingCatalogSourceUrl = new URL(
  '../src/lib/deflection-pricing-catalog.js',
  import.meta.url,
);
const compiledAtlasClientPath = join(testDir, 'atlas-deflection-client.cjs');
const compiledPricingPath = join(testDir, 'deflection-pricing.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

let fetchCalls = [];
let fetchStatus = 200;
let fetchPayload = {
  variant: 'standard',
  status: 'configured',
  amount_cents: 180000,
  currency: 'USD',
};
let consoleErrors = [];

function resetEnv(values = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function resetFetch(values = {}) {
  fetchCalls = [];
  consoleErrors = [];
  fetchStatus = values.status ?? 200;
  fetchPayload = values.payload ?? {
    variant: 'standard',
    status: 'configured',
    amount_cents: 180000,
    currency: 'USD',
  };
}

globalThis.fetch = async (url, init) => {
  fetchCalls.push({
    url: String(url),
    headers: init?.headers ?? {},
  });
  return Response.json(fetchPayload, { status: fetchStatus });
};

console.error = (...args) => {
  consoleErrors.push(args.join(' '));
};

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(blobStubDir, { recursive: true });
  await writeFile(
    join(libStubDir, 'deflection-snapshot.js'),
    "exports.deflectionSnapshotPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/snapshot`;\n",
  );
  await writeFile(
    join(libStubDir, 'deflection-report-contract.js'),
    [
      "exports.deflectionArtifactPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/artifact`;",
      "exports.deflectionReportModelPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/report-model`;",
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'gap-report-intake.js'),
    [
      "exports.gapReportBlobToken = () => 'vercel_blob_rw_unit';",
      "exports.gapReportBlobTokens = () => ['vercel_blob_rw_unit'];",
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'structured-runtime-log.js'),
    'exports.structuredRuntimeError = () => {};\n',
  );
  await writeFile(join(blobStubDir, 'index.js'), 'exports.get = async () => null;\n');
  await writeFile(
    join(testDir, 'deflection-pricing-catalog.js'),
    await readFile(pricingCatalogSourceUrl, 'utf8'),
  );

  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  };
  const pricingSource = await readFile(pricingSourceUrl, 'utf8');
  await writeFile(
    compiledPricingPath,
    ts.transpileModule(pricingSource, { compilerOptions }).outputText,
  );
  const atlasClientSource = await readFile(atlasClientSourceUrl, 'utf8');
  await writeFile(
    compiledAtlasClientPath,
    ts.transpileModule(atlasClientSource, { compilerOptions }).outputText,
  );

  const require = createRequire(compiledAtlasClientPath);
  const {
    authorizeDeflectionCheckout,
    fetchDeflectionPricingTerms,
    fetchDeflectionStandardPricingTerms,
  } = require(compiledAtlasClientPath);
  const {
    DEFLECTION_DEFAULT_PRICE_VARIANT,
    DEFLECTION_PARTNER_PRICE_VARIANT,
    DEFLECTION_PRICE_UNAVAILABLE_LABEL,
    withDeflectionPriceDisplayTerms,
    withDeflectionStandardPriceDisplayTerms,
  } = require(compiledPricingPath);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.test/',
    ATLAS_B2B_SERVICE_TOKEN: 'atlas_unit_token',
  });
  resetFetch();
  assert.deepEqual(await fetchDeflectionStandardPricingTerms(), {
    ok: true,
    terms: {
      variant: 'standard',
      status: 'configured',
      amountCents: 180000,
      currency: 'usd',
    },
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.test/api/v1/content-ops/deflection-reports/pricing/standard',
  );
  assert.equal(fetchCalls[0].headers.Authorization, 'Bearer atlas_unit_token');

  resetFetch({
    payload: {
      variant: 'partner',
      status: 'configured',
      amount_cents: 120000,
      currency: 'USD',
    },
  });
  assert.deepEqual(await fetchDeflectionPricingTerms('partner'), {
    ok: true,
    terms: {
      variant: 'partner',
      status: 'configured',
      amountCents: 120000,
      currency: 'usd',
    },
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.test/api/v1/content-ops/deflection-reports/pricing/partner',
  );

  resetFetch({
    payload: {
      variant: 'standard',
      status: 'configured',
      amount_cents: 120000,
      currency: 'USD',
    },
  });
  assert.deepEqual(await fetchDeflectionPricingTerms('partner'), {
    ok: false,
    reason: 'error',
  });

  resetFetch({
    payload: {
      status: 'authorized',
      checkout: {
        amount_cents: 180000,
        currency: 'USD',
        price_id: 'price_atlas_standard123',
      },
    },
  });
  assert.deepEqual(await authorizeDeflectionCheckout('request-123'), {
    ok: true,
    checkout: {
      amountCents: 180000,
      currency: 'usd',
      priceId: 'price_atlas_standard123',
    },
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.test/api/v1/content-ops/deflection-reports/request-123/checkout-authorization',
  );

  resetFetch({
    payload: {
      status: 'authorized',
      checkout: {
        amount_cents: 180000,
        currency: 'USD',
        price_id: 'price_atlas_standard123',
      },
    },
  });
  assert.deepEqual(await authorizeDeflectionCheckout('request-123', 'standard'), {
    ok: true,
    checkout: {
      amountCents: 180000,
      currency: 'usd',
      priceId: 'price_atlas_standard123',
    },
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.test/api/v1/content-ops/deflection-reports/request-123/checkout-authorization?price_variant=standard',
  );

  resetFetch({
    payload: {
      status: 'authorized',
      checkout: {
        amount_cents: 100000,
        currency: 'USD',
        price_id: 'price_atlas_partner123',
      },
    },
  });
  assert.deepEqual(await authorizeDeflectionCheckout('request-123', 'partner'), {
    ok: true,
    checkout: {
      amountCents: 100000,
      currency: 'usd',
      priceId: 'price_atlas_partner123',
    },
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.test/api/v1/content-ops/deflection-reports/request-123/checkout-authorization?price_variant=partner',
  );

  resetFetch({ status: 503 });
  assert.deepEqual(await fetchDeflectionStandardPricingTerms(), {
    ok: false,
    reason: 'not_configured',
  });

  resetFetch({ payload: { variant: 'standard', status: 'configured', amount_cents: 0, currency: 'usd' } });
  assert.deepEqual(await fetchDeflectionStandardPricingTerms(), {
    ok: false,
    reason: 'error',
  });

  resetEnv();
  resetFetch();
  assert.deepEqual(await fetchDeflectionStandardPricingTerms(), {
    ok: false,
    reason: 'not_configured',
  });
  assert.equal(fetchCalls.length, 0);

  const atlasPriced = withDeflectionStandardPriceDisplayTerms(
    DEFLECTION_DEFAULT_PRICE_VARIANT,
    { amountCents: 180000, currency: 'usd' },
  );
  assert.equal(atlasPriced.priceLabel, '$1,800');
  assert.equal(atlasPriced.amountCents, 180000);
  assert.equal(atlasPriced.priceUnavailable, false);

  const unavailable = withDeflectionStandardPriceDisplayTerms(
    DEFLECTION_DEFAULT_PRICE_VARIANT,
    null,
  );
  assert.equal(unavailable.priceLabel, DEFLECTION_PRICE_UNAVAILABLE_LABEL);
  assert.equal(unavailable.amountCents, 0);
  assert.equal(unavailable.priceUnavailable, true);

  const partnerAtlasPriced = withDeflectionPriceDisplayTerms(
    DEFLECTION_PARTNER_PRICE_VARIANT,
    { variant: 'partner', amountCents: 120000, currency: 'usd' },
  );
  assert.equal(partnerAtlasPriced.priceLabel, '$1,200');
  assert.equal(partnerAtlasPriced.amountCents, 120000);
  assert.equal(partnerAtlasPriced.priceUnavailable, false);

  const partnerUnavailable = withDeflectionPriceDisplayTerms(
    DEFLECTION_PARTNER_PRICE_VARIANT,
    null,
  );
  assert.equal(partnerUnavailable.priceLabel, DEFLECTION_PRICE_UNAVAILABLE_LABEL);
  assert.equal(partnerUnavailable.amountCents, 0);
  assert.equal(partnerUnavailable.priceUnavailable, true);

  assert.equal(
    withDeflectionStandardPriceDisplayTerms(DEFLECTION_PARTNER_PRICE_VARIANT, null)
      .priceLabel,
    DEFLECTION_PARTNER_PRICE_VARIANT.priceLabel,
  );

  console.log('Deflection ATLAS price display tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
