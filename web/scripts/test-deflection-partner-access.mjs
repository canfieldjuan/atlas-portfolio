import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-partner-access-'));
const sourceUrl = new URL('../src/lib/deflection-partner-access.ts', import.meta.url);
const checkoutRequirementsUrl = new URL(
  '../src/lib/deflection-checkout-requirements.js',
  import.meta.url,
);
const partnerTokenUrl = new URL('../src/lib/deflection-partner-token.js', import.meta.url);
const gapReportIntakeUrl = new URL('../src/lib/gap-report-intake.ts', import.meta.url);
const recordRouteUrl = new URL(
  '../src/app/api/gap-report-intake/record/route.ts',
  import.meta.url,
);
const intakePageUrl = new URL(
  '../src/app/systems/support-ticket-deflection/intake/page.tsx',
  import.meta.url,
);
const partnerPageUrl = new URL(
  '../src/app/systems/support-ticket-deflection/partner/page.tsx',
  import.meta.url,
);
const partnerClientUrl = new URL(
  '../src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx',
  import.meta.url,
);
const compiledPath = join(testDir, 'deflection-partner-access.cjs');
const compiledRecordRoutePath = join(testDir, 'gap-report-record-route.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
const nextStubDir = join(testDir, 'node_modules', 'next');
const ENV_KEY = 'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const PERSIST_ENV_KEY = 'GAP_REPORT_TEST_PERSIST';
const originalEnv = process.env[ENV_KEY];
const originalPersistEnv = process.env[PERSIST_ENV_KEY];

function resetToken(value) {
  delete process.env[ENV_KEY];
  if (value !== undefined) process.env[ENV_KEY] = value;
}

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(blobStubDir, { recursive: true });
  await mkdir(nextStubDir, { recursive: true });
  const pricingStub = [
    "exports.DEFLECTION_DEFAULT_PRICE_VARIANT_ID = 'standard';",
    "exports.DEFLECTION_PARTNER_PRICE_VARIANT_ID = 'partner';",
    'exports.resolveDeflectionPriceVariant = (value) => {',
    "  if (value === undefined || value === null || value === 'standard') return { id: 'standard' };",
    "  if (value === 'partner') return { id: 'partner' };",
    '  return null;',
    '};',
    '',
  ].join('\n');
  await writeFile(join(testDir, 'deflection-pricing.js'), pricingStub);
  await writeFile(join(libStubDir, 'deflection-pricing.js'), pricingStub);

  const source = await readFile(sourceUrl, 'utf8');
  const partnerTokenSource = await readFile(partnerTokenUrl, 'utf8');
  await writeFile(join(testDir, 'deflection-partner-token.js'), partnerTokenSource);
  await writeFile(join(libStubDir, 'deflection-partner-token.js'), partnerTokenSource);
  const checkoutRequirementsSource = await readFile(checkoutRequirementsUrl, 'utf8');
  await writeFile(join(testDir, 'deflection-checkout-requirements.js'), checkoutRequirementsSource);
  await writeFile(
    join(libStubDir, 'deflection-checkout-requirements.js'),
    checkoutRequirementsSource,
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);
  await writeFile(join(libStubDir, 'deflection-partner-access.js'), compiled.outputText);
  const require = createRequire(compiledPath);
  const {
    DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX,
    createDeflectionPartnerSignedAccessToken,
    hasDeflectionPartnerAccessToken,
  } = require(join(testDir, 'deflection-partner-token.js'));
  const {
    DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM,
    hasDeflectionPartnerPriceAccessToken,
    resolveIntakePriceVariantId,
  } = require(compiledPath);

  assert.equal(DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM, 'partnerToken');

  resetToken('signed-partner-token');
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken(' signed-partner-token '), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('wrong-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'partner');
  assert.equal(resolveIntakePriceVariantId('partner', 'wrong-token'), 'standard');
  assert.equal(resolveIntakePriceVariantId('standard', 'signed-partner-token'), 'standard');
  assert.equal(resolveIntakePriceVariantId('unknown', 'signed-partner-token'), 'standard');

  resetToken('old-partner-token, signed-partner-token , next-partner-token');
  assert.equal(hasDeflectionPartnerPriceAccessToken('old-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('next-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('wrong-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'next-partner-token'), 'partner');

  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const signedToken = createDeflectionPartnerSignedAccessToken({
    secret: 'signed-secret',
    partner: 'acme',
    expiresAt,
  });
  assert(signedToken.startsWith(`${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.`));
  resetToken('signed-secret');
  assert.equal(hasDeflectionPartnerPriceAccessToken(signedToken), true);
  assert.equal(resolveIntakePriceVariantId('partner', signedToken), 'partner');
  assert.equal(hasDeflectionPartnerPriceAccessToken(`${signedToken.slice(0, -1)}x`), false);
  assert.equal(
    hasDeflectionPartnerAccessToken(signedToken, ['signed-secret'], { nowSeconds: expiresAt + 1 }),
    false,
  );
  assert.equal(hasDeflectionPartnerAccessToken('partner_v1.not-json.signature', ['signed-secret']), false);

  resetToken('old-signing-secret,current-signing-secret');
  const oldSignedToken = createDeflectionPartnerSignedAccessToken({
    secret: 'old-signing-secret',
    partner: 'acme',
    expiresAt,
  });
  const currentSignedToken = createDeflectionPartnerSignedAccessToken({
    secret: 'current-signing-secret',
    partner: 'acme',
    expiresAt,
  });
  assert.equal(hasDeflectionPartnerPriceAccessToken(oldSignedToken), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken(currentSignedToken), true);

  resetToken(' , signed-partner-token ,, ');
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken(''), false);

  resetToken(' , ,, ');
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'standard');

  resetToken(undefined);
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'standard');

  const cliRun = spawnSync(
    process.execPath,
    [
      new URL('./create-deflection-partner-token.mjs', import.meta.url).pathname,
      '--partner',
      'acme',
      '--ttl-days',
      '7',
      '--no-local-env',
    ],
    {
      cwd: new URL('..', import.meta.url).pathname,
      env: { ...process.env, [ENV_KEY]: 'old-cli-secret,cli-signing-secret' },
      encoding: 'utf8',
    },
  );
  assert.equal(cliRun.status, 0, cliRun.stderr);
  const cliToken = cliRun.stdout.trim();
  assert(cliToken.startsWith(`${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.`));
  assert(!cliToken.includes('cli-signing-secret'));
  resetToken('old-cli-secret');
  assert.equal(hasDeflectionPartnerPriceAccessToken(cliToken), false);
  resetToken('cli-signing-secret');
  assert.equal(hasDeflectionPartnerPriceAccessToken(cliToken), true);

  const intakePage = await readFile(intakePageUrl, 'utf8');
  assert.ok(
    intakePage.includes('resolveIntakePriceVariantId'),
    'intake route gates price variant through the partner access helper',
  );
  assert.ok(
    intakePage.includes('DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM'),
    'intake route reads the partner token param',
  );

  const partnerPage = await readFile(partnerPageUrl, 'utf8');
  assert.ok(
    partnerPage.includes('hasDeflectionPartnerPriceAccessToken'),
    'partner page validates token server-side before linking partner intake',
  );
  assert.ok(
    partnerPage.includes('hasPartnerAccess ? token : undefined'),
    'partner page passes only validated tokens into the client funnel',
  );

  const partnerClient = await readFile(partnerClientUrl, 'utf8');
  assert.ok(
    partnerClient.includes('DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel'),
    'partner client falls back to standard pricing without token access',
  );
  assert.ok(
    partnerClient.includes('priceVariant: DEFLECTION_PARTNER_PRICE_VARIANT.id'),
    'partner client includes partner variant only in validated partner intake links',
  );

  await writeFile(
    join(libStubDir, 'gap-report-intake-database.js'),
    "exports.persistGapReportSubmission = async () => process.env.GAP_REPORT_TEST_PERSIST !== 'false';\n",
  );
  await writeFile(join(libStubDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");
  await writeFile(
    join(libStubDir, 'atlas-deflection-client.js'),
    "exports.submitDeflectionReportCsv = async () => ({ ok: true, requestId: 'content-ops-unit-123' });\n",
  );
  await writeFile(
    join(blobStubDir, 'index.js'),
    "exports.head = async () => ({ url: 'https://blob.example/gap-report-csvs/unit.csv' });\n",
  );
  await writeFile(
    join(nextStubDir, 'server.js'),
    "exports.NextResponse = { json: (body, init) => Response.json(body, init) };\n",
  );

  const gapReportIntakeSource = await readFile(gapReportIntakeUrl, 'utf8');
  const compiledGapReportIntake = ts.transpileModule(gapReportIntakeSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(join(libStubDir, 'gap-report-intake.js'), compiledGapReportIntake.outputText);

  const recordRouteSource = await readFile(recordRouteUrl, 'utf8');
  const compiledRecordRoute = ts.transpileModule(recordRouteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledRecordRoutePath, compiledRecordRoute.outputText);
  const { POST } = require(compiledRecordRoutePath);

  resetToken('signed-partner-token');
  const forgedPartnerRecord = await POST(
    new Request('https://unit.test/api/gap-report-intake/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Lee',
        email: 'alex@example.com',
        companyName: 'Effingham Office Maids',
        supportPlatform: 'helpscout',
        csvFilename: 'tickets.csv',
        sourcePage: '/systems/support-ticket-deflection/intake',
        sourceOffer: 'support-ticket-deflection-intake',
        priceVariant: 'partner',
        blobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      }),
    }),
  );
  assert.equal(forgedPartnerRecord.status, 400);
  assert.deepEqual(await forgedPartnerRecord.json(), {
    ok: false,
    error: 'Invalid partner price access token.',
  });

  process.env[PERSIST_ENV_KEY] = 'false';
  const validPartnerWithoutPersistence = await POST(
    new Request('https://unit.test/api/gap-report-intake/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Lee',
        email: 'alex@example.com',
        companyName: 'Effingham Office Maids',
        supportPlatform: 'helpscout',
        csvFilename: 'tickets.csv',
        sourcePage: '/systems/support-ticket-deflection/intake',
        sourceOffer: 'support-ticket-deflection-intake',
        priceVariant: 'partner',
        partnerToken: 'signed-partner-token',
        blobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      }),
    }),
  );
  assert.equal(validPartnerWithoutPersistence.status, 503);
  assert.deepEqual(await validPartnerWithoutPersistence.json(), {
    ok: false,
    error: 'Partner price could not be saved. Please retry your upload.',
  });

  const standardWithoutPersistence = await POST(
    new Request('https://unit.test/api/gap-report-intake/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Lee',
        email: 'alex@example.com',
        companyName: 'Effingham Office Maids',
        supportPlatform: 'helpscout',
        csvFilename: 'tickets.csv',
        sourcePage: '/systems/support-ticket-deflection/intake',
        sourceOffer: 'support-ticket-deflection-intake',
        priceVariant: 'standard',
        blobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      }),
    }),
  );
  assert.equal(standardWithoutPersistence.status, 200);
  const standardPayload = await standardWithoutPersistence.json();
  assert.equal(standardPayload.ok, true);
  assert.equal(standardPayload.reportRequestId, 'content-ops-unit-123');
  assert.equal(standardPayload.status, 'submitted_with_warnings');
  assert(
    standardPayload.warnings.some((warning) =>
      warning.includes('Gap Report database persistence not configured'),
    ),
  );

  console.log('Deflection partner access tests passed.');
} finally {
  delete process.env[ENV_KEY];
  delete process.env[PERSIST_ENV_KEY];
  if (originalEnv !== undefined) process.env[ENV_KEY] = originalEnv;
  if (originalPersistEnv !== undefined) process.env[PERSIST_ENV_KEY] = originalPersistEnv;
  await rm(testDir, { recursive: true, force: true });
}
