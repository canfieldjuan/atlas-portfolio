import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { loadLocalEnv } from './local-env.mjs';

const SUBMIT_PATH = '/api/v1/content-ops/deflection-reports/submit';
const RESULTS_PATH = '/systems/support-ticket-deflection/results';
const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_PLATFORM_VALUES = {
  zendesk: 'zendesk',
  intercom: 'intercom',
  helpscout: 'help_scout',
  freshdesk: 'other',
  other: 'other',
};

function printUsage() {
  console.log(`Deflection live submit smoke

Usage:
  npm --prefix web run smoke:deflection-live-submit -- \\
    --csv /path/to/tickets.csv \\
    --company "Effingham Office Maids" \\
    --email ops@example.com \\
    --platform helpscout

Options:
  --json             Print machine-readable JSON
  --output <path>    Write the smoke artifact JSON

Required env:
  ATLAS_API_BASE_URL
  ATLAS_B2B_JWT

Safety:
  This submits a CSV to deployed ATLAS and verifies snapshot 200 + artifact 403.
  It does not call Stripe and does not mark the report paid.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, {
    sanitize: (value) => String(value || 'Unknown error.').slice(0, 300),
  });
}

function cleanBaseUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
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

function validateOptions({ csvPath, companyName, contactEmail, platform }) {
  const errors = [];
  if (!csvPath.toLowerCase().endsWith('.csv')) {
    errors.push('--csv must point to a .csv file');
  }
  if (!companyName.trim()) {
    errors.push('--company is required');
  }
  if (!EMAIL_RE.test(contactEmail)) {
    errors.push('--email must be a valid email address');
  }
  if (!Object.hasOwn(SUPPORT_PLATFORM_VALUES, platform)) {
    errors.push(
      `--platform must be one of: ${Object.keys(SUPPORT_PLATFORM_VALUES).join(', ')}`,
    );
  }
  return errors;
}

function validateEnv(env) {
  const missing = [];
  const baseUrl = cleanBaseUrl(env.ATLAS_API_BASE_URL);
  const jwt = String(env.ATLAS_B2B_JWT || '').trim();
  if (!baseUrl) missing.push('ATLAS_API_BASE_URL');
  if (!jwt) missing.push('ATLAS_B2B_JWT');
  return { ok: missing.length === 0, missing, baseUrl, jwt };
}

function parseSubmitPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const requestId = payload.request_id;
  return typeof requestId === 'string' && REQUEST_ID_RE.test(requestId) ? requestId : null;
}

function parseSnapshotPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const summary = payload.summary;
  const topQuestions = payload.top_questions;
  if (!summary || typeof summary !== 'object') return null;
  if (
    typeof summary.generated !== 'number' ||
    typeof summary.drafted_answer_count !== 'number' ||
    typeof summary.no_proven_answer_count !== 'number'
  ) {
    return null;
  }
  if (!Array.isArray(topQuestions)) return null;
  return {
    generated: summary.generated,
    draftedAnswerCount: summary.drafted_answer_count,
    noProvenAnswerCount: summary.no_proven_answer_count,
    topQuestionCount: topQuestions.length,
  };
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function authHeaders(jwt) {
  return {
    Authorization: `Bearer ${jwt}`,
    Accept: 'application/json',
  };
}

export async function runDeflectionLiveSubmitSmoke(options, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const readFileImpl = deps.readFileImpl || readFile;
  const now = deps.now || (() => new Date().toISOString());
  const siteUrl = deps.siteUrl || 'https://juancanfield.com';

  const envStatus = validateEnv(env);
  if (!envStatus.ok) {
    return {
      ok: false,
      error: 'Deflection live submit smoke environment is incomplete.',
      missing: envStatus.missing,
      apiCalls: false,
      mutations: false,
    };
  }

  const optionErrors = validateOptions(options);
  if (optionErrors.length > 0) {
    return {
      ok: false,
      error: 'Deflection live submit smoke options are invalid.',
      errors: optionErrors,
      apiCalls: false,
      mutations: false,
    };
  }

  let csvBytes;
  try {
    csvBytes = await readFileImpl(options.csvPath);
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

  const form = new FormData();
  form.set('csv_file', new Blob([csvBytes], { type: 'text/csv' }), basename(options.csvPath));
  form.set('support_platform', SUPPORT_PLATFORM_VALUES[options.platform]);
  form.set('company_name', options.companyName);
  form.set('contact_email', options.contactEmail);

  const submitUrl = `${envStatus.baseUrl}${SUBMIT_PATH}`;
  const submitResponse = await fetchImpl(submitUrl, {
    method: 'POST',
    headers: authHeaders(envStatus.jwt),
    body: form,
    cache: 'no-store',
  });
  if (!submitResponse.ok) {
    return {
      ok: false,
      error: `ATLAS submit failed with HTTP ${submitResponse.status}.`,
      stage: 'submit',
      apiCalls: true,
      mutations: true,
    };
  }

  const requestId = parseSubmitPayload(await jsonOrNull(submitResponse));
  if (!requestId) {
    return {
      ok: false,
      error: 'ATLAS submit response did not include a valid request_id.',
      stage: 'submit',
      apiCalls: true,
      mutations: true,
    };
  }

  const snapshotUrl = `${envStatus.baseUrl}/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/snapshot`;
  const snapshotResponse = await fetchImpl(snapshotUrl, {
    headers: authHeaders(envStatus.jwt),
    cache: 'no-store',
  });
  if (!snapshotResponse.ok) {
    return {
      ok: false,
      error: `ATLAS snapshot fetch failed with HTTP ${snapshotResponse.status}.`,
      stage: 'snapshot',
      requestId,
      apiCalls: true,
      mutations: true,
    };
  }

  const snapshot = parseSnapshotPayload(await jsonOrNull(snapshotResponse));
  if (!snapshot) {
    return {
      ok: false,
      error: 'ATLAS snapshot response shape was rejected.',
      stage: 'snapshot',
      requestId,
      apiCalls: true,
      mutations: true,
    };
  }

  const artifactUrl = `${envStatus.baseUrl}/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/artifact`;
  const artifactResponse = await fetchImpl(artifactUrl, {
    headers: authHeaders(envStatus.jwt),
    cache: 'no-store',
  });
  if (artifactResponse.status !== 403) {
    return {
      ok: false,
      error: `Expected locked artifact HTTP 403, got HTTP ${artifactResponse.status}.`,
      stage: 'artifact',
      requestId,
      apiCalls: true,
      mutations: true,
    };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_LIVE_SUBMIT_SMOKE',
    apiCalls: true,
    mutations: true,
    checkedAt: now(),
    requestId,
    resultsUrl: `${siteUrl}${RESULTS_PATH}/${encodeURIComponent(requestId)}`,
    snapshot,
    artifactStatus: 'locked',
  };
}

async function main() {
  await loadLocalEnv();
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

  const missingOptions = requiredOptions(parsed);
  if (missingOptions.length > 0) {
    fail('Deflection live submit smoke is missing required options.', outputJson, {
      missing: missingOptions,
      apiCalls: false,
      mutations: false,
    });
  }

  const result = await runDeflectionLiveSubmitSmoke({
    csvPath: parsed.values.get('--csv'),
    companyName: parsed.values.get('--company').trim(),
    contactEmail: parsed.values.get('--email').trim(),
    platform: parsed.values.get('--platform').trim(),
  });

  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) {
    fail(result.error, outputJson, result);
  }

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection live submit smoke passed.');
  console.log(`Request id: ${result.requestId}`);
  console.log(`Results URL: ${result.resultsUrl}`);
  console.log(`Snapshot questions: ${result.snapshot.generated}`);
  console.log(`Artifact: ${result.artifactStatus}`);
  if (artifactPath) {
    console.log(`Smoke artifact: ${artifactPath}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, {
      apiCalls: false,
      mutations: false,
    });
  });
}
