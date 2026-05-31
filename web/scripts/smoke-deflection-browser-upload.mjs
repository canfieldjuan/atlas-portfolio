import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { upload as blobUpload } from '@vercel/blob/client';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const DEFAULT_BASE_URL = 'https://juancanfield.com';
const UPLOAD_PATH = '/api/gap-report-intake/upload';
const RECORD_PATH = '/api/gap-report-intake/record';
const RESULTS_PATH = '/systems/support-ticket-deflection/results';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const SUPPORT_PLATFORMS = new Set(['zendesk', 'intercom', 'freshdesk', 'helpscout', 'other']);

function printUsage() {
  console.log(`Deflection browser upload smoke

Usage:
  npm --prefix web run smoke:deflection-browser-upload -- \\
    --csv /path/to/tickets.csv \\
    --company "Effingham Office Maids" \\
    --email ops@example.com \\
    --platform helpscout

Options:
  --base-url <url>   Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --name <name>      Lead name (default: Deflection Browser Smoke)
  --json             Print machine-readable JSON
  --output <path>    Write the smoke artifact JSON

Safety:
  This exercises the deployed browser-upload path: /upload -> Vercel Blob PUT
  -> /record. It can create an intake record, trigger deployed email handling,
  and submit the CSV to ATLAS through the deployed portfolio route.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, {
    sanitize: (value) => String(value || 'Unknown error.').slice(0, 300),
  });
}

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_BASE_URL).trim().replace(/\/$/, '');
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return null;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function companySlug(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'unknown'
  );
}

function safeFilename(value) {
  return basename(value).replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'tickets.csv';
}

function requiredOptions(parsed) {
  const missing = [];
  for (const flag of ['--csv', '--company', '--email', '--platform']) {
    if (isBareFlag(parsed, flag) || !parsed.values.get(flag)?.trim()) {
      missing.push(flag);
    }
  }
  return missing;
}

function validateOptions({ csvPath, companyName, email, platform, baseUrl }) {
  const errors = [];
  if (!baseUrl) errors.push('--base-url must be https, localhost, or 127.0.0.1');
  if (!csvPath.toLowerCase().endsWith('.csv')) errors.push('--csv must point to a .csv file');
  if (!companyName.trim()) errors.push('--company is required');
  if (!EMAIL_RE.test(email)) errors.push('--email must be a valid email address');
  if (!SUPPORT_PLATFORMS.has(platform)) {
    errors.push(`--platform must be one of: ${Array.from(SUPPORT_PLATFORMS).join(', ')}`);
  }
  return errors;
}

function parseRecordPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.ok !== true) {
    return {
      ok: false,
      error: typeof payload.error === 'string' ? payload.error : 'Record route rejected the upload.',
    };
  }
  const requestId = typeof payload.requestId === 'string' ? payload.requestId : '';
  const reportRequestId = typeof payload.reportRequestId === 'string' ? payload.reportRequestId : '';
  return {
    ok: true,
    requestId,
    reportRequestId: REQUEST_ID_RE.test(reportRequestId) ? reportRequestId : '',
    warnings: Array.isArray(payload.warnings) ? payload.warnings.filter((value) => typeof value === 'string') : [],
  };
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resultsUrl(baseUrl, requestId) {
  return `${baseUrl}${RESULTS_PATH}/${encodeURIComponent(requestId)}`;
}

export async function runDeflectionBrowserUploadSmoke(options, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const uploadImpl = deps.uploadImpl || blobUpload;
  const readFileImpl = deps.readFileImpl || readFile;
  const now = deps.now || (() => new Date().toISOString());

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const csvPath = String(options.csvPath || '').trim();
  const companyName = String(options.companyName || '').trim();
  const email = String(options.email || '').trim();
  const platform = String(options.platform || '').trim();
  const name = String(options.name || 'Deflection Browser Smoke').trim();
  const optionErrors = validateOptions({ csvPath, companyName, email, platform, baseUrl });

  if (optionErrors.length > 0) {
    return {
      ok: false,
      error: 'Deflection browser upload smoke options are invalid.',
      errors: optionErrors,
      apiCalls: false,
      mutations: false,
    };
  }

  let csvBytes;
  try {
    csvBytes = await readFileImpl(csvPath);
  } catch {
    return {
      ok: false,
      error: 'CSV file could not be read.',
      apiCalls: false,
      mutations: false,
    };
  }
  if (!csvBytes || csvBytes.byteLength === 0) {
    return {
      ok: false,
      error: 'CSV file is empty.',
      apiCalls: false,
      mutations: false,
    };
  }

  const filename = safeFilename(csvPath);
  const metadata = {
    name,
    email,
    companyName,
    supportPlatform: platform,
    csvFilename: filename,
    csvSizeBytes: csvBytes.byteLength,
    sourcePage: 'support-ticket-deflection-intake',
    sourceOffer: 'support-ticket-deflection-intake',
  };
  const pathname = `gap-report-csvs/${Date.now()}-${companySlug(companyName)}/${filename}`;

  let blob;
  try {
    blob = await uploadImpl(pathname, new Blob([csvBytes], { type: 'text/csv' }), {
      access: 'private',
      contentType: 'text/csv',
      handleUploadUrl: `${baseUrl}${UPLOAD_PATH}`,
      clientPayload: JSON.stringify(metadata),
    });
  } catch (error) {
    return {
      ok: false,
      error: 'Browser upload smoke failed during Blob upload.',
      detail: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
      stage: 'upload',
      apiCalls: true,
      mutations: true,
    };
  }

  const blobUrl = typeof blob?.url === 'string' ? blob.url : '';
  if (!blobUrl.startsWith('https://') || !blobUrl.includes('/gap-report-csvs/')) {
    return {
      ok: false,
      error: 'Blob upload did not return a valid intake Blob URL.',
      stage: 'upload',
      apiCalls: true,
      mutations: true,
    };
  }

  let recordResponse;
  try {
    recordResponse = await fetchImpl(`${baseUrl}${RECORD_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...metadata, blobUrl }),
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      error: 'Record route failed before an HTTP response.',
      stage: 'record',
      apiCalls: true,
      mutations: true,
    };
  }

  const recordPayload = parseRecordPayload(await jsonOrNull(recordResponse));
  if (!recordResponse.ok || !recordPayload?.ok) {
    return {
      ok: false,
      error: recordPayload?.error || `Record route failed with HTTP ${recordResponse.status}.`,
      stage: 'record',
      recordStatus: recordResponse.status,
      apiCalls: true,
      mutations: true,
    };
  }
  if (!recordPayload.reportRequestId) {
    return {
      ok: false,
      error: 'Record route did not return a valid reportRequestId for redirect.',
      stage: 'record',
      requestId: recordPayload.requestId,
      apiCalls: true,
      mutations: true,
      warnings: recordPayload.warnings,
    };
  }

  const url = resultsUrl(baseUrl, recordPayload.reportRequestId);
  return {
    ok: true,
    mode: 'DEFLECTION_BROWSER_UPLOAD_SMOKE',
    apiCalls: true,
    mutations: true,
    checkedAt: now(),
    requestId: recordPayload.requestId,
    reportRequestId: recordPayload.reportRequestId,
    resultsUrl: url,
    blobHost: new URL(blobUrl).hostname,
    blobPathname: blob.pathname || pathname,
    warnings: recordPayload.warnings,
  };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const outputJson = parsed.flags.has('--json');
  const outputPath = parsed.values.get('--output');

  if (parsed.flags.has('--help') || parsed.flags.has('-h')) {
    printUsage();
    return;
  }
  if (isBareFlag(parsed, '--output')) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }
  if (isBareFlag(parsed, '--base-url')) {
    fail('Refusing to continue without --base-url <url>.', outputJson, {
      apiCalls: false,
      mutations: false,
    });
  }
  const missing = requiredOptions(parsed);
  if (missing.length > 0) {
    fail('Deflection browser upload smoke is missing required options.', outputJson, {
      missing,
      apiCalls: false,
      mutations: false,
    });
  }

  const result = await runDeflectionBrowserUploadSmoke({
    csvPath: parsed.values.get('--csv'),
    companyName: parsed.values.get('--company'),
    email: parsed.values.get('--email'),
    platform: parsed.values.get('--platform'),
    name: parsed.values.get('--name') || 'Deflection Browser Smoke',
    baseUrl: parsed.values.get('--base-url') || DEFAULT_BASE_URL,
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) fail(result.error, outputJson, result);
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection browser upload smoke passed.');
  console.log(`Report request id: ${result.reportRequestId}`);
  console.log(`Results URL: ${result.resultsUrl}`);
  if (artifactPath) console.log(`Smoke artifact: ${artifactPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, {
      apiCalls: false,
      mutations: false,
    });
  });
}
