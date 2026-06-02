import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'deflection-checkout-diagnostics-'));
const sourceUrl = new URL('../src/lib/deflection-checkout-diagnostics.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-checkout-diagnostics.cjs');

try {
  await mkdir(testDir, { recursive: true });
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
    DEFLECTION_CHECKOUT_DIAGNOSTIC_KEY,
    buildDeflectionCheckoutDiagnostic,
    recordDeflectionCheckoutDiagnostic,
  } = require(compiledPath);

  const diagnostic = buildDeflectionCheckoutDiagnostic({
    phase: 'checkout_redirect',
    requestId: 'content-ops-report-abc12345',
    attemptId: 'attempt-12345678',
    elapsedMs: 12.4,
    responseOk: true,
    responseStatus: 200,
    url: 'https://checkout.stripe.com/c/pay/cs_live_1234567890abcdef',
  });

  assert.equal(diagnostic.source, 'deflection_checkout');
  assert.equal(diagnostic.phase, 'checkout_redirect');
  assert.equal(diagnostic.requestIdTail, 'abc12345');
  assert.equal(diagnostic.attemptIdTail, '12345678');
  assert.equal(diagnostic.elapsedMs, 12);
  assert.equal(diagnostic.responseOk, true);
  assert.equal(diagnostic.responseStatus, 200);
  assert.equal(diagnostic.hasUrl, true);
  assert.equal(diagnostic.checkoutUrlOrigin, 'https://checkout.stripe.com');
  assert.equal(diagnostic.checkoutUrlHost, 'checkout.stripe.com');
  assert.equal(diagnostic.checkoutUrlPathPrefix, '/c/pay/cs_live_1234567890abcdef');
  assert.equal(diagnostic.isStripeCheckoutUrl, true);
  assert.equal(diagnostic.alreadyPaid, undefined);
  assert.equal(diagnostic.error, undefined);

  const badUrlDiagnostic = buildDeflectionCheckoutDiagnostic({
    phase: 'checkout_response',
    requestId: 'req',
    attemptId: 'attempt',
    elapsedMs: -10,
    responseOk: false,
    responseStatus: 500,
    error: 'x'.repeat(140),
    url: 'not a url',
  });
  assert.equal(badUrlDiagnostic.elapsedMs, 0);
  assert.equal(badUrlDiagnostic.hasUrl, true);
  assert.equal(badUrlDiagnostic.isStripeCheckoutUrl, false);
  assert.equal(badUrlDiagnostic.error.length, 120);

  const storage = new Map();
  const logs = [];
  globalThis.window = {
    sessionStorage: {
      setItem(key, value) {
        storage.set(key, value);
      },
    },
  };
  const originalInfo = console.info;
  console.info = (...args) => logs.push(args);
  try {
    recordDeflectionCheckoutDiagnostic(diagnostic);
  } finally {
    console.info = originalInfo;
    delete globalThis.window;
  }

  assert.equal(logs.length, 1);
  assert.equal(logs[0][0], 'deflection_checkout:checkout_redirect');
  assert.deepEqual(JSON.parse(storage.get(DEFLECTION_CHECKOUT_DIAGNOSTIC_KEY)), {
    source: 'deflection_checkout',
    phase: 'checkout_redirect',
    requestIdTail: 'abc12345',
    attemptIdTail: '12345678',
    elapsedMs: 12,
    responseOk: true,
    responseStatus: 200,
    hasUrl: true,
    checkoutUrlOrigin: 'https://checkout.stripe.com',
    checkoutUrlHost: 'checkout.stripe.com',
    checkoutUrlPathPrefix: '/c/pay/cs_live_1234567890abcdef',
    isStripeCheckoutUrl: true,
  });

  console.log('Deflection checkout diagnostics tests passed.');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
