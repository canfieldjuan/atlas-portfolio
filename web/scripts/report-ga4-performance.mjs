import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { loadCampaignSpec, repoRoot } from './ads-spec-io.mjs';
import { loadLocalEnv } from './local-env.mjs';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_GA4_API_VERSION = 'v1beta';
const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const DEFAULT_CONVERSION_EVENT = 'audit_request_submitted';
const REQUIRED_GA4_ENV = ['GA4_PROPERTY_ID', 'GA4_CLIENT_ID', 'GA4_CLIENT_SECRET', 'GA4_REFRESH_TOKEN'];
const OPTIONAL_GA4_ENV = ['GA4_API_VERSION'];

function printUsage() {
  console.log(`GA4 campaign performance report

Usage:
  npm run ads:ga4:report
  npm run ads:ga4:report -- --dry-run
  npm run ads:ga4:report -- --json
  npm run ads:ga4:report -- --days 14 --output /tmp/ga4-performance.json

Options:
  --landing-page <path>  Landing page path to filter; defaults to the campaign spec path
  --event-name <name>    Conversion event to filter; default ${DEFAULT_CONVERSION_EVENT}
  --days <number>        Date window ending at --end-date or today; default ${DEFAULT_DAYS}, max ${MAX_DAYS}
  --end-date <YYYY-MM-DD>
  --output <path>        Write the report JSON artifact
  --json                 Print machine-readable JSON
  --dry-run              Build request payloads without API calls
  --debug-errors         Include sanitized upstream API error messages

Safety:
  This command is read-only. It only refreshes OAuth and calls GA4 Data API runReport.`);
}

function envValue(name) {
  return process.env[name]?.trim() || '';
}

function validateGa4Env() {
  const missing = REQUIRED_GA4_ENV.filter((name) => !envValue(name));
  return {
    ok: missing.length === 0,
    missing,
    present: [...REQUIRED_GA4_ENV, ...OPTIONAL_GA4_ENV].filter((name) => envValue(name)),
  };
}

function ga4ApiVersion() {
  return envValue('GA4_API_VERSION') || DEFAULT_GA4_API_VERSION;
}

function normalizePropertyId(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function maskPropertyId(value) {
  const normalized = normalizePropertyId(value);
  if (normalized.length <= 4) {
    return normalized || '';
  }
  return `${'*'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
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
  const propertyId = normalizePropertyId(envValue('GA4_PROPERTY_ID'));
  if (propertyId) {
    safe = safe.replaceAll(propertyId, maskPropertyId(propertyId));
    safe = safe.replaceAll(`properties/${propertyId}`, `properties/${maskPropertyId(propertyId)}`);
  }
  return safe;
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

function landingPathFromUrl(value) {
  try {
    const url = new URL(value);
    return url.pathname || '/';
  } catch {
    return String(value || '').trim() || '/';
  }
}

function stringDimensionFilter(fieldName, value) {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: 'EXACT',
        value,
      },
    },
  };
}

function buildLandingPageRequest(landingPage, dateRange) {
  return {
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'date' }, { name: 'sessionSourceMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'eventCount' }],
    dimensionFilter: stringDimensionFilter('landingPage', landingPage),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '1000',
  };
}

function buildConversionEventRequest(eventName, dateRange) {
  return {
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: 'date' }, { name: 'sessionSourceMedium' }],
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
    dimensionFilter: stringDimensionFilter('eventName', eventName),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '1000',
  };
}

async function parseGoogleError(response, includeDebug = false) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const code = parsed.error?.status || parsed.error;
    const summary = code ? `Google API request failed with ${code}.` : 'Google API request failed.';
    if (!includeDebug) {
      return summary;
    }

    const debugMessage = parsed.error?.message || text;
    return `${summary} Debug: ${sanitizeMessage(debugMessage)}`;
  } catch {
    return `Google API request failed with non-JSON response (${response.status}).`;
  }
}

async function refreshAccessToken(options = {}) {
  const body = new URLSearchParams({
    client_id: envValue('GA4_CLIENT_ID'),
    client_secret: envValue('GA4_CLIENT_SECRET'),
    refresh_token: envValue('GA4_REFRESH_TOKEN'),
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

async function runReport(accessToken, apiVersion, propertyId, request, options = {}) {
  const response = await fetch(`https://analyticsdata.googleapis.com/${apiVersion}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`GA4 runReport failed (${response.status}): ${await parseGoogleError(response, options.debugErrors)}`);
  }

  return response.json();
}

function numericValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dimensionValue(row, index) {
  return row.dimensionValues?.[index]?.value || '';
}

function metricValue(row, index) {
  return numericValue(row.metricValues?.[index]?.value);
}

function mapLandingRows(payload) {
  return (payload.rows || []).map((row) => ({
    date: dimensionValue(row, 0),
    sourceMedium: dimensionValue(row, 1),
    sessions: metricValue(row, 0),
    activeUsers: metricValue(row, 1),
    eventCount: metricValue(row, 2),
  }));
}

