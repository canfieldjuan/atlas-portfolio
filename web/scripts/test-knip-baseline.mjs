import assert from 'node:assert/strict';
import {
  diffFindings,
  formatDrift,
  normalizeBaseline,
  normalizeKnipReport,
} from './check-knip-baseline.mjs';

const baselineJson = {
  version: 1,
  tool: 'knip',
  issues: [
    { type: 'files', file: 'src/unused.ts', name: 'src/unused.ts' },
    { type: 'exports', file: 'src/module.ts', name: 'oldExport' },
  ],
};

const currentReport = {
  issues: [
    {
      file: 'src/module.ts',
      exports: [{ name: 'oldExport', line: 10, col: 1 }],
      files: [],
      types: [],
    },
    {
      file: 'src/unused.ts',
      files: [{ name: 'src/unused.ts' }],
      exports: [],
      types: [],
    },
  ],
};

{
  const diff = diffFindings(normalizeBaseline(baselineJson), normalizeKnipReport(currentReport));
  assert.deepEqual(diff.added, []);
  assert.deepEqual(diff.removed, []);
}

{
  const current = normalizeKnipReport({
    issues: [
      ...currentReport.issues,
      {
        file: 'src/new.ts',
        files: [{ name: 'src/new.ts' }],
        exports: [],
        types: [],
      },
    ],
  });
  const diff = diffFindings(normalizeBaseline(baselineJson), current);
  assert.equal(diff.added.length, 1);
  assert.equal(diff.added[0].file, 'src/new.ts');
  assert.match(formatDrift(diff), /New Knip findings not in baseline/);
}

{
  const current = normalizeKnipReport({
    issues: [currentReport.issues[0]],
  });
  const diff = diffFindings(normalizeBaseline(baselineJson), current);
  assert.equal(diff.removed.length, 1);
  assert.equal(diff.removed[0].file, 'src/unused.ts');
  assert.match(formatDrift(diff), /Baseline findings resolved or renamed/);
}

assert.throws(() => normalizeBaseline({ version: 1, tool: 'knip' }), /issues array/);
assert.throws(() => normalizeBaseline({ version: 1, tool: 'other', issues: [] }), /tool "knip"/);
assert.throws(() => normalizeKnipReport({ issues: [{ file: 'src/bad.ts', exports: {} }] }), /must be an array/);
assert.throws(
  () => normalizeKnipReport({ issues: [{ file: 'src/bad.ts', exports: [{ line: 1 }] }] }),
  /object with name/,
);

console.log('Knip baseline checker tests passed.');
