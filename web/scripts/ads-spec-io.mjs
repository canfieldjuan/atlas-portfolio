import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const repoRoot = join(__dirname, '..');
export const specDir = join(repoRoot, 'ads', 'content-workflow-audit');

function resolveSpecFile(fileName) {
  if (typeof fileName !== 'string' || !fileName.trim()) {
    throw new Error('Spec file name must be a non-empty string.');
  }

  const resolvedPath = resolve(specDir, fileName);
  const relativePath = relative(specDir, resolvedPath);

  if (relativePath.startsWith('..') || relativePath === '' || relativePath.startsWith('/') || relativePath.includes('\\')) {
    throw new Error(`Spec file path must stay inside ${specDir}: ${fileName}`);
  }

  return resolvedPath;
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function readCsv(path) {
  const text = await readFile(path, 'utf8');
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine).map((item) => item.trim());
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = parseCsvLine(line).map((item) => item.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    });
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  if (inQuotes) {
    throw new Error(`Unclosed CSV quote in line: ${line}`);
  }

  values.push(value);
  return values;
}

export async function loadCampaignSpec() {
  const campaign = await readJson(resolveSpecFile('campaign.json'));
  const adGroups = [];

  if (Array.isArray(campaign.adGroups)) {
    for (const adGroup of campaign.adGroups) {
      adGroups.push({
        adGroup,
        keywords: adGroup?.keywordFile ? await readCsv(resolveSpecFile(adGroup.keywordFile)) : undefined,
        negatives: adGroup?.negativeKeywordFile
          ? await readCsv(resolveSpecFile(adGroup.negativeKeywordFile))
          : undefined,
        rsaAssets: adGroup?.responsiveSearchAdFile
          ? await readJson(resolveSpecFile(adGroup.responsiveSearchAdFile))
          : undefined,
      });
    }
  }

  return { campaign, adGroups };
}
