import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { repoRoot } from './ads-spec-io.mjs';

export function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();
  const positional = [];
  let endOfOptions = false;

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];

    // `--` is the conventional end-of-options marker. Tokens after it land in
    // `positional` even if they start with a dash, so they no longer get
    // parsed as flags. This does NOT change how option values are consumed:
    // dash-prefixed values still require the inline `--name=value` form
    // (the value-lookahead step rejects tokens that start with `-`). The
    // marker itself is also never consumed as a preceding option's value.
    if (item === '--') {
      endOfOptions = true;
      continue;
    }
    if (endOfOptions || !item.startsWith('-')) {
      positional.push(item);
      continue;
    }

    const [name, inlineValue] = item.split('=', 2);
    if (inlineValue !== undefined) {
      values.set(name, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && next !== '--' && !next.startsWith('-')) {
      values.set(name, next);
      index += 1;
      continue;
    }

    flags.add(name);
  }

  return { values, flags, positional };
}

// Returns true when `--name` was passed without a meaningful value — either as
// a bare flag (`--name` followed by another flag or end of args) or as the
// empty-equals form (`--name=`). Centralizes the predicate that --output,
// --campaign-id, and --funnel-report each had inline; call sites use it with
// their own fail() helper so script-specific hint text is preserved.
//
// Returns false when the flag wasn't passed at all, or when it has a non-empty
// value.
export function isBareFlag(parsed, name) {
  const { values, flags } = parsed;
  if (flags.has(name)) {
    return true;
  }
  if (!values.has(name)) {
    return false;
  }
  const raw = values.get(name);
  if (raw === undefined || raw === '') {
    return true;
  }
  return typeof raw === 'string' && raw.trim() === '';
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
