import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { artifactVersionFields, GOOGLE_ADS_ARTIFACT_TYPES } from './google-ads-artifact-contracts.mjs';
import {
  generateKeywordIdeas,
  refreshAccessToken,
  sanitizeGoogleAdsMessage,
} from './google-ads-api.mjs';
import {
  envValue,
  googleAdsApiVersion,
  invalidGoogleAdsEnvErrors,
  maskCustomerId,
  normalizeCustomerId,
  validateGoogleAdsEnv,
} from './google-ads-env.mjs';
import { loadLocalEnv } from './local-env.mjs';

// Keyword Planner research. Defaults to US + English; geo/language are Google's
// numeric constant ids (2840 = United States, 1000 = English).
const DEFAULT_GEO_TARGET = '2840';
const DEFAULT_LANGUAGE = '1000';
const DEFAULT_NETWORK = 'GOOGLE_SEARCH';
const VALID_NETWORKS = new Set(['GOOGLE_SEARCH', 'GOOGLE_SEARCH_AND_PARTNERS']);
const MAX_SEED_KEYWORDS = 20; // Google Ads API limit for keywordSeed.keywords
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 5000;

function printUsage() {
  console.log(`Google Ads keyword ideas + search volume (read-only)

Usage:
  npm run ads:google:keywords -- --keywords "ticket deflection,reduce support tickets"
  npm run ads:google:keywords -- --url https://example.com/page
  npm run ads:google:keywords -- --keywords "knowledge base failing" --json --output /tmp/keywords.json

Seed (at least one required):
  --keywords <a,b,c>       Comma-separated seed keywords (max ${MAX_SEED_KEYWORDS})
  --url <url>              Seed from a landing-page URL (combinable with --keywords)

Options:
  --geo <id>               Geo target constant id; default ${DEFAULT_GEO_TARGET} (United States)
  --language <id>          Language constant id; default ${DEFAULT_LANGUAGE} (English)
  --network <name>         GOOGLE_SEARCH (default) or GOOGLE_SEARCH_AND_PARTNERS
  --limit <n>              Max ideas to return, ranked by avg monthly searches; default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}
  --output <path>          Write the ideas JSON artifact
  --json                   Print machine-readable JSON
  --dry-run                Build the request body without API calls
  --debug-errors           Include sanitized upstream API error messages

Safety:
  This command is read-only. It only refreshes OAuth and calls generateKeywordIdeas.
  Volume comes from Keyword Planner as averages/ranges (low-volume long-tail terms
  read as small numbers); access + granularity depend on the developer-token level.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, { sanitize: sanitizeGoogleAdsMessage });
}

function parseSeedKeywords(value) {
  if (!value) {
    return [];
  }
  const keywords = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (keywords.length > MAX_SEED_KEYWORDS) {
    throw new Error(`--keywords accepts at most ${MAX_SEED_KEYWORDS} seed keywords.`);
  }
  return keywords;
}

function parseConstantId(value, flag, fallback) {
  const raw = value === undefined ? fallback : String(value).trim();
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${flag} must be a numeric Google Ads constant id.`);
  }
  return raw;
}

function parseLimit(value) {
  if (value === undefined) {
    return DEFAULT_LIMIT;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error(`--limit must be an integer from 1 to ${MAX_LIMIT}.`);
  }
  return parsed;
}

function parseNetwork(value) {
  const network = value === undefined ? DEFAULT_NETWORK : String(value).trim();
  if (!VALID_NETWORKS.has(network)) {
    throw new Error(`--network must be one of: ${[...VALID_NETWORKS].join(', ')}.`);
  }
  return network;
}

function buildRequestBody({ keywords, url, geo, language, network }) {
  const body = {
    keywordPlanNetwork: network,
    geoTargetConstants: [`geoTargetConstants/${geo}`],
    language: `languageConstants/${language}`,
    includeAdultKeywords: false,
  };
  if (keywords.length > 0 && url) {
    body.keywordAndUrlSeed = { url, keywords };
  } else if (url) {
    body.urlSeed = { url };
  } else {
    body.keywordSeed = { keywords };
  }
  return body;
}

function numericValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function microsToUsd(value) {
  return Math.round((numericValue(value) / 1_000_000) * 100) / 100;
}

function mapIdeaRow(row) {
  const metrics = row.keywordIdeaMetrics || {};
  return {
    keyword: row.text || '',
    avgMonthlySearches: numericValue(metrics.avgMonthlySearches),
    competition: metrics.competition || 'UNKNOWN',
    competitionIndex: numericValue(metrics.competitionIndex),
    lowTopOfPageBidUsd: microsToUsd(metrics.lowTopOfPageBidMicros),
    highTopOfPageBidUsd: microsToUsd(metrics.highTopOfPageBidMicros),
  };
}

