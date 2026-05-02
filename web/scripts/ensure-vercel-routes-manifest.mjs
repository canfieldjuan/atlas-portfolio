import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';

const distDir = join(process.cwd(), '.next');
const source = join(distDir, 'routes-manifest.json');
const target = join(distDir, 'routes-manifest-deterministic.json');

if (!existsSync(source)) {
  throw new Error(`Expected Next routes manifest at ${source}`);
}

function copyManifest(path) {
  mkdirSync(dirname(path), { recursive: true });
  copyFileSync(source, path);
  console.log(`Copied routes-manifest.json to ${path}`);
}

copyManifest(target);

// Vercel's cloud postprocessor currently looks for Next build artifacts from
// the Git checkout root (/vercel/path0), even when the project root is web/.
if (process.env.VERCEL === '1' || process.cwd().startsWith('/vercel/')) {
  const checkoutDistDir = join(process.cwd(), '..', '.next');
  const appNodeModules = join(process.cwd(), 'node_modules');
  const checkoutNodeModules = join(process.cwd(), '..', 'node_modules');

  rmSync(checkoutDistDir, { recursive: true, force: true });
  cpSync(distDir, checkoutDistDir, { recursive: true, force: true });
  console.log(`Mirrored ${distDir} to ${checkoutDistDir} for Vercel packaging.`);

  if (!existsSync(appNodeModules)) {
    throw new Error(`Expected dependencies at ${appNodeModules}`);
  }

  if (!existsSync(checkoutNodeModules)) {
    symlinkSync(appNodeModules, checkoutNodeModules, 'dir');
    console.log(`Linked ${checkoutNodeModules} to ${appNodeModules} for Vercel trace packaging.`);
  }
}
