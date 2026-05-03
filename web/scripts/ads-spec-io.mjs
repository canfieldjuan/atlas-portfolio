import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const repoRoot = join(__dirname, '..');
export const specDir = join(repoRoot, 'ads', 'content-workflow-audit');

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function readCsv(path) {
  const text = await readFile(path, 'utf8');
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((item) => item.trim());
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split(',').map((item) => item.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    });
}

export async function loadCampaignSpec() {
  const campaign = await readJson(join(specDir, 'campaign.json'));
  const adGroups = [];

  if (Array.isArray(campaign.adGroups)) {
    for (const adGroup of campaign.adGroups) {
      adGroups.push({
        adGroup,
        keywords: adGroup?.keywordFile ? await readCsv(join(specDir, adGroup.keywordFile)) : undefined,
        negatives: adGroup?.negativeKeywordFile
          ? await readCsv(join(specDir, adGroup.negativeKeywordFile))
          : undefined,
        rsaAssets: adGroup?.responsiveSearchAdFile
          ? await readJson(join(specDir, adGroup.responsiveSearchAdFile))
          : undefined,
      });
    }
  }

  return { campaign, adGroups };
}