function mapConversionRows(payload) {
  return (payload.rows || []).map((row) => ({
    date: dimensionValue(row, 0),
    sourceMedium: dimensionValue(row, 1),
    eventCount: metricValue(row, 0),
    activeUsers: metricValue(row, 1),
  }));
}

function aggregateRows(rows, metricNames) {
  return Object.fromEntries(
    metricNames.map((name) => [name, rows.reduce((total, row) => total + numericValue(row[name]), 0)]),
  );
}

async function writeReportArtifact(outputPath, payload) {
  const resolvedPath = isAbsolute(outputPath) ? outputPath : resolve(repoRoot, outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, `${JSON.stringify({ ...payload, outputPath: resolvedPath }, null, 2)}\n`, 'utf8');
  return resolvedPath;
}

function printTextReport(payload) {
  console.log('GA4 campaign performance report');
  console.log(`Mode: ${payload.mode}`);
  console.log(`API calls: ${payload.apiCalls ? 'enabled' : 'disabled'}`);
  console.log('Mutations: disabled');
  console.log(`Landing page: ${payload.landingPage}`);
  console.log(`Conversion event: ${payload.conversionEvent}`);
  console.log(`Date range: ${payload.dateRange.startDate} to ${payload.dateRange.endDate}`);
  console.log(`Landing rows: ${payload.landingPageReport.rows.length}`);
  console.log(`Sessions: ${payload.landingPageReport.totals.sessions}`);
  console.log(`Conversion rows: ${payload.conversionEventReport.rows.length}`);
  console.log(`Conversion events: ${payload.conversionEventReport.totals.eventCount}`);
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
  const landingPage = values.get('--landing-page') || landingPathFromUrl(campaign.landingPage);
  const conversionEvent = values.get('--event-name') || campaign.conversionGoal || DEFAULT_CONVERSION_EVENT;
  const days = parseDays(values.get('--days'));
  const dateRange = buildDateRange(days, values.get('--end-date'));
  const apiVersion = ga4ApiVersion();
  const propertyId = normalizePropertyId(envValue('GA4_PROPERTY_ID'));
  const landingPageRequest = buildLandingPageRequest(landingPage, dateRange);
  const conversionEventRequest = buildConversionEventRequest(conversionEvent, dateRange);

  if (dryRun) {
    const payload = {
      ok: true,
      mode: 'GA4_PERFORMANCE_DRY_RUN',
      apiCalls: false,
      mutations: false,
      apiVersion,
      landingPage,
      conversionEvent,
      dateRange,
      requests: {
        landingPage: landingPageRequest,
        conversionEvent: conversionEventRequest,
      },
      landingPageReport: {
        rowCount: 0,
        totals: aggregateRows([], ['sessions', 'activeUsers', 'eventCount']),
        rows: [],
      },
      conversionEventReport: {
        rowCount: 0,
        totals: aggregateRows([], ['eventCount', 'activeUsers']),
        rows: [],
      },
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

  const envStatus = validateGa4Env();
  if (!envStatus.ok) {
    fail('GA4 environment is incomplete.', outputJson, {
      mode: 'GA4_PERFORMANCE_REPORT',
      apiCalls: false,
      mutations: false,
      missing: envStatus.missing,
      present: envStatus.present,
    });
  }
  if (!propertyId) {
    fail('GA4_PROPERTY_ID must contain at least one digit.', outputJson);
  }

  try {
    const accessToken = await refreshAccessToken({ debugErrors });
    const [landingPayload, conversionPayload] = await Promise.all([
      runReport(accessToken, apiVersion, propertyId, landingPageRequest, { debugErrors }),
      runReport(accessToken, apiVersion, propertyId, conversionEventRequest, { debugErrors }),
    ]);
    const landingRows = mapLandingRows(landingPayload);
    const conversionRows = mapConversionRows(conversionPayload);
    const payload = {
      ok: true,
      mode: 'GA4_PERFORMANCE_REPORT',
      apiCalls: true,
      mutations: false,
      apiVersion,
      propertyId: maskPropertyId(propertyId),
      landingPage,
      conversionEvent,
      dateRange,
      landingPageReport: {
        rowCount: landingRows.length,
        totals: aggregateRows(landingRows, ['sessions', 'activeUsers', 'eventCount']),
        rows: landingRows,
      },
      conversionEventReport: {
        rowCount: conversionRows.length,
        totals: aggregateRows(conversionRows, ['eventCount', 'activeUsers']),
        rows: conversionRows,
      },
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
      mode: 'GA4_PERFORMANCE_REPORT',
      apiCalls: true,
      mutations: false,
      apiVersion,
      propertyId: maskPropertyId(propertyId),
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'GA4_PERFORMANCE_REPORT',
    apiCalls: false,
    mutations: false,
  });
});
