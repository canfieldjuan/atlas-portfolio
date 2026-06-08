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
const pricingCatalogUrl = new URL('../src/lib/deflection-pricing-catalog.js', import.meta.url);
const partnerTokenUrl = new URL('../src/lib/deflection-partner-token.js', import.meta.url);
const gapReportIntakeUrl = new URL('../src/lib/gap-report-intake.ts', import.meta.url);
const rateLimitUrl = new URL('../src/lib/deflection-rate-limit.ts', import.meta.url);
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
const ACCESS_ENV_KEY = 'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const SIGNING_ENV_KEY = 'DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS';
const PERSIST_ENV_KEY = 'GAP_REPORT_TEST_PERSIST';
const SUBMIT_REASON_ENV_KEY = 'ATLAS_SUBMIT_TEST_REASON';
const HEAD_FAIL_ENV_KEY = 'GAP_REPORT_TEST_HEAD_FAIL';
const originalAccessEnv = process.env[ACCESS_ENV_KEY];
const originalSigningEnv = process.env[SIGNING_ENV_KEY];
const originalPersistEnv = process.env[PERSIST_ENV_KEY];
const originalSubmitReasonEnv = process.env[SUBMIT_REASON_ENV_KEY];
const originalHeadFailEnv = process.env[HEAD_FAIL_ENV_KEY];

