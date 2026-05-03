import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { loadCampaignSpec, repoRoot } from './ads-spec-io.mjs';
import {
  envValue,
  googleAdsApiVersion,
  maskCustomerId,
  normalizeCustomerId,
  validateGoogleAdsEnv,
} from './google-ads-env.mjs';
import { loadLocalEnv } from './local-env.mjs';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

function printUsage() {
  console.log(`Google Ads performance report

Usage:
  npm run ads:google:report
  npm run ads:google:report -- --dry-run
  npm run ads:google:report -- --json
  npm run ads:google:report -- --days 14 --output /tmp/google-ads-performance.json

Options:
  --campaign-name <name>   Override the source-controlled campaign name
  --days <number>          Date window ending at --end-date or today; default ${DEFAULT_DAYS}, max ${MAX_DAYS}
  --end-date <YYYY-MM-DD>  Report end date in UTC; defaults to today
  --output <path>          Write the report JSON artifact
  --json                   Print machine-readable JSON
  --dry-run                Build the query and payload shape without API calls
  --debug-errors           Include sanitized upstream API error messages

Safety:
  This command is read-only. It only refreshes OAuth and runs googleAds:search for campaign metrics.`);
}

function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('-')) {
      continue;
    }

    const [name, inlineValue] = item.split('=', 2);
    if (inlineValue !== undefined) {
      values.set(name, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('-')) {
      values.set(name, next);
      index += 1;
      continue;
    }

    flags.add(name);
  }

  return { values, flags };
}

function fail(message, outputJson, details = {}) {
  const safeMessage = sanitizeMessage(message);
  if (outputJson) {
    console.log(JSON.stringify({ ok: false, error: safeMessage, ...details }, null, 2));
  } else {
    console.error(safeMessage);
    if (details.missing?.length) {
      for (const name of details.missing) {
        console.error(`- ${name}`);
      }
    }
  }
  process.exit(1);
}

function sanitizeMessage(message) {
  let safe = String(message || 'Unknown error.');
  for (const value of [envValue('GOOGLE_ADS_CUSTOMER_ID'), envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID')]) {
    const normalized = normalizeCustomerId(value);
    if (!normalized) {
      continue;
    }

    safe = safe.replaceAll(normalized, maskCustomerId(normalized));
    safe = safe.replaceAll(formatDashedCustomerId(normalized), maskCustomerId(normalized));
  }
  return safe;
}

function formatDashedCustomerId(value) {
  const normalized = normalizeCustomerId(value);
  if (normalized.length !== 10) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

function parseDays(value) {
  if (value === undefined) {
    return DEFAULT_DAYS;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DAYS) {
    throw new Error(`--days must be an integer from 1 to ${MAX_DAYS}.`);
  }
  return parsed;
}

function parseIsoDate(value) {
  if (!value) {
    return new Date();
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('--end-date must use YYYY-MM-DD format.');
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || formatIsoDate(parsed) !== value) {
    throw new Error('--end-date must be a valid calendar date.');
  }
  return parsed;
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(days, endDate) {
  const end = parseIsoDate(endDate);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
    days,
  };
}

function escapeGaqlString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildPerformanceQuery(campaignName, dateRange) {
  return `
SELECT
  segments.date,
  campaign.id,
  campaign.name,
  campaign.status,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.ctr,
  metrics.average_cpc
FROM campaign
WHERE campaign.name = '${escapeGaqlString(campaignName)}'
  AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
ORDER BY segments.date ASC
`.trim();
}

async function parseGoogleError(response, includeDebug = false) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const code = parsed.error?.status || parsed.error || parsed.error_description;
    const summary = code ? `Google API request failed with ${code}.` : 'Google API request failed.';
    if (!includeDebug) {
      return summary;
    }

    const debugMessage = parsed.error?.message || parsed.error_description || text;
    return `${summary} Debug: ${sanitizeMessage(debugMessage)}`;
  } catch {
    return `Google API request failed with non-JSON response (${response.status}).`;
  }
}

