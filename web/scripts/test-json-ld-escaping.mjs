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
const testDir = await mkdtemp(join(tmpdir(), 'atlas-json-ld-escaping-'));
const helperSourcePath = join(sourceRoot, 'lib', 'json-ld.ts');
const compiledHelperPath = join(testDir, 'json-ld.cjs');

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

function jsxTagName(node) {
  if (ts.isIdentifier(node)) return node.text;
  return node.getText();
}

function jsxAttribute(node, name) {
  return node.attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.text === name,
  );
}

function evaluateStringExpression(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isJsxExpression(node) && node.expression) {
    return evaluateStringExpression(node.expression);
  }
  if (ts.isParenthesizedExpression(node)) {
    return evaluateStringExpression(node.expression);
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = evaluateStringExpression(node.left);
    const right = evaluateStringExpression(node.right);
    if (left !== undefined && right !== undefined) return `${left}${right}`;
  }
  return undefined;
}

function isJsonLdScript(openingElement) {
  if (jsxTagName(openingElement.tagName) !== 'script') return false;
  const typeAttribute = jsxAttribute(openingElement, 'type');
  return evaluateStringExpression(typeAttribute?.initializer) === 'application/ld+json';
}

function collectJsonLdScriptBlocks(sourceFile) {
  const blocks = [];

  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && isJsonLdScript(node)) {
      blocks.push(node);
      return;
    }
    if (ts.isJsxElement(node) && isJsonLdScript(node.openingElement)) {
      blocks.push(node);
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return blocks;
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

  const syntheticSource = ts.createSourceFile(
    'json-ld-sink-forms.tsx',
    [
      'export function SinkForms() {',
      '  return <>',
      '    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptPayload(one) }} />',
      "    <script type={'application/ld+json'} dangerouslySetInnerHTML={{ __html: jsonLdScriptPayload(two) }} />",
      "    <script type={'application/' + 'ld+json'} dangerouslySetInnerHTML={{ __html: jsonLdScriptPayload(three) }} />",
      '    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptPayload(four) }}></script>',
      '  </>;',
      '}',
      '',
    ].join('\n'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  assert.equal(
    collectJsonLdScriptBlocks(syntheticSource).length,
    4,
    'JSON-LD scan should discover self-closing, paired, and expression type forms',
  );

  const sourceFiles = await collectSourceFiles(sourceRoot);
  const discoveredJsonLdFiles = new Set();
  let discoveredJsonLdBlockCount = 0;

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const blocks = collectJsonLdScriptBlocks(sourceFile);
    if (blocks.length === 0) continue;

    const relativePath = relative(sourceRoot, filePath);
    discoveredJsonLdFiles.add(relativePath);
    discoveredJsonLdBlockCount += blocks.length;
    assert.ok(
      source.includes("from '@/lib/json-ld'") || source.includes('from "@/lib/json-ld"'),
      `${relativePath} should import the shared JSON-LD helper`,
    );

    for (const block of blocks) {
      const blockText = block.getText(sourceFile);
      assert.equal(
        blockText.includes('JSON.stringify'),
        false,
        `${relativePath} JSON-LD block should not use bare JSON.stringify`,
      );
      assert.ok(
        blockText.includes('jsonLdScriptPayload('),
        `${relativePath} JSON-LD block should use jsonLdScriptPayload`,
      );
    }
  }

  assert.ok(discoveredJsonLdFiles.size >= 18, 'expected to discover at least the current 18 JSON-LD files');
  assert.ok(discoveredJsonLdBlockCount >= 20, 'expected to discover at least the current 20 JSON-LD script blocks');

  console.log('JSON-LD escaping tests passed.');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
