import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-partner-access-'));
const sourceUrl = new URL('../src/lib/deflection-partner-access.ts', import.meta.url);
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
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const ENV_KEY = 'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const originalEnv = process.env[ENV_KEY];

function resetToken(value) {
  delete process.env[ENV_KEY];
  if (value !== undefined) process.env[ENV_KEY] = value;
}

try {
  await mkdir(libStubDir, { recursive: true });
  await writeFile(
    join(libStubDir, 'deflection-pricing.js'),
    [
      "exports.DEFLECTION_DEFAULT_PRICE_VARIANT_ID = 'standard';",
      "exports.DEFLECTION_PARTNER_PRICE_VARIANT_ID = 'partner';",
      'exports.resolveDeflectionPriceVariant = (value) => {',
      "  if (value === undefined || value === null || value === 'standard') return { id: 'standard' };",
      "  if (value === 'partner') return { id: 'partner' };",
      '  return null;',
      '};',
      '',
    ].join('\n'),
  );

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);
  const require = createRequire(compiledPath);
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

  resetToken(undefined);
  assert.equal(hasDeflectionPartnerPriceAccessToken('signed-partner-token'), false);
  assert.equal(resolveIntakePriceVariantId('partner', 'signed-partner-token'), 'standard');

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

  console.log('Deflection partner access tests passed.');
} finally {
  delete process.env[ENV_KEY];
  if (originalEnv !== undefined) process.env[ENV_KEY] = originalEnv;
  await rm(testDir, { recursive: true, force: true });
}
