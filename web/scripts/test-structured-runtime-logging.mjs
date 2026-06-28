import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const webRoot = join(scriptsDir, '..');
const sourceRoot = join(webRoot, 'src');
const helperRelativePath = join('lib', 'structured-runtime-log.ts');
const helperSourcePath = join(sourceRoot, helperRelativePath);
const testDir = await mkdtemp(join(tmpdir(), 'atlas-structured-runtime-log-'));
const compiledHelperPath = join(testDir, 'structured-runtime-log.cjs');

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(entryPath));
      continue;
    }
    if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function assertNoRawConsoleErrorSinks() {
  const sourceFiles = await collectSourceFiles(sourceRoot);
  const violations = [];

  for (const filePath of sourceFiles) {
    const relativePath = relative(sourceRoot, filePath);
    const source = await readFile(filePath, 'utf8');
    if (relativePath === helperRelativePath) {
      assert.match(
        source,
        /\bconsole\s*\.\s*error\s*\(/,
        'structured runtime log helper should remain the only console.error sink',
      );
      continue;
    }
    const matchCount = source.match(/\bconsole\s*\.\s*error\s*\(/g)?.length ?? 0;
    for (let index = 0; index < matchCount; index += 1) {
      violations.push(relativePath);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `raw console.error sinks should use structuredRuntimeError: ${violations.join(', ')}`,
  );
}

try {
  const helperSource = await readFile(helperSourcePath, 'utf8');
  const compiledHelper = ts.transpileModule(helperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledHelperPath, compiledHelper.outputText);

  const require = createRequire(import.meta.url);
  const { structuredRuntimeError } = require(compiledHelperPath);
  const calls = [];
  const originalConsoleError = console.error;
  console.error = (message) => calls.push(message);
  try {
    structuredRuntimeError('unit.test_event', {
      status: 502,
      error: new Error('boom'),
      token: 'secret-token',
      nested: {
        apiKey: 'secret-key',
        ok: true,
        skipped: undefined,
      },
      values: [1, undefined, new Error('nested boom')],
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(calls.length, 1);
  const payload = JSON.parse(calls[0]);
  assert.equal(payload.level, 'error');
  assert.equal(payload.event, 'unit.test_event');
  assert.equal(payload.status, 502);
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(payload.error, { name: 'Error', message: 'boom' });
  assert.equal(payload.token, '[REDACTED]');
  assert.deepEqual(payload.nested, {
    apiKey: '[REDACTED]',
    ok: true,
  });
  assert.deepEqual(payload.values, [1, { name: 'Error', message: 'nested boom' }]);

  await assertNoRawConsoleErrorSinks();

  console.log('Structured runtime logging tests passed.');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
