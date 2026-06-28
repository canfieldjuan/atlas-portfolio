import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const webRoot = join(scriptsDir, '..');
const sourceRoot = join(webRoot, 'src');
const testDir = await mkdtemp(join(tmpdir(), 'atlas-json-ld-escaping-'));
const helperSourcePath = join(sourceRoot, 'lib', 'json-ld.ts');
const compiledHelperPath = join(testDir, 'json-ld.cjs');

const jsonLdFiles = [
  'app/layout.tsx',
  'app/ai-automation-consultant/page.tsx',
  'app/resources/[slug]/page.tsx',
  'app/resources/layout.tsx',
  'app/services/page.tsx',
  'app/systems/ai-content-ops/layout.tsx',
  'app/systems/ai-content-ops/ongoing-support/layout.tsx',
  'app/systems/ai-content-ops/ongoing-support/page.tsx',
  'app/systems/atlas-llm-gateway/layout.tsx',
  'app/systems/atlas-llm-gateway/page.tsx',
  'app/systems/layout.tsx',
  'app/systems/support-ticket-deflection/calculator/layout.tsx',
  'app/systems/support-ticket-deflection/demo/layout.tsx',
  'app/systems/support-ticket-deflection/layout.tsx',
  'app/systems/support-ticket-deflection/playbook/layout.tsx',
  'app/systems/support-ticket-deflection/support-tax/layout.tsx',
  'components/landing/DeflectionLandingPage.tsx',
  'components/landing/DiagnosticReportLandingPage.tsx',
];

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
  const { jsonLdScriptPayload } = require(compiledHelperPath);
  const payload = jsonLdScriptPayload({
    '@context': 'https://schema.org',
    name: 'Safe </script><script>alert("x")</script>',
  });

  assert.equal(payload.includes('<'), false, 'JSON-LD payload must not contain raw < characters');
  assert.equal(payload.includes('</script>'), false, 'JSON-LD payload must not contain a raw closing script tag');
  assert.equal(
    payload.includes('\\u003c/script>'),
    true,
    'JSON-LD payload should escape the closing script tag opener',
  );
  assert.deepEqual(JSON.parse(payload), {
    '@context': 'https://schema.org',
    name: 'Safe </script><script>alert("x")</script>',
  });

  for (const relativePath of jsonLdFiles) {
    const filePath = join(sourceRoot, relativePath);
    const source = await readFile(filePath, 'utf8');
    const blocks = source.match(/<script[\s\S]*?type="application\/ld\+json"[\s\S]*?\/>/g) || [];

    assert.ok(blocks.length > 0, `${relativePath} should contain a JSON-LD script block`);
    assert.ok(
      source.includes("from '@/lib/json-ld'") || source.includes('from "@/lib/json-ld"'),
      `${relativePath} should import the shared JSON-LD helper`,
    );

    for (const block of blocks) {
      assert.equal(
        block.includes('JSON.stringify'),
        false,
        `${relativePath} JSON-LD block should not use bare JSON.stringify`,
      );
      assert.ok(
        block.includes('jsonLdScriptPayload('),
        `${relativePath} JSON-LD block should use jsonLdScriptPayload`,
      );
    }
  }

  console.log('JSON-LD escaping tests passed.');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
