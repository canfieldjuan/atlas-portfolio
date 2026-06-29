#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./audit-real-adapter-tests.mjs', import.meta.url));

async function withFixture(name, callback) {
  const root = await mkdtemp(path.join(tmpdir(), `real-adapter-audit-${name}-`));
  const webRoot = path.join(root, 'web');
  await mkdir(path.join(webRoot, 'src', 'lib'), { recursive: true });
  await mkdir(path.join(webRoot, 'scripts'), { recursive: true });
  await writeFile(
    path.join(webRoot, 'src', 'lib', 'real-module.ts'),
    'export const realValue = 1;\n',
    'utf8',
  );

  try {
    await callback(webRoot);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function runAudit(webRoot) {
  return spawnSync(process.execPath, [scriptPath, '--web-root', webRoot], {
    encoding: 'utf8',
  });
}

async function testCleanExternalMockPasses() {
  await withFixture('clean', async (webRoot) => {
    await writeFile(
      path.join(webRoot, 'src', 'lib', 'clean.test.ts'),
      [
        "import { describe, expect, it, vi } from 'vitest';",
        "import { realValue } from '@/lib/real-module';",
        "vi.mock('@vercel/blob', () => ({ put: vi.fn() }));",
        "describe('clean', () => {",
        "  it('uses the real local module', () => expect(realValue).toBe(1));",
        '});',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runAudit(webRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Real adapter test audit passed/);
  });
}

async function testLocalMockFails() {
  await withFixture('local-mock', async (webRoot) => {
    await writeFile(
      path.join(webRoot, 'src', 'lib', 'local-mock.test.ts'),
      [
        "import { vi } from 'vitest';",
        "vi." + "mock('" + "@/" + "lib/real-module', () => ({ realValue: 2 }));",
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runAudit(webRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /local-module-mock/);
    assert.match(result.stderr, /@\/lib\/real-module/);
  });
}

async function testTranspileShimFails() {
  await withFixture('transpile', async (webRoot) => {
    await writeFile(
      path.join(webRoot, 'src', 'lib', 'transpile.test.ts'),
      [
        "import ts from 'typescript';",
        "ts." + "transpileModule('export const fake = 1', { compilerOptions: {} });",
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runAudit(webRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /typescript-transpile-shim/);
  });
}

async function testFabricatedNodeModulesAliasFails() {
  await withFixture('fabricated-stub', async (webRoot) => {
    await writeFile(
      path.join(webRoot, 'scripts', 'fabricated-stub.mjs'),
      [
        "import { writeFile } from 'node:fs/promises';",
        "await writeFile('/tmp/node_modules/@/lib/real-module.js', 'export const realValue = 2');",
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runAudit(webRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /fabricated-local-module-stub/);
    assert.match(result.stderr, /@\/lib\/real-module/);
  });
}

async function testAllowlistReportsException() {
  await withFixture('allowlist', async (webRoot) => {
    await writeFile(
      path.join(webRoot, 'src', 'lib', 'allowlist.test.ts'),
      [
        "import { vi } from 'vitest';",
        '// real-adapter-audit-allow: legacy fixture until adapter seam lands',
        "vi." + "mock('" + "@/" + "lib/real-module', () => ({ realValue: 2 }));",
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runAudit(webRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Allowlisted real-adapter audit exceptions/);
    assert.match(result.stdout, /legacy fixture until adapter/);
  });
}

const tests = [
  testCleanExternalMockPasses,
  testLocalMockFails,
  testTranspileShimFails,
  testFabricatedNodeModulesAliasFails,
  testAllowlistReportsException,
];

for (const test of tests) {
  await test();
  console.log(`PASS ${test.name}`);
}
