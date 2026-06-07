import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const auditScript = join(scriptsDir, 'audit-test-enrollment.mjs');
const tempDir = mkdtempSync(join(tmpdir(), 'atlas-test-enrollment-'));

function writeFixture(name, contents) {
  const filePath = join(tempDir, name);
  writeFileSync(filePath, contents, 'utf8');
  return filePath;
}

function writePackage(name, scripts) {
  return writeFixture(
    name,
    `${JSON.stringify({ private: true, scripts }, null, 2)}\n`,
  );
}

function writeWorkflow(name, steps) {
  return writeFixture(
    name,
    [
      'name: Pre-push Audit',
      'jobs:',
      '  pre-push-audit:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      ...steps.map((step) => `      ${step}`),
      '',
    ].join('\n'),
  );
}

function runAudit(packageJsonPath, workflowPath) {
  return spawnSync(process.execPath, [
    auditScript,
    '--package-json',
    packageJsonPath,
    '--workflow',
    workflowPath,
  ], {
    encoding: 'utf8',
  });
}

function assertIncludes(output, expected) {
  assert.ok(
    output.includes(expected),
    `Expected output to include ${JSON.stringify(expected)}\nActual output:\n${output}`,
  );
}

function testEnrolledScriptsPass() {
  const packageJsonPath = writePackage('pass-package.json', {
    'smoke:manual-live': 'node manual-live.mjs',
    'test:alpha': 'node alpha.mjs',
    'test:beta': 'node beta.mjs',
  });
  const workflowPath = writeWorkflow('pass-workflow.yml', [
    '- run: npm --prefix web run test:beta',
    '- run: npm --prefix web run smoke:manual-live',
    '- run: npm --prefix web run test:alpha',
  ]);

  const result = runAudit(packageJsonPath, workflowPath);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assertIncludes(result.stdout, 'All 2 test:* scripts are enrolled');
}

function testMissingTestScriptFails() {
  const packageJsonPath = writePackage('missing-package.json', {
    'test:alpha': 'node alpha.mjs',
    'test:beta': 'node beta.mjs',
  });
  const workflowPath = writeWorkflow('missing-workflow.yml', [
    '- run: npm --prefix web run test:alpha',
  ]);

  const result = runAudit(packageJsonPath, workflowPath);
  assert.equal(result.status, 1, 'missing test enrollment should fail');
  assertIncludes(result.stderr, 'Missing CI enrollment for test:* scripts:');
  assertIncludes(result.stderr, '- test:beta');
}

function testCommentedCommandsDoNotEnroll() {
  const packageJsonPath = writePackage('comment-package.json', {
    'test:alpha': 'node alpha.mjs',
    'test:beta': 'node beta.mjs',
  });
  const workflowPath = writeWorkflow('comment-workflow.yml', [
    '- run: npm --prefix web run test:alpha',
    '# - run: npm --prefix web run test:beta',
    '- run: echo ok # npm --prefix web run test:beta',
  ]);

  const result = runAudit(packageJsonPath, workflowPath);
  assert.equal(result.status, 1, 'commented workflow commands should not enroll tests');
  assertIncludes(result.stderr, '- test:beta');
}

function testNonTestScriptsAreOutOfScope() {
  const packageJsonPath = writePackage('smoke-package.json', {
    'smoke:manual-live': 'node manual-live.mjs',
    'test:alpha': 'node alpha.mjs',
  });
  const workflowPath = writeWorkflow('smoke-workflow.yml', [
    '- run: npm --prefix web run test:alpha',
  ]);

  const result = runAudit(packageJsonPath, workflowPath);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assertIncludes(result.stdout, 'All 1 test:* scripts are enrolled');
}

try {
  testEnrolledScriptsPass();
  testMissingTestScriptFails();
  testCommentedCommandsDoNotEnroll();
  testNonTestScriptsAreOutOfScope();
  console.log('Test enrollment audit tests passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
