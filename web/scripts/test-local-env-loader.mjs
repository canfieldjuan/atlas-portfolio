import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadLocalEnv } from './local-env.mjs';

const testDir = join(tmpdir(), `atlas-local-env-${process.pid}`);
const envFile = join(testDir, '.env.test');

async function main() {
  const preservedKey = 'ATLAS_ENV_LOADER_PRESERVED';
  const quotedKey = 'ATLAS_ENV_LOADER_QUOTED';
  const plainKey = 'ATLAS_ENV_LOADER_PLAIN';

  process.env[preservedKey] = 'already-set';
  delete process.env[quotedKey];
  delete process.env[plainKey];

  await mkdir(testDir, { recursive: true });
  await writeFile(
    envFile,
    [
      '# ignored comment',
      `${preservedKey}=from-file`,
      `${quotedKey}="quoted value"`,
      `${plainKey}=plain-value`,
      'INVALID-KEY=ignored',
      '',
    ].join('\n'),
  );

  try {
    const loaded = await loadLocalEnv([envFile]);

    assert(loaded.length === 1 && loaded[0] === envFile, 'expected env file to be loaded');
    assert(process.env[preservedKey] === 'already-set', 'existing shell env must not be overwritten');
    assert(process.env[quotedKey] === 'quoted value', 'quoted env value should be unwrapped');
    assert(process.env[plainKey] === 'plain-value', 'plain env value should load');
    assert(process.env['INVALID-KEY'] === undefined, 'invalid env key should be ignored');

    console.log('Local env loader test passed.');
  } finally {
    await rm(testDir, { recursive: true, force: true });
    delete process.env[preservedKey];
    delete process.env[quotedKey];
    delete process.env[plainKey];
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
