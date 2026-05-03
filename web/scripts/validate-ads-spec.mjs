import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const specDir = join(repoRoot, 'ads', 'content-workflow-audit');

const MAX_HEADLINE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 90;
const REQUIRED_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const ALLOWED_MATCH_TYPES = new Set(['exact', 'phrase']);
const REQUIRED_NEGATIVES = ['free', 'template', 'jobs', 'course', 'blog generator', 'essay'];

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readCsv(path) {
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

function fail(errors, message) {
  errors.push(message);
}

function validateCampaign(campaign, errors) {
  if (campaign.status !== 'PAUSED') {
    fail(errors, 'Campaign status must be PAUSED before API deployment.');
  }

  if (campaign.channel !== 'SEARCH') {
    fail(errors, 'First campaign must be SEARCH only.');
  }

  if (typeof campaign.dailyBudgetUsd !== 'number' || campaign.dailyBudgetUsd <= 0) {
    fail(errors, 'Campaign dailyBudgetUsd must be a positive number.');
  }

  if (campaign.dailyBudgetUsd > campaign.maxInitialDailyBudgetUsd) {
    fail(errors, 'Campaign dailyBudgetUsd exceeds maxInitialDailyBudgetUsd.');
  }

  if (campaign.maxInitialDailyBudgetUsd > 50) {
    fail(errors, 'Initial budget cap must stay at or below $50/day.');
  }

  if (!campaign.landingPage?.startsWith('https://juancanfield.com/')) {
    fail(errors, 'Landing page must use the juancanfield.com production domain.');
  }

  for (const key of ['source', 'medium', 'campaign', 'content']) {
    if (!campaign.utm?.[key]) {
      fail(errors, `Campaign UTM ${key} is required.`);
    }
  }

  if (campaign.conversionGoal !== 'audit_request_submitted') {
    fail(errors, 'Campaign conversionGoal must be audit_request_submitted.');
  }
}

function validateRsaAssets(assets, campaign, errors) {
  if (!Array.isArray(assets.headlines) || assets.headlines.length < 3) {
    fail(errors, 'Responsive search ad needs at least 3 headlines.');
  }

  if (!Array.isArray(assets.descriptions) || assets.descriptions.length < 2) {
    fail(errors, 'Responsive search ad needs at least 2 descriptions.');
  }

  for (const headline of assets.headlines || []) {
    if (headline.length > MAX_HEADLINE_LENGTH) {
      fail(errors, `Headline exceeds ${MAX_HEADLINE_LENGTH} chars: "${headline}"`);
    }
  }

  for (const description of assets.descriptions || []) {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      fail(errors, `Description exceeds ${MAX_DESCRIPTION_LENGTH} chars: "${description}"`);
    }
  }

  let finalUrl;
  try {
    finalUrl = new URL(assets.finalUrl);
  } catch {
    fail(errors, 'RSA finalUrl must be a valid URL.');
    return;
  }

  if (finalUrl.origin !== 'https://juancanfield.com') {
    fail(errors, 'RSA finalUrl must use https://juancanfield.com.');
  }

  for (const key of REQUIRED_UTM_KEYS) {
    if (!finalUrl.searchParams.get(key)) {
      fail(errors, `RSA finalUrl missing ${key}.`);
    }
  }

  if (finalUrl.searchParams.get('utm_campaign') !== campaign.utm?.campaign) {
    fail(errors, 'RSA utm_campaign must match campaign.json.');
  }

  if (finalUrl.searchParams.get('utm_content') !== campaign.utm?.content) {
    fail(errors, 'RSA utm_content must match campaign.json.');
  }
}

function validateKeywords(keywords, errors) {
  if (keywords.length < 8) {
    fail(errors, 'Keyword list is too small for the first test.');
  }

  for (const row of keywords) {
    if (!ALLOWED_MATCH_TYPES.has(row.match_type)) {
      fail(errors, `Keyword "${row.keyword}" must use exact or phrase match.`);
    }

    if (!row.keyword || row.keyword.split(/\s+/).length < 2) {
      fail(errors, `Keyword is too broad: "${row.keyword}"`);
    }
  }
}

function validateNegatives(negatives, errors) {
  const negativeSet = new Set(negatives.map((row) => row.keyword));
  for (const required of REQUIRED_NEGATIVES) {
    if (!negativeSet.has(required)) {
      fail(errors, `Missing required negative keyword: "${required}"`);
    }
  }

  for (const row of negatives) {
    if (!ALLOWED_MATCH_TYPES.has(row.match_type)) {
      fail(errors, `Negative keyword "${row.keyword}" must use exact or phrase match.`);
    }
  }
}

async function main() {
  const errors = [];
  const campaign = await readJson(join(specDir, 'campaign.json'));
  const rsaAssets = await readJson(join(specDir, 'rsa_assets.json'));
  const keywords = await readCsv(join(specDir, 'keywords.csv'));
  const negatives = await readCsv(join(specDir, 'negative_keywords.csv'));

  validateCampaign(campaign, errors);
  validateRsaAssets(rsaAssets, campaign, errors);
  validateKeywords(keywords, errors);
  validateNegatives(negatives, errors);

  if (errors.length > 0) {
    console.error('Ad spec validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Ad spec validation passed.');
  console.log(`Campaign: ${campaign.campaignName}`);
  console.log(`Budget: $${campaign.dailyBudgetUsd}/day`);
  console.log(`Headlines: ${rsaAssets.headlines.length}`);
  console.log(`Descriptions: ${rsaAssets.descriptions.length}`);
  console.log(`Keywords: ${keywords.length}`);
  console.log(`Negative keywords: ${negatives.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