function printTextReport(payload) {
  console.log('Google Ads keyword ideas');
  console.log(`Mode: ${payload.mode}`);
  console.log(`API calls: ${payload.apiCalls ? 'enabled' : 'disabled'}`);
  console.log('Mutations: disabled');
  console.log(`Seeds: ${payload.seed.keywords.join(', ') || '(none)'}${payload.seed.url ? ` + url ${payload.seed.url}` : ''}`);
  console.log(`Geo: ${payload.seed.geo}  Language: ${payload.seed.language}  Network: ${payload.seed.network}`);
  console.log(`Ideas: ${payload.ideas.length}`);
  if (payload.ideas.length > 0) {
    console.log('');
    console.log('  avg/mo  competition  keyword');
    for (const idea of payload.ideas) {
      const vol = String(idea.avgMonthlySearches).padStart(7, ' ');
      const comp = idea.competition.padEnd(11, ' ');
      console.log(`  ${vol}  ${comp}  ${idea.keyword}`);
    }
  }
  if (payload.outputPath) {
    console.log(`\nIdeas artifact: ${payload.outputPath}`);
  }
}

async function main() {
  await loadLocalEnv();

  const { values, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');
  const dryRun = flags.has('--dry-run');
  const debugErrors = flags.has('--debug-errors');
  const outputPath = values.get('--output');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }

  if (flags.has('--execute')) {
    fail('Execution mode is not supported. This command is read-only.', outputJson);
  }
  for (const flag of ['--output', '--keywords', '--url', '--geo', '--language', '--network', '--limit']) {
    if (isBareFlag({ values, flags }, flag)) {
      fail(`Refusing to continue with bare ${flag}; pass a value or omit the flag.`, outputJson);
    }
  }

  let seed;
  let limit;
  try {
    const keywords = parseSeedKeywords(values.get('--keywords'));
    const url = values.get('--url') ? String(values.get('--url')).trim() : '';
    if (keywords.length === 0 && !url) {
      throw new Error('Provide a seed: --keywords <a,b,c> and/or --url <url>.');
    }
    if (url && !/^https?:\/\//i.test(url)) {
      throw new Error('--url must be an http(s) URL.');
    }
    seed = {
      keywords,
      url,
      geo: parseConstantId(values.get('--geo'), '--geo', DEFAULT_GEO_TARGET),
      language: parseConstantId(values.get('--language'), '--language', DEFAULT_LANGUAGE),
      network: parseNetwork(values.get('--network')),
    };
    limit = parseLimit(values.get('--limit'));
  } catch (error) {
    fail(error.message || String(error), outputJson);
    return;
  }

  const apiVersion = googleAdsApiVersion();
  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));
  const requestBody = buildRequestBody(seed);

  if (dryRun) {
    const payload = {
      ok: true,
      ...artifactVersionFields(GOOGLE_ADS_ARTIFACT_TYPES.KEYWORD_IDEAS),
      mode: 'KEYWORD_IDEAS_DRY_RUN',
      apiCalls: false,
      mutations: false,
      apiVersion,
      seed,
      limit,
      requestBody,
      ideaCount: 0,
      ideas: [],
    };
    if (outputPath) {
      payload.outputPath = await writeJsonArtifact(outputPath, payload);
    }
    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    printTextReport(payload);
    return;
  }

  const envStatus = validateGoogleAdsEnv();
  if (!envStatus.ok) {
    fail('Google Ads environment is incomplete.', outputJson, {
      mode: 'KEYWORD_IDEAS',
      apiCalls: false,
      mutations: false,
      missing: envStatus.missing,
      invalid: envStatus.invalid,
      present: envStatus.present,
      errors: invalidGoogleAdsEnvErrors(envStatus),
    });
  }

  try {
    const accessToken = await refreshAccessToken({ includeDebug: debugErrors });
    const rawRows = await generateKeywordIdeas(accessToken, apiVersion, customerId, requestBody, {
      includeDebug: debugErrors,
      errorLabel: 'keyword ideas query',
    });
    const ideas = rawRows
      .map(mapIdeaRow)
      // Highest-volume first, then alphabetical for stable ordering at equal volume.
      .sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches || a.keyword.localeCompare(b.keyword))
      .slice(0, limit);

    const payload = {
      ok: true,
      ...artifactVersionFields(GOOGLE_ADS_ARTIFACT_TYPES.KEYWORD_IDEAS),
      mode: 'KEYWORD_IDEAS',
      apiCalls: true,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      seed,
      limit,
      totalReturned: rawRows.length,
      ideaCount: ideas.length,
      ideas,
    };

    if (outputPath) {
      payload.outputPath = await writeJsonArtifact(outputPath, payload);
    }
    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    printTextReport(payload);
  } catch (error) {
    fail(error.message || String(error), outputJson, {
      mode: 'KEYWORD_IDEAS',
      apiCalls: true,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'KEYWORD_IDEAS',
    apiCalls: false,
    mutations: false,
  });
});
