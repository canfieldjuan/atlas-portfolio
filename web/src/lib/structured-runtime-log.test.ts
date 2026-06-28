import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { structuredRuntimeError } from '@/lib/structured-runtime-log';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceRoot = join(webRoot, 'src');
const helperRelativePath = join('lib', 'structured-runtime-log.ts');

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

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

async function rawConsoleErrorViolations() {
  const sourceFiles = await collectSourceFiles(sourceRoot);
  const violations: string[] = [];

  for (const filePath of sourceFiles) {
    const relativePath = relative(sourceRoot, filePath);
    const source = await readFile(filePath, 'utf8');
    if (relativePath === helperRelativePath) {
      expect(source).toMatch(/\bconsole\s*\.\s*error\s*\(/);
      continue;
    }
    const matchCount = source.match(/\bconsole\s*\.\s*error\s*\(/g)?.length ?? 0;
    for (let index = 0; index < matchCount; index += 1) {
      violations.push(relativePath);
    }
  }

  return violations;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('structuredRuntimeError', () => {
  it('emits redacted structured JSON through console.error', () => {
    const calls: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((message) => {
      calls.push(String(message));
    });

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

    expect(calls).toHaveLength(1);
    const payload = JSON.parse(calls[0]) as Record<string, unknown>;
    expect(payload.level).toBe('error');
    expect(payload.event).toBe('unit.test_event');
    expect(payload.status).toBe(502);
    expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.error).toEqual({ name: 'Error' });
    expect(payload.token).toBe('[REDACTED]');
    expect(payload.nested).toEqual({
      apiKey: '[REDACTED]',
      ok: true,
    });
    expect(payload.values).toEqual([1, { name: 'Error' }]);
  });

  it('keeps structuredRuntimeError as the only raw console.error sink', async () => {
    await expect(rawConsoleErrorViolations()).resolves.toEqual([]);
  });
});
