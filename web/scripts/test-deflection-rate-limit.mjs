import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-rate-limit-'));
const sourceUrl = new URL('../src/lib/deflection-rate-limit.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-rate-limit.cjs');
const originalNow = Date.now;
let now = 1_700_000_000_000;

function testHeaders(value) {
  return new Headers(value ? { 'x-forwarded-for': value } : {});
}

function resetStore() {
  delete globalThis.__atlasDeflectionRateLimitStore;
}

try {
  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

  const require = createRequire(import.meta.url);
  const { consumeDeflectionRateLimit } = require(compiledPath);
  Date.now = () => now;

  resetStore();
  const tightConfig = { scope: 'unit', limit: 2, windowMs: 1_000 };
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: false, retryAfterSeconds: 1 },
  );
  now += 1_000;
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: true },
  );

  resetStore();
  const singleUseConfig = { scope: 'unit', limit: 1, windowMs: 60_000 };
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10, 198.51.100.4'), 'report-a', singleUseConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', singleUseConfig),
    { ok: false, retryAfterSeconds: 60 },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-b', singleUseConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('198.51.100.4'), 'report-a', singleUseConfig),
    { ok: true },
  );

  console.log('Deflection rate-limit tests passed.');
} finally {
  Date.now = originalNow;
  resetStore();
  await rm(testDir, { recursive: true, force: true });
}