function resetTokens({ access, signing } = {}) {
  delete process.env[ACCESS_ENV_KEY];
  delete process.env[SIGNING_ENV_KEY];
  if (access !== undefined) process.env[ACCESS_ENV_KEY] = access;
  if (signing !== undefined) process.env[SIGNING_ENV_KEY] = signing;
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
  const pricingCatalogSource = await readFile(pricingCatalogUrl, 'utf8');
  await writeFile(join(testDir, 'deflection-checkout-requirements.js'), checkoutRequirementsSource);
  await writeFile(join(testDir, 'deflection-pricing-catalog.js'), pricingCatalogSource);
  await writeFile(
    join(libStubDir, 'deflection-checkout-requirements.js'),
    checkoutRequirementsSource,
  );
  await writeFile(join(libStubDir, 'deflection-pricing-catalog.js'), pricingCatalogSource);
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
    DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV,
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
  assert.equal(DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV, SIGNING_ENV_KEY);

  resetTokens({ access: 'signed-partner-token' });
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken(' signed-partner-token '), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('wrong-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'partner');
  assert.equal(resolveIntakePriceVariantId('partner', 'wrong-token'), 'standard');
  assert.equal(resolveIntakePriceVariantId('standard', 'signed-partner-token'), 'standard');
  assert.equal(resolveIntakePriceVariantId('unknown', 'signed-partner-token'), 'standard');

  resetTokens({ access: 'old-partner-token, signed-partner-token , next-partner-token' });
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
  resetTokens({ signing: 'signed-secret' });
  assert.equal(hasDeflectionPartnerPriceAccessToken(signedToken), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-secret'), false);
  assert.equal(resolveIntakePriceVariantId('partner', signedToken), 'partner');
  assert.equal(hasDeflectionPartnerAccessToken(signedToken, ['signed-secret']), false);
  assert.equal(hasDeflectionPartnerPriceAccessToken(`${signedToken.slice(0, -1)}x`), false);
  assert.equal(
    hasDeflectionPartnerAccessToken(signedToken, ['signed-secret'], { nowSeconds: expiresAt + 1 }),
    false,
  );
  assert.equal(hasDeflectionPartnerAccessToken('partner_v1.not-json.signature', ['signed-secret']), false);

  resetTokens({ signing: 'old-signing-secret,current-signing-secret' });
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

  resetTokens({ access: 'old-signing-secret', signing: 'current-signing-secret' });
  assert.equal(hasDeflectionPartnerPriceAccessToken(oldSignedToken), false);
  assert.equal(hasDeflectionPartnerPriceAccessToken(currentSignedToken), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('old-signing-secret'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('current-signing-secret'), false);

  resetTokens({ access: 'legacy-signing-secret' });
  const legacyFallbackSignedToken = createDeflectionPartnerSignedAccessToken({
    secret: 'legacy-signing-secret',
    partner: 'acme',
    expiresAt,
  });
  assert.equal(hasDeflectionPartnerPriceAccessToken(legacyFallbackSignedToken), true);

  resetTokens({ access: ' , signed-partner-token ,, ' });
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken(''), false);

  resetTokens({ access: ' , ,, ' });
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'standard');

  resetTokens();
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'standard');

  const directOnlyCliRun = spawnSync(
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
      env: { ...process.env, [ACCESS_ENV_KEY]: 'direct-cli-token' },
      encoding: 'utf8',
    },
  );
  assert.equal(directOnlyCliRun.status, 1);
  assert.equal(directOnlyCliRun.stdout, '');
  assert(
    directOnlyCliRun.stderr.includes(`Missing ${SIGNING_ENV_KEY}`),
    directOnlyCliRun.stderr,
  );

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
      env: {
        ...process.env,
        [ACCESS_ENV_KEY]: 'direct-cli-token',
        [SIGNING_ENV_KEY]: 'old-cli-secret,cli-signing-secret',
      },
      encoding: 'utf8',
    },
  );
  assert.equal(cliRun.status, 0, cliRun.stderr);
  const cliToken = cliRun.stdout.trim();
  assert(cliToken.startsWith(`${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.`));
  assert(!cliToken.includes('cli-signing-secret'));
  resetTokens({ access: 'direct-cli-token' });
  assert.equal(hasDeflectionPartnerPriceAccessToken(cliToken), false);
  resetTokens({ signing: 'cli-signing-secret' });
  assert.equal(hasDeflectionPartnerPriceAccessToken(cliToken), true);
  assert.equal(hasDeflectionPartnerPriceAccessToken('cli-signing-secret'), false);

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
    [
      'exports.persistGapReportSubmission = async () => {',
      '  globalThis.__gapReportPersistCalls = (globalThis.__gapReportPersistCalls || 0) + 1;',
      "  return process.env.GAP_REPORT_TEST_PERSIST !== 'false';",
      '};',
      'exports.getRecentGapReportSubmissionByEmailAndBlob = async (email, csvBlobUrl, submittedAfterIso) => {',
      '  globalThis.__gapReportDuplicateLookupCalls = (globalThis.__gapReportDuplicateLookupCalls || 0) + 1;',
      '  globalThis.__gapReportLastDuplicateLookup = { email, csvBlobUrl, submittedAfterIso };',
      '  return globalThis.__gapReportExistingSubmission || null;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(join(libStubDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");
  await writeFile(
    join(libStubDir, 'atlas-deflection-client.js'),
    [
      'exports.submitDeflectionReportCsv = async () => {',
      '  globalThis.__atlasSubmitCalls = (globalThis.__atlasSubmitCalls || 0) + 1;',
      '  const reason = process.env.ATLAS_SUBMIT_TEST_REASON;',
      "  return reason ? { ok: false, reason } : { ok: true, requestId: 'content-ops-unit-123' };",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(blobStubDir, 'index.js'),
    [
      'exports.head = async () => {',
      '  globalThis.__gapReportHeadCalls = (globalThis.__gapReportHeadCalls || 0) + 1;',
      "  if (process.env.GAP_REPORT_TEST_HEAD_FAIL === 'true') throw new Error('not found');",
      "  return { url: 'https://blob.example/gap-report-csvs/unit.csv' };",
      '};',
      '',
    ].join('\n'),
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
  const rateLimitSource = await readFile(rateLimitUrl, 'utf8');
  const compiledRateLimit = ts.transpileModule(rateLimitSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(join(libStubDir, 'deflection-rate-limit.js'), compiledRateLimit.outputText);

  const recordRouteSource = await readFile(recordRouteUrl, 'utf8');
  const compiledRecordRoute = ts.transpileModule(recordRouteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledRecordRoutePath, compiledRecordRoute.outputText);
  const { POST } = require(compiledRecordRoutePath);
  globalThis.__gapReportPersistCalls = 0;
  globalThis.__gapReportDuplicateLookupCalls = 0;
  globalThis.__gapReportHeadCalls = 0;
  globalThis.__atlasSubmitCalls = 0;
  delete globalThis.__atlasDeflectionRateLimitStore;

  function recordRequest({ ip = '203.0.113.10', email = 'alex@example.com', priceVariant = 'standard' } = {}) {
    return new Request('https://unit.test/api/gap-report-intake/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({
        name: 'Alex Lee',
        email,
        companyName: 'Effingham Office Maids',
        supportPlatform: 'helpscout',
        csvFilename: 'tickets.csv',
        sourcePage: '/systems/support-ticket-deflection/intake',
        sourceOffer: 'support-ticket-deflection-intake',
        priceVariant,
        blobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      }),
    });
  }

  resetTokens({ access: 'signed-partner-token' });
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

  globalThis.__gapReportExistingSubmission = {
    requestId: '22222222-2222-4222-8222-222222222222',
    reportRequestId: 'content-ops-existing-456',
    submittedAt: '2026-06-08T19:40:00.000Z',
  };
  const submitCallsBeforeDuplicate = globalThis.__atlasSubmitCalls;
  const persistCallsBeforeDuplicate = globalThis.__gapReportPersistCalls;
  const duplicateRecord = await POST(recordRequest({ ip: '203.0.113.21' }));
  assert.equal(duplicateRecord.status, 200);
  assert.deepEqual(await duplicateRecord.json(), {
    ok: true,
    requestId: '22222222-2222-4222-8222-222222222222',
    reportRequestId: 'content-ops-existing-456',
    status: 'already_submitted',
    warnings: [],
    estimatedResponseHours: 24,
  });
  assert.equal(globalThis.__gapReportLastDuplicateLookup.email, 'alex@example.com');
  assert.equal(
    globalThis.__gapReportLastDuplicateLookup.csvBlobUrl,
    'https://blob.example/gap-report-csvs/unit.csv',
  );
  assert.equal(globalThis.__atlasSubmitCalls, submitCallsBeforeDuplicate);
  assert.equal(globalThis.__gapReportPersistCalls, persistCallsBeforeDuplicate);
  delete globalThis.__gapReportExistingSubmission;
  delete globalThis.__atlasDeflectionRateLimitStore;

  process.env[HEAD_FAIL_ENV_KEY] = 'true';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const forgedBlob = await POST(
      recordRequest({ ip: `198.51.100.${attempt + 10}`, email: 'victim@example.com' }),
    );
    assert.equal(forgedBlob.status, 400);
    assert.deepEqual(await forgedBlob.json(), { ok: false, error: 'Upload not found.' });
  }
  delete process.env[HEAD_FAIL_ENV_KEY];
  const validVictimRecord = await POST(
    recordRequest({ ip: '198.51.100.50', email: 'victim@example.com' }),
  );
  assert.equal(validVictimRecord.status, 200);
  assert.equal((await validVictimRecord.json()).reportRequestId, 'content-ops-unit-123');
  delete globalThis.__atlasDeflectionRateLimitStore;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const accepted = await POST(
      recordRequest({ ip: '203.0.113.77', email: 'rate-limited@example.com' }),
    );
    assert.equal(accepted.status, 200);
  }
  const headCallsBeforeRateLimit = globalThis.__gapReportHeadCalls;
  const submitCallsBeforeRateLimit = globalThis.__atlasSubmitCalls;
  const persistCallsBeforeRateLimit = globalThis.__gapReportPersistCalls;
  const rateLimitedRecord = await POST(
    recordRequest({ ip: '203.0.113.77', email: 'rate-limited@example.com' }),
  );
  assert.equal(rateLimitedRecord.status, 429);
  assert.equal(Number(rateLimitedRecord.headers.get('Retry-After')) > 0, true);
  assert.deepEqual(await rateLimitedRecord.json(), {
    ok: false,
    error: 'Too many submission attempts. Please try again later.',
  });
  assert.equal(globalThis.__gapReportHeadCalls, headCallsBeforeRateLimit);
  assert.equal(globalThis.__atlasSubmitCalls, submitCallsBeforeRateLimit);
  assert.equal(globalThis.__gapReportPersistCalls, persistCallsBeforeRateLimit);
  delete globalThis.__atlasDeflectionRateLimitStore;

  const submitFailureFixtures = [
    {
      reason: 'not_configured',
      status: 503,
      error:
        'Deflection report generation is temporarily unavailable. Please try again in a moment or email us directly.',
    },
    {
      reason: 'blob_not_found',
      status: 400,
      error: 'We could not read the uploaded CSV. Please retry the upload.',
    },
    {
      reason: 'invalid_response',
      status: 502,
      error:
        'Deflection report generation returned an unexpected response. Please try again or email us directly.',
    },
    {
      reason: 'rejected',
      status: 502,
      error:
        'Deflection report generation rejected this CSV. Please check the export and try again, or email us directly.',
    },
    {
      reason: 'error',
      status: 503,
      error:
        'Deflection report generation failed. Please try again in a moment or email us directly.',
    },
  ];
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    for (const { reason, status, error } of submitFailureFixtures) {
      delete globalThis.__atlasDeflectionRateLimitStore;
      process.env[SUBMIT_REASON_ENV_KEY] = reason;
      const persistCallsBeforeSubmitFailure = globalThis.__gapReportPersistCalls;
      const atlasSubmitFailure = await POST(
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
      assert.equal(atlasSubmitFailure.status, status);
      assert.deepEqual(await atlasSubmitFailure.json(), {
        ok: false,
        status: 'failed_to_submit',
        reason,
        error,
      });
      assert.equal(
        globalThis.__gapReportPersistCalls,
        persistCallsBeforeSubmitFailure,
        'failed ATLAS submit should not persist a successful local intake row',
      );
    }
  } finally {
    console.error = originalConsoleError;
    delete process.env[SUBMIT_REASON_ENV_KEY];
  }

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
  delete process.env[ACCESS_ENV_KEY];
  delete process.env[SIGNING_ENV_KEY];
  delete process.env[PERSIST_ENV_KEY];
  delete process.env[SUBMIT_REASON_ENV_KEY];
  delete process.env[HEAD_FAIL_ENV_KEY];
  if (originalAccessEnv !== undefined) process.env[ACCESS_ENV_KEY] = originalAccessEnv;
  if (originalSigningEnv !== undefined) process.env[SIGNING_ENV_KEY] = originalSigningEnv;
  if (originalPersistEnv !== undefined) process.env[PERSIST_ENV_KEY] = originalPersistEnv;
  if (originalSubmitReasonEnv !== undefined) {
    process.env[SUBMIT_REASON_ENV_KEY] = originalSubmitReasonEnv;
  }
  if (originalHeadFailEnv !== undefined) process.env[HEAD_FAIL_ENV_KEY] = originalHeadFailEnv;
  delete globalThis.__atlasDeflectionRateLimitStore;
  delete globalThis.__atlasSubmitCalls;
  delete globalThis.__gapReportDuplicateLookupCalls;
  delete globalThis.__gapReportExistingSubmission;
  delete globalThis.__gapReportHeadCalls;
  delete globalThis.__gapReportLastDuplicateLookup;
  delete globalThis.__gapReportPersistCalls;
  await rm(testDir, { recursive: true, force: true });
}
