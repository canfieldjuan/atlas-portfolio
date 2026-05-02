import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), '.next');
const source = join(distDir, 'routes-manifest.json');
const target = join(distDir, 'routes-manifest-deterministic.json');

if (!existsSync(source)) {
  throw new Error(`Expected Next routes manifest at ${source}`);
}

copyFileSync(source, target);
console.log('Copied routes-manifest.json to routes-manifest-deterministic.json for Vercel packaging.');