async function refreshAccessToken(options = {}) {
  const body = new URLSearchParams({
    client_id: envValue('GOOGLE_ADS_CLIENT_ID'),
    client_secret: envValue('GOOGLE_ADS_CLIENT_SECRET'),
    refresh_token: envValue('GOOGLE_ADS_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`OAuth refresh failed (${response.status}): ${await parseGoogleError(response, options.debugErrors)}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('OAuth refresh response did not include access_token.');
  }

  return payload.access_token;
}

function googleAdsHeaders(accessToken, includeJson = false) {
  const headers = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': envValue('GOOGLE_ADS_DEVELOPER_TOKEN'),
  };
  const loginCustomerId = normalizeCustomerId(envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID'));
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }
  if (includeJson) {
    headers['content-type'] = 'application/json';
  }
  return headers;
}

async function runPerformanceQuery(accessToken, apiVersion, customerId, query, options = {}) {
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: googleAdsHeaders(accessToken, true),
    body: JSON.stringify({
      query,
      pageSize: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`campaign performance query failed (${response.status}): ${await parseGoogleError(response, options.debugErrors)}`);
  }

  const payload = await response.json();
  return payload.results || [];
}

function numericValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function microsToUsd(value) {
  return Math.round((numericValue(value) / 1_000_000) * 100) / 100;
}

function mapPerformanceRow(row) {
  const metrics = row.metrics || {};
  return {
    date: row.segments?.date || '',
    campaignId: row.campaign?.id || '',
    campaignName: row.campaign?.name || '',
    campaignStatus: row.campaign?.status || '',
    impressions: numericValue(metrics.impressions),
    clicks: numericValue(metrics.clicks),
    costMicros: numericValue(metrics.costMicros),
    costUsd: microsToUsd(metrics.costMicros),
    conversions: numericValue(metrics.conversions),
    conversionsValue: numericValue(metrics.conversionsValue),
    ctr: numericValue(metrics.ctr),
    averageCpcMicros: numericValue(metrics.averageCpc),
    averageCpcUsd: microsToUsd(metrics.averageCpc),
  };
}

function aggregatePerformance(rows) {
  const totals = rows.reduce(
    (accumulator, row) => ({
      impressions: accumulator.impressions + row.impressions,
      clicks: accumulator.clicks + row.clicks,
      costMicros: accumulator.costMicros + row.costMicros,
      conversions: accumulator.conversions + row.conversions,
      conversionsValue: accumulator.conversionsValue + row.conversionsValue,
    }),
    {
      impressions: 0,
      clicks: 0,
      costMicros: 0,
      conversions: 0,
      conversionsValue: 0,
    },
  );

  return {
    ...totals,
    costUsd: microsToUsd(totals.costMicros),
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    averageCpcMicros: totals.clicks > 0 ? Math.round(totals.costMicros / totals.clicks) : 0,
    averageCpcUsd: totals.clicks > 0 ? microsToUsd(totals.costMicros / totals.clicks) : 0,
  };
}

async function writeReportArtifact(outputPath, payload) {
  const resolvedPath = isAbsolute(outputPath) ? outputPath : resolve(repoRoot, outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, `${JSON.stringify({ ...payload, outputPath: resolvedPath }, null, 2)}\n`, 'utf8');
  return resolvedPath;
}

function printTextReport(payload) {
  console.log('Google Ads performance report');
  console.log(`Mode: ${payload.mode}`);
  console.log(`API calls: ${payload.apiCalls ? 'enabled' : 'disabled'}`);
  console.log('Mutations: disabled');
  console.log(`Campaign: ${payload.campaignName}`);
  console.log(`Date range: ${payload.dateRange.startDate} to ${payload.dateRange.endDate}`);
  console.log(`Rows: ${payload.rows.length}`);
  console.log(`Impressions: ${payload.totals.impressions}`);
  console.log(`Clicks: ${payload.totals.clicks}`);
  console.log(`Cost: $${payload.totals.costUsd}`);
  console.log(`Conversions: ${payload.totals.conversions}`);
  if (payload.outputPath) {
    console.log(`Report artifact: ${payload.outputPath}`);
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
  if ((flags.has('--output') || values.has('--output')) && !outputPath) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }

  const { campaign } = await loadCampaignSpec();
  const campaignName = values.get('--campaign-name') || campaign.campaignName;
  const days = parseDays(values.get('--days'));
  const dateRange = buildDateRange(days, values.get('--end-date'));
  const query = buildPerformanceQuery(campaignName, dateRange);
  const apiVersion = googleAdsApiVersion();
  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));

  if (dryRun) {
    const payload = {
      ok: true,
      mode: 'GOOGLE_ADS_PERFORMANCE_DRY_RUN',
      apiCalls: false,
      mutations: false,
      apiVersion,
      campaignName,
      dateRange,
      query,
      rowCount: 0,
      rows: [],
      totals: aggregatePerformance([]),
    };
    if (outputPath) {
      payload.outputPath = await writeReportArtifact(outputPath, payload);
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
      mode: 'GOOGLE_ADS_PERFORMANCE_REPORT',
      apiCalls: false,
      mutations: false,
      missing: envStatus.missing,
      present: envStatus.present,
    });
  }
  if (!customerId) {
    fail('GOOGLE_ADS_CUSTOMER_ID must contain at least one digit.', outputJson);
  }

  try {
    const accessToken = await refreshAccessToken({ debugErrors });
    const rawRows = await runPerformanceQuery(accessToken, apiVersion, customerId, query, { debugErrors });
    const rows = rawRows.map(mapPerformanceRow);
    const payload = {
      ok: true,
      mode: 'GOOGLE_ADS_PERFORMANCE_REPORT',
      apiCalls: true,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      campaignName,
      dateRange,
      rowCount: rows.length,
      totals: aggregatePerformance(rows),
      rows,
    };

    if (outputPath) {
      payload.outputPath = await writeReportArtifact(outputPath, payload);
    }

    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    printTextReport(payload);
  } catch (error) {
    fail(error.message || String(error), outputJson, {
      mode: 'GOOGLE_ADS_PERFORMANCE_REPORT',
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
    mode: 'GOOGLE_ADS_PERFORMANCE_REPORT',
    apiCalls: false,
    mutations: false,
  });
});
