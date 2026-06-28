import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { jsonLdScriptPayload } from '@/lib/json-ld';

const sourceRoot = join(process.cwd(), 'src');

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

function jsxTagName(node: ts.JsxTagNameExpression) {
  if (ts.isIdentifier(node)) return node.text;
  return node.getText();
}

function jsxAttribute(
  node: ts.JsxOpeningLikeElement,
  name: string,
): ts.JsxAttribute | undefined {
  return node.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.text === name,
  );
}

function evaluateStringExpression(node: ts.Node | undefined): string | undefined {
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

function isJsonLdScript(openingElement: ts.JsxOpeningLikeElement) {
  if (jsxTagName(openingElement.tagName) !== 'script') return false;
  const typeAttribute = jsxAttribute(openingElement, 'type');
  return evaluateStringExpression(typeAttribute?.initializer) === 'application/ld+json';
}

function collectJsonLdScriptBlocks(sourceFile: ts.SourceFile) {
  const blocks: Array<ts.JsxSelfClosingElement | ts.JsxElement> = [];

  function visit(node: ts.Node) {
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

describe('JSON-LD script payloads', () => {
  it('escapes script terminators while preserving the parsed value', () => {
    const payload = jsonLdScriptPayload({
      '@context': 'https://schema.org',
      name: 'Safe </script><script>alert("x")</script>',
    });

    expect(payload).not.toContain('<');
    expect(payload).not.toContain('</script>');
    expect(payload).toContain('\\u003c/script>');
    expect(JSON.parse(payload)).toEqual({
      '@context': 'https://schema.org',
      name: 'Safe </script><script>alert("x")</script>',
    });
  });

  it('discovers JSON-LD script sink forms', () => {
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

    expect(collectJsonLdScriptBlocks(syntheticSource)).toHaveLength(4);
  });

  it('routes repo JSON-LD script sinks through the shared helper', async () => {
    const sourceFiles = await collectSourceFiles(sourceRoot);
    const discoveredJsonLdFiles = new Set<string>();
    let discoveredJsonLdBlockCount = 0;

    for (const filePath of sourceFiles) {
      const source = await readFile(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const blocks = collectJsonLdScriptBlocks(sourceFile);
      if (blocks.length === 0) continue;

      const relativePath = relative(sourceRoot, filePath);
      discoveredJsonLdFiles.add(relativePath);
      discoveredJsonLdBlockCount += blocks.length;
      expect(
        source.includes("from '@/lib/json-ld'") ||
          source.includes('from "@/lib/json-ld"'),
        `${relativePath} should import the shared JSON-LD helper`,
      ).toBe(true);

      for (const block of blocks) {
        const blockText = block.getText(sourceFile);
        expect(
          blockText.includes('JSON.stringify'),
          `${relativePath} JSON-LD block should not use bare JSON.stringify`,
        ).toBe(false);
        expect(
          blockText.includes('jsonLdScriptPayload('),
          `${relativePath} JSON-LD block should use jsonLdScriptPayload`,
        ).toBe(true);
      }
    }

    expect(discoveredJsonLdFiles.size).toBeGreaterThanOrEqual(18);
    expect(discoveredJsonLdBlockCount).toBeGreaterThanOrEqual(20);
  });
});
