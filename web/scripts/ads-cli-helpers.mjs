import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { repoRoot } from './ads-spec-io.mjs';

export function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('-')) {
      continue;
    }

    const [name, inlineValue] = item.split('=', 2);
    if (inlineValue !== undefined) {
      values.set(name, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('-')) {
      values.set(name, next);
      index += 1;
      continue;
    }

    flags.add(name);
  }

  return { values, flags };
}

export function resolveRepoPath(path) {
  return isAbsolute(path) ? path : resolve(repoRoot, path);
}

export async function readJsonArtifact(path) {
  const resolvedPath = resolveRepoPath(path);
  const payload = JSON.parse(await readFile(resolvedPath, 'utf8'));
  return { payload, resolvedPath };
}

export async function writeJsonArtifact(outputPath, payload, options = {}) {
  const resolvedPath = resolveRepoPath(outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  const artifactPayload = options.includeOutputPath === false ? payload : { ...payload, outputPath: resolvedPath };
  await writeFile(resolvedPath, `${JSON.stringify(artifactPayload, null, 2)}\n`, 'utf8');
  return resolvedPath;
}

export function failCommand(message, outputJson, details = {}, options = {}) {
  const sanitize = options.sanitize || ((value) => String(value || 'Unknown error.'));
  const safeMessage = sanitize(message);
  if (outputJson) {
    console.log(JSON.stringify({ ok: false, error: safeMessage, ...details }, null, 2));
  } else {
    console.error(safeMessage);
    if (details.missing?.length) {
      for (const name of details.missing) {
        console.error(`- ${name}`);
      }
    }
    if (details.errors?.length) {
      for (const error of details.errors) {
        console.error(`- ${error}`);
      }
    }
  }
  process.exit(1);
}
