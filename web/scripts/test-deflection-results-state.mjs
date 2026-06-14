import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-results-state-'));
const sourceUrl = new URL('../src/lib/deflection-results-state.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-results-state.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const demoSnapshot = {
  summary: {
    generated: 1,
    drafted_answer_count: 1,
    no_proven_answer_count: 0,
    repeat_ticket_count: 12,
  },
  top_questions: [],
  locked_questions: [],
  teaser: { full_answer: null, previews: [] },
};
const atlasSnapshot = {
  summary: {
    generated: 2,
    drafted_answer_count: 1,
    no_proven_answer_count: 1,
    repeat_ticket_count: 24,
  },
  top_questions: [],
  locked_questions: [],
  teaser: { full_answer: null, previews: [] },
};

try {
  await mkdir(libStubDir, { recursive: true });
  await writeFile(
    join(libStubDir, 'deflection-snapshot.js'),
    `exports.DEMO_DEFLECTION_SNAPSHOT = ${JSON.stringify(demoSnapshot)};\n`,
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
  const { resolveDeflectionSnapshotRouteState } = require(compiledPath);

  assert.deepEqual(
    resolveDeflectionSnapshotRouteState({ ok: true, snapshot: atlasSnapshot }, 'production'),
    { kind: 'snapshot', snapshot: atlasSnapshot, source: 'atlas' },
  );

  assert.deepEqual(
    resolveDeflectionSnapshotRouteState({ ok: false, reason: 'not_found' }, 'production'),
    { kind: 'not_found' },
  );

  assert.deepEqual(
    resolveDeflectionSnapshotRouteState({ ok: false, reason: 'not_configured' }, 'development'),
    { kind: 'snapshot', snapshot: demoSnapshot, source: 'demo' },
  );

  assert.deepEqual(
    resolveDeflectionSnapshotRouteState({ ok: false, reason: 'not_configured' }, 'test'),
    { kind: 'snapshot', snapshot: demoSnapshot, source: 'demo' },
  );

  assert.deepEqual(
    resolveDeflectionSnapshotRouteState({ ok: false, reason: 'not_configured' }, 'production'),
    { kind: 'unavailable', reason: 'not_configured' },
  );

  assert.deepEqual(
    resolveDeflectionSnapshotRouteState({ ok: false, reason: 'error' }, 'production'),
    { kind: 'unavailable', reason: 'error' },
  );
} finally {
  await rm(testDir, { recursive: true, force: true });
}

console.log('Deflection results state tests passed.');
