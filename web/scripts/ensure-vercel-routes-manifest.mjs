import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
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

  rmSync(checkoutDistDir, { recursive: true, force: true });
  cpSync(distDir, checkoutDistDir, { recursive: true, force: true });
  console.log(`Mirrored ${distDir} to ${checkoutDistDir} for Vercel packaging.`);
}
