import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { repoRoot } from './ads-spec-io.mjs';

const DEFAULT_ENV_FILES = ['.env.local', '.env'];

export async function loadLocalEnv(files = DEFAULT_ENV_FILES) {
  const loaded = [];

  for (const file of files) {
    const path = isAbsolute(file) ? file : join(repoRoot, file);
    let text;
    try {
      text = await readFile(path, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    for (const line of text.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed || process.env[parsed.key] !== undefined) {
        continue;
      }
      process.env[parsed.key] = parsed.value;
    }

    loaded.push(path);
  }

  return loaded;
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null;
  }

  const value = stripEnvQuotes(trimmed.slice(equalsIndex + 1).trim());
  return { key, value };
}

function stripEnvQuotes(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }

  return value;
}
