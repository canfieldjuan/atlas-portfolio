import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-legacy-redirect-'));
const sourceUrl = new URL('../next.config.ts', import.meta.url);
const compiledPath = join(testDir, 'next.config.cjs');

try {
  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  await mkdir(testDir, { recursive: true });
  await writeFile(compiledPath, compiled.outputText);

  const require = createRequire(compiledPath);
  const config = require(compiledPath).default;
  assert.equal(typeof config.redirects, 'function');

  const redirects = await config.redirects();
  assert.ok(Array.isArray(redirects));

  const legacyResultsRedirect = redirects.find(
    (redirect) => redirect.source === '/services/faq-deflection/results/:requestId',
  );
  assert.deepEqual(legacyResultsRedirect, {
    source: '/services/faq-deflection/results/:requestId',
    destination: '/systems/support-ticket-deflection/results/:requestId',
    permanent: true,
  });

  const duplicateLegacyResultsRedirects = redirects.filter(
    (redirect) => redirect.source === '/services/faq-deflection/results/:requestId',
  );
  assert.equal(duplicateLegacyResultsRedirects.length, 1);

  assert.equal(
    redirects.some(
      (redirect) =>
        redirect.destination === '/systems/support-ticket-deflection/results/:requestId' &&
        redirect.source !== '/services/faq-deflection/results/:requestId',
    ),
    false,
  );
} finally {
  await rm(testDir, { recursive: true, force: true });
}

console.log('Deflection legacy results redirect tests passed.');
