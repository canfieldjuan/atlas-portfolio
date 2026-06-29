#!/usr/bin/env node
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const INDEX_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function parseArgs(argv) {
  const scriptWebRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const options = { webRoot: scriptWebRoot };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--web-root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--web-root requires a path');
      }
      options.webRoot = path.resolve(value);
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function usage() {
  return `Usage: node scripts/audit-real-adapter-tests.mjs [--web-root web]\n\nBlocks tests that mock or fabricate local @/ modules instead of using real adapters.`;
}

function walkFiles(dir, predicate, output = []) {
  if (!existsSync(dir)) {
    return output;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, output);
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) {
      output.push(fullPath);
    }
  }

  return output;
}

function collectScannedFiles(webRoot) {
  const scriptFiles = existsSync(path.join(webRoot, 'scripts'))
    ? readdirSync(path.join(webRoot, 'scripts'), { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mjs'))
        .map((entry) => path.join(webRoot, 'scripts', entry.name))
    : [];
  const testFiles = walkFiles(
    path.join(webRoot, 'src'),
    (file) => /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file),
  );

  return [...scriptFiles, ...testFiles].sort();
}

function resolveAliasSpecifier(webRoot, specifier) {
  if (!specifier.startsWith('@/')) {
    return null;
  }

  const srcCandidate = path.join(webRoot, 'src', specifier.slice(2));
  for (const extension of EXTENSIONS) {
    const candidate = `${srcCandidate}${extension}`;
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  for (const extension of INDEX_EXTENSIONS) {
    const candidate = path.join(srcCandidate, `index${extension}`);
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function lineNumberForOffset(source, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (source.charCodeAt(index) === 10) {
      line += 1;
    }
  }
  return line;
}

function allowlistReason(lines, lineNumber) {
  const sameLine = lines[lineNumber - 1] || '';
  const previousLine = lines[lineNumber - 2] || '';
  const marker = /real-adapter-audit-allow:\s*(\S.*)$/;
  return sameLine.match(marker)?.[1] || previousLine.match(marker)?.[1] || null;
}

function recordFinding({ findings, allowlisted, file, line, code, message, specifier, source, webRoot }) {
  const lines = source.split(/\r?\n/);
  const reason = allowlistReason(lines, line);
  const displayFile = path.relative(process.cwd(), file);
  const resolved = specifier ? resolveAliasSpecifier(webRoot, specifier) : null;
  const entry = {
    file: displayFile,
    line,
    code,
    message,
    specifier,
    resolvesTo: resolved ? path.relative(process.cwd(), resolved) : null,
  };

  if (reason) {
    allowlisted.push({ ...entry, reason });
    return;
  }

  findings.push(entry);
}

function normalizeFabricatedAliasPath(rawPath) {
  const normalized = rawPath.replaceAll('\\\\', '/').replaceAll('\\', '/');
  const marker = 'node_modules/@/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const aliasPath = normalized
    .slice(markerIndex + marker.length)
    .replace(/\.(?:ts|tsx|js|jsx|mjs|cjs)$/, '')
    .replace(/\/index$/, '');

  if (!aliasPath || aliasPath.includes('..')) {
    return null;
  }

  return `@/${aliasPath}`;
}

function scanFile(file, webRoot) {
  const source = readFileSync(file, 'utf8');
  const findings = [];
  const allowlisted = [];

  for (const match of source.matchAll(/\b(?:vi\.|jest\.)?mock\s*\(\s*(['"])(@\/[^'"]+)\1/g)) {
    const specifier = match[2];
    if (!resolveAliasSpecifier(webRoot, specifier)) {
      continue;
    }

    recordFinding({
      findings,
      allowlisted,
      file,
      line: lineNumberForOffset(source, match.index),
      code: 'local-module-mock',
      message: 'Mock resolves to an existing web/src module; use the real adapter instead.',
      specifier,
      source,
      webRoot,
    });
  }

  for (const match of source.matchAll(/ts\.transpileModule\s*\(/g)) {
    recordFinding({
      findings,
      allowlisted,
      file,
      line: lineNumberForOffset(source, match.index),
      code: 'typescript-transpile-shim',
      message: 'Tests must not transpile source code manually; import the real module adapter.',
      source,
      webRoot,
    });
  }

  if (/\b(?:writeFile|writeFileSync|mkdtemp|mkdtempSync)\b/.test(source)) {
    for (const match of source.matchAll(/node_modules[\\/]+@[\\/]+([^'"`\s)]+)/g)) {
      const specifier = normalizeFabricatedAliasPath(match[0]);
      if (!specifier || !resolveAliasSpecifier(webRoot, specifier)) {
        continue;
      }

      recordFinding({
        findings,
        allowlisted,
        file,
        line: lineNumberForOffset(source, match.index),
        code: 'fabricated-local-module-stub',
        message: 'Test writes a temp node_modules/@/ stub for an existing web/src module.',
        specifier,
        source,
        webRoot,
      });
    }
  }

  return { findings, allowlisted };
}

export function auditRealAdapterTests({ webRoot }) {
  const scannedFiles = collectScannedFiles(webRoot);
  const findings = [];
  const allowlisted = [];

  for (const file of scannedFiles) {
    const result = scanFile(file, webRoot);
    findings.push(...result.findings);
    allowlisted.push(...result.allowlisted);
  }

  return { scannedFiles, findings, allowlisted };
}

function printResults(result) {
  if (result.allowlisted.length > 0) {
    console.log('Allowlisted real-adapter audit exceptions:');
    for (const item of result.allowlisted) {
      const target = item.specifier ? ` ${item.specifier}` : '';
      console.log(
        `- ${item.file}:${item.line} ${item.code}${target} (${item.reason})`,
      );
    }
  }

  if (result.findings.length === 0) {
    console.log(`Real adapter test audit passed: scanned ${result.scannedFiles.length} file(s).`);
    return;
  }

  console.error('Real adapter test audit violations:');
  for (const finding of result.findings) {
    const target = finding.specifier ? ` ${finding.specifier}` : '';
    const resolved = finding.resolvesTo ? ` -> ${finding.resolvesTo}` : '';
    console.error(
      `- ${finding.file}:${finding.line} ${finding.code}${target}${resolved}: ${finding.message}`,
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return 0;
  }

  const result = auditRealAdapterTests({ webRoot: options.webRoot });
  printResults(result);
  return result.findings.length === 0 ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    });
}
