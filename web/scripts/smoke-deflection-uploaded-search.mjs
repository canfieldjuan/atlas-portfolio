import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const DEFAULT_BASE_URL = 'https://juancanfield.com';
const SEARCH_PATH = '/api/demo/deflection-search';

function printUsage() {
  console.log(`Deflection uploaded search smoke

Usage:
  npm --prefix web run smoke:deflection-uploaded-search -- \\
    --request-id content-ops-... \\
    --query "export reports"

Options:
  --base-url <url>       Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --json                 Print machine-readable JSON
  --output <path>        Write the smoke artifact JSON

Safety:
  This smoke posts a customer query to the deployed portfolio search proxy. It
  does not call ATLAS directly, submit a CSV, create Checkout, or unlock a
  report. Output includes shape/count metadata only, not matched answer text.`);
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

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isTermMapping(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (
    typeof value.customer_term === 'string' &&
    typeof value.documentation_term === 'string' &&
    typeof value.suggestion === 'string'
  );
}

function summarizeRenderableItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (
    typeof value.topic !== 'string' ||
    typeof value.question !== 'string' ||
    typeof value.answer !== 'string' ||
    typeof value.when_to_contact_support !== 'string' ||
    typeof value.answer_evidence_status !== 'string' ||
    typeof value.ticket_count !== 'number' ||
    typeof value.opportunity_score !== 'number' ||
    !isStringArray(value.steps) ||
    !isStringArray(value.action_items) ||
    !isStringArray(value.source_ids) ||
    !isStringArray(value.source_labels) ||
    !Array.isArray(value.term_mappings) ||
    !value.term_mappings.every(isTermMapping)
  ) {
    return null;
  }
  return {
    topicLength: value.topic.length,
    questionLength: value.question.length,
    answerLength: value.answer.length,
    ticketCount: value.ticket_count,
    opportunityScore: value.opportunity_score,
    answerEvidenceStatus: value.answer_evidence_status,
    stepsCount: value.steps.length,
    actionItemsCount: value.action_items.length,
    sourceIdsCount: value.source_ids.length,
    sourceLabelsCount: value.source_labels.length,
    termMappingsCount: value.term_mappings.length,
  };
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function failure(error, fields = {}) {
  return { ok: false, error, apiCalls: false, mutations: false, ...fields };
}

export async function runDeflectionUploadedSearchSmoke(options, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const requestId = String(options.requestId || '').trim();
  const query = String(options.query || '').trim();
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  if (!REQUEST_ID_RE.test(requestId)) {
    return failure('Uploaded search smoke request id is invalid.', { requestId });
  }
  if (!baseUrl) {
    return failure('Uploaded search smoke base URL is invalid.', { requestId });
  }
  if (!query) {
    return failure('Uploaded search smoke query is required.', { requestId });
  }

  const url = `${baseUrl}${SEARCH_PATH}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, q: query }),
      cache: 'no-store',
    });
  } catch {
    return failure('Uploaded search route failed before an HTTP response.', {
      stage: 'search',
      apiCalls: true,
      requestId,
      url,
    });
  }

  const body = await jsonOrNull(response);
  if (!response.ok) {
    return failure(`Uploaded search route failed with HTTP ${response.status}.`, {
      stage: 'search',
      apiCalls: true,
      requestId,
      url,
    });
  }
  if (!body || body.source !== 'atlas') {
    return failure('Uploaded search route did not return the Atlas source envelope.', {
      stage: 'envelope',
      apiCalls: true,
      requestId,
      url,
    });
  }
  if (body.match === null) {
    return failure('Uploaded search route returned no match.', {
      stage: 'match',
      apiCalls: true,
      requestId,
      url,
    });
  }

  const item = summarizeRenderableItem(body.match);
  if (!item) {
    return failure('Uploaded search route returned a non-renderable match item.', {
      stage: 'shape',
      apiCalls: true,
      requestId,
      url,
    });
  }

  return {
    ok: true,
    mode: 'DEFLECTION_UPLOADED_SEARCH_SMOKE',
    status: 'atlas_match_renderable',
    apiCalls: true,
    mutations: false,
    checkedAt: now(),
    requestId,
    url,
    queryLength: query.length,
    match: item,
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
    fail('Refusing to continue without --output <path>.', outputJson, { apiCalls: false });
  }
  if (isBareFlag(parsed, '--request-id') || !parsed.values.get('--request-id')?.trim()) {
    fail('Deflection uploaded search smoke is missing --request-id.', outputJson, { apiCalls: false });
  }
  if (isBareFlag(parsed, '--query') || !parsed.values.get('--query')?.trim()) {
    fail('Deflection uploaded search smoke is missing --query.', outputJson, { apiCalls: false });
  }
  if (isBareFlag(parsed, '--base-url')) {
    fail('Refusing to continue without --base-url <url>.', outputJson, { apiCalls: false });
  }

  const result = await runDeflectionUploadedSearchSmoke({
    requestId: parsed.values.get('--request-id'),
    query: parsed.values.get('--query'),
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

  console.log('Deflection uploaded search smoke passed.');
  console.log(`Request id: ${result.requestId}`);
  console.log(`Route: ${result.url}`);
  console.log(`Status: ${result.status}`);
  if (result.match) {
    console.log(`Renderable match: ${result.match.stepsCount} steps, ${result.match.sourceIdsCount} source ids`);
  }
  if (artifactPath) console.log(`Smoke artifact: ${artifactPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, { apiCalls: false });
  });
}
