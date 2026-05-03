import { loadCampaignSpec } from './ads-spec-io.mjs';

const MAX_HEADLINE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 90;
const REQUIRED_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const ALLOWED_MATCH_TYPES = new Set(['exact', 'phrase']);
const REQUIRED_NEGATIVES = ['free', 'template', 'jobs', 'course', 'blog generator', 'essay'];

function fail(errors, message) {
  errors.push(message);
}

function validateCampaign(campaign, errors) {
  if (typeof campaign.campaignName !== 'string' || !campaign.campaignName.trim()) {
    fail(errors, 'Campaign campaignName must be a non-empty string.');
  }

  if (campaign.status !== 'PAUSED') {
    fail(errors, 'Campaign status must be PAUSED before API deployment.');
  }

  if (campaign.channel !== 'SEARCH') {
    fail(errors, 'First campaign must be SEARCH only.');
  }

  if (typeof campaign.dailyBudgetUsd !== 'number' || campaign.dailyBudgetUsd <= 0) {
    fail(errors, 'Campaign dailyBudgetUsd must be a positive number.');
  }

  if (
    typeof campaign.maxInitialDailyBudgetUsd !== 'number' ||
    campaign.maxInitialDailyBudgetUsd <= 0
  ) {
    fail(errors, 'Campaign maxInitialDailyBudgetUsd must be a positive number.');
  } else {
    if (typeof campaign.dailyBudgetUsd === 'number' && campaign.dailyBudgetUsd > campaign.maxInitialDailyBudgetUsd) {
      fail(errors, 'Campaign dailyBudgetUsd exceeds maxInitialDailyBudgetUsd.');
    }

    if (campaign.maxInitialDailyBudgetUsd > 50) {
      fail(errors, 'Initial budget cap must stay at or below $50/day.');
    }
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

function validateAdGroup(adGroup, errors) {
  if (!adGroup?.name) {
    fail(errors, 'Every ad group must have a name.');
  }

  if (typeof adGroup?.defaultMaxCpcUsd !== 'number' || adGroup.defaultMaxCpcUsd <= 0) {
    fail(errors, `Ad group "${adGroup?.name || 'unknown'}" must declare a positive defaultMaxCpcUsd.`);
  }

  if (!adGroup?.keywordFile) {
    fail(errors, `Ad group "${adGroup?.name || 'unknown'}" must declare keywordFile.`);
  }

  if (!adGroup?.negativeKeywordFile) {
    fail(errors, `Ad group "${adGroup?.name || 'unknown'}" must declare negativeKeywordFile.`);
  }

  if (!adGroup?.responsiveSearchAdFile) {
    fail(errors, `Ad group "${adGroup?.name || 'unknown'}" must declare responsiveSearchAdFile.`);
  }
}

function validateRsaAssets(assets, campaign, errors, context) {
  if (!Array.isArray(assets.headlines) || assets.headlines.length < 3) {
    fail(errors, `${context}: responsive search ad needs at least 3 headlines.`);
  }

  if (!Array.isArray(assets.descriptions) || assets.descriptions.length < 2) {
    fail(errors, `${context}: responsive search ad needs at least 2 descriptions.`);
  }

  for (const headline of assets.headlines || []) {
    if (headline.length > MAX_HEADLINE_LENGTH) {
      fail(errors, `${context}: headline exceeds ${MAX_HEADLINE_LENGTH} chars: "${headline}"`);
    }
  }

  for (const description of assets.descriptions || []) {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      fail(errors, `${context}: description exceeds ${MAX_DESCRIPTION_LENGTH} chars: "${description}"`);
    }
  }

  let finalUrl;
  try {
    finalUrl = new URL(assets.finalUrl);
  } catch {
    fail(errors, `${context}: RSA finalUrl must be a valid URL.`);
    return;
  }

  if (finalUrl.origin !== 'https://juancanfield.com') {
    fail(errors, `${context}: RSA finalUrl must use https://juancanfield.com.`);
  }

  for (const key of REQUIRED_UTM_KEYS) {
    if (!finalUrl.searchParams.get(key)) {
      fail(errors, `${context}: RSA finalUrl missing ${key}.`);
    }
  }

  if (finalUrl.searchParams.get('utm_source') !== campaign.utm?.source) {
    fail(errors, `${context}: RSA utm_source must match campaign.json.`);
  }

  if (finalUrl.searchParams.get('utm_medium') !== campaign.utm?.medium) {
    fail(errors, `${context}: RSA utm_medium must match campaign.json.`);
  }

  if (finalUrl.searchParams.get('utm_campaign') !== campaign.utm?.campaign) {
    fail(errors, `${context}: RSA utm_campaign must match campaign.json.`);
  }

  if (finalUrl.searchParams.get('utm_content') !== campaign.utm?.content) {
    fail(errors, `${context}: RSA utm_content must match campaign.json.`);
  }
}

function validateKeywords(keywords, errors, context) {
  if (keywords.length < 8) {
    fail(errors, `${context}: keyword list is too small for the first test.`);
  }

  for (const row of keywords) {
    if (!ALLOWED_MATCH_TYPES.has(row.match_type)) {
      fail(errors, `${context}: keyword "${row.keyword}" must use exact or phrase match.`);
    }

    if (!row.keyword || row.keyword.split(/\s+/).length < 2) {
      fail(errors, `${context}: keyword is too broad: "${row.keyword}"`);
    }
  }
}

function validateNegatives(negatives, errors, context) {
  const negativeSet = new Set(negatives.map((row) => row.keyword));
  for (const required of REQUIRED_NEGATIVES) {
    if (!negativeSet.has(required)) {
      fail(errors, `${context}: missing required negative keyword: "${required}"`);
    }
  }

  for (const row of negatives) {
    if (!ALLOWED_MATCH_TYPES.has(row.match_type)) {
      fail(errors, `${context}: negative keyword "${row.keyword}" must use exact or phrase match.`);
    }
  }
}

async function main() {
  const errors = [];
  const totals = {
    headlines: 0,
    descriptions: 0,
    keywords: 0,
    negatives: 0,
  };
  const { campaign, adGroups } = await loadCampaignSpec();

  validateCampaign(campaign, errors);

  if (!Array.isArray(campaign.adGroups) || campaign.adGroups.length === 0) {
    fail(errors, 'Campaign must declare at least one ad group.');
  }

  for (const { adGroup, rsaAssets, keywords, negatives } of adGroups) {
    const context = `Ad group "${adGroup?.name || 'unknown'}"`;
    validateAdGroup(adGroup, errors);
    if (!adGroup?.keywordFile || !adGroup?.negativeKeywordFile || !adGroup?.responsiveSearchAdFile) {
      continue;
    }

    validateRsaAssets(rsaAssets, campaign, errors, context);
    validateKeywords(keywords, errors, context);
    validateNegatives(negatives, errors, context);

    totals.headlines += rsaAssets.headlines?.length || 0;
    totals.descriptions += rsaAssets.descriptions?.length || 0;
    totals.keywords += keywords.length;
    totals.negatives += negatives.length;
  }

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
  console.log(`Ad groups: ${campaign.adGroups.length}`);
  console.log(`Headlines: ${totals.headlines}`);
  console.log(`Descriptions: ${totals.descriptions}`);
  console.log(`Keywords: ${totals.keywords}`);
  console.log(`Negative keywords: ${totals.negatives}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
