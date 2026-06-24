import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-report-model-'));
const sourceUrl = new URL('../src/lib/atlas-deflection-client.ts', import.meta.url);
const routeUrl = new URL(
  '../src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx',
  import.meta.url,
);
const statusRouteUrl = new URL('../src/app/api/deflection-report-status/route.ts', import.meta.url);
const modelPageUrl = new URL('../src/components/landing/DeflectionReportModelPage.tsx', import.meta.url);
const compiledPath = join(testDir, 'atlas-deflection-client.cjs');
const statusRouteCompiledPath = join(testDir, 'deflection-report-status-route.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
const nextStubDir = join(testDir, 'node_modules', 'next');
const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

let fetchCalls = [];
let fetchPayload = minimalModel();
let fetchStatus = 200;
let consoleErrors = [];

const HOSTED_FIELD_SHAPES = {
  already_covered_still_recurring: {
    items: 'object_array',
    top_item_count: 'scalar',
  },
  'already_covered_still_recurring.items': {
    rank: 'scalar',
    question: 'scalar',
    status: 'scalar',
    owner_lane: 'scalar',
    confidence: 'scalar',
    recommended_action: 'scalar',
    ticket_count: 'scalar',
    estimated_support_cost: 'scalar',
    priority_score: 'scalar',
    priority_drivers: 'scalar_array',
    csat_signal: 'object',
  },
  'already_covered_still_recurring.items.csat_signal': {
    status: 'scalar',
    csat_present_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    numeric_average: 'scalar',
  },
  backlog_table: {
    items: 'object_array',
    total_item_count: 'scalar',
    default_limit: 'scalar',
  },
  'backlog_table.items': {
    rank: 'scalar',
    question: 'scalar',
    status: 'scalar',
    owner_lane: 'scalar',
    confidence: 'scalar',
    recommended_action: 'scalar',
    ticket_count: 'scalar',
    estimated_support_cost: 'scalar',
    priority_score: 'scalar',
    priority_drivers: 'scalar_array',
    csat_signal: 'object',
  },
  'backlog_table.items.csat_signal': {
    status: 'scalar',
    csat_present_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    numeric_average: 'scalar',
  },
  drafted_resolutions: {
    items: 'object_array',
    top_item_count: 'scalar',
  },
  'drafted_resolutions.items': {
    rank: 'scalar',
    question: 'scalar',
    status: 'scalar',
    owner_lane: 'scalar',
    confidence: 'scalar',
    recommended_action: 'scalar',
    ticket_count: 'scalar',
    estimated_support_cost: 'scalar',
    priority_score: 'scalar',
    priority_drivers: 'scalar_array',
    csat_signal: 'object',
  },
  'drafted_resolutions.items.csat_signal': {
    status: 'scalar',
    csat_present_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    numeric_average: 'scalar',
  },
  outcome_diagnostics: {
    outcome_diagnostic_ticket_count: 'scalar',
    outcome_risk_ticket_count: 'scalar',
    reopened_ticket_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    rows: 'object_array',
  },
  'outcome_diagnostics.rows': {
    question: 'scalar',
    status_mix: 'scalar',
    reopened_ticket_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    guidance: 'scalar',
  },
  priority_fix_queue: {
    items: 'object_array',
    status_counts: 'record',
    result_page_limit: 'scalar',
    pdf_limit: 'scalar',
    backlog_limit: 'scalar',
    support_cost_basis: 'object',
  },
  'priority_fix_queue.items': {
    rank: 'scalar',
    question: 'scalar',
    status: 'scalar',
    owner_lane: 'scalar',
    confidence: 'scalar',
    recommended_action: 'scalar',
    ticket_count: 'scalar',
    estimated_support_cost: 'scalar',
    priority_score: 'scalar',
    priority_drivers: 'scalar_array',
    csat_signal: 'object',
  },
  'priority_fix_queue.items.csat_signal': {
    status: 'scalar',
    csat_present_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    numeric_average: 'scalar',
  },
  'priority_fix_queue.support_cost_basis': {
    status: 'scalar',
  },
  question_details: {
    rows: 'object_array',
  },
  'question_details.rows': {
    rank: 'scalar',
    question: 'scalar',
    customer_wording: 'scalar',
    topic: 'scalar',
    ticket_count: 'scalar',
    weighted_frequency: 'scalar',
    source_count: 'scalar',
    estimated_support_cost: 'scalar',
    answer_status: 'scalar',
    answer_evidence_status: 'scalar',
    resolution_evidence_scope: 'scalar',
    answer_linkage: 'scalar',
    answer: 'scalar',
    steps: 'scalar_array',
    term_mappings: 'object_array',
  },
  'question_details.rows.term_mappings': {
    customer_term: 'scalar',
    documentation_term: 'scalar',
    suggestion: 'scalar',
    source_id_count: 'scalar',
  },
  ranked_questions: {
    rows: 'object_array',
  },
  'ranked_questions.rows': {
    rank: 'scalar',
    question: 'scalar',
    ticket_count: 'scalar',
    weighted_frequency: 'scalar',
    customer_wording: 'scalar',
    estimated_support_cost: 'scalar',
    opportunity_score: 'scalar',
    answer_status: 'scalar',
    source_proof: 'scalar',
  },
  seo_targets: {
    phrases: 'scalar_array',
    total_phrase_count: 'scalar',
    displayed_phrase_count: 'scalar',
    omitted_phrase_count: 'scalar',
    limit: 'scalar',
  },
  support_tax: {
    repeat_ticket_count: 'scalar',
    non_repeat_ticket_count: 'scalar',
    generated_question_count: 'scalar',
    assisted_contact_cost: 'scalar',
    estimated_support_cost: 'scalar',
    source_date_window: 'object',
    drafted_answer_count: 'scalar',
    no_proven_answer_count: 'scalar',
    ticket_source_count: 'scalar',
    annualized_support_cost: 'scalar',
    annualized_run_rate_support_cost: 'scalar',
  },
  'support_tax.source_date_window': {
    source_date_start: 'scalar',
    source_date_end: 'scalar',
    source_window_days: 'scalar',
  },
  suppressed_repeat_review_queue: {
    items: 'object_array',
    total_item_count: 'scalar',
    default_limit: 'scalar',
    reason_counts: 'record',
  },
  'suppressed_repeat_review_queue.items': {
    rank: 'scalar',
    question: 'scalar',
    status: 'scalar',
    owner_lane: 'scalar',
    confidence: 'scalar',
    recommended_action: 'scalar',
    ticket_count: 'scalar',
    estimated_support_cost: 'scalar',
    priority_score: 'scalar',
    priority_drivers: 'scalar_array',
    csat_signal: 'object',
    review_key: 'scalar',
    suppression_reason: 'scalar',
    suppression_reason_label: 'scalar',
  },
  'suppressed_repeat_review_queue.items.csat_signal': {
    status: 'scalar',
    csat_present_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    numeric_average: 'scalar',
  },
  top_unresolved_repeats: {
    items: 'object_array',
    top_item_count: 'scalar',
    support_cost_basis: 'object',
  },
  'top_unresolved_repeats.items': {
    rank: 'scalar',
    question: 'scalar',
    status: 'scalar',
    owner_lane: 'scalar',
    confidence: 'scalar',
    recommended_action: 'scalar',
    ticket_count: 'scalar',
    estimated_support_cost: 'scalar',
    priority_score: 'scalar',
    priority_drivers: 'scalar_array',
    csat_signal: 'object',
  },
  'top_unresolved_repeats.items.csat_signal': {
    status: 'scalar',
    csat_present_count: 'scalar',
    negative_csat_ticket_count: 'scalar',
    numeric_average: 'scalar',
  },
  'top_unresolved_repeats.support_cost_basis': {
    status: 'scalar',
  },
};

function resetStatusRoute({
  modelResult = { ok: false, reason: 'not_found' },
  artifactResult = { ok: false, reason: 'not_found' },
  rateLimit = { ok: true },
} = {}) {
  globalThis.__atlasDeflectionStatusRoute = {
    modelResult,
    artifactResult,
    rateLimit,
    calls: [],
  };
  return globalThis.__atlasDeflectionStatusRoute;
}

function resetEnv(values = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function resetCalls() {
  fetchCalls = [];
  fetchPayload = minimalModel();
  fetchStatus = 200;
  consoleErrors = [];
}

function supportTaxSection(dataOverrides = {}) {
  return {
    id: 'support_tax',
    title: 'Support Tax Confirmation',
    priority: 10,
    surfaces: ['web', 'pdf', 'email_summary', 'markdown'],
    default_limit: null,
    required_data: [
      'repeat_ticket_count',
      'non_repeat_ticket_count',
      'generated_question_count',
      'assisted_contact_cost',
      'estimated_support_cost',
      'source_date_window',
      'drafted_answer_count',
      'no_proven_answer_count',
      'ticket_source_count',
    ],
    snapshot_safe_fields: [
      'repeat_ticket_count',
      'non_repeat_ticket_count',
      'generated_question_count',
      'drafted_answer_count',
      'no_proven_answer_count',
      'ticket_source_count',
      'source_date_window',
    ],
    data: {
      repeat_ticket_count: 7,
      non_repeat_ticket_count: 3,
      generated_question_count: 4,
      assisted_contact_cost: 13.5,
      estimated_support_cost: 94.5,
      annualized_support_cost: 2299.5,
      source_date_window: {
        source_date_start: '2026-05-01',
        source_date_end: '2026-05-15',
        source_window_days: 15,
      },
      drafted_answer_count: 2,
      no_proven_answer_count: 1,
      ticket_source_count: 10,
      ...dataOverrides,
    },
  };
}

function exportOnlySection(overrides = {}) {
  return {
    id: 'complete_evidence',
    title: 'Complete Evidence',
    priority: 90,
    surfaces: ['export'],
    default_limit: null,
    required_data: ['evidence_row_count'],
    snapshot_safe_fields: [],
    data: { evidence_row_count: 42 },
    ...overrides,
  };
}

function actionItem(overrides = {}) {
  return {
    rank: 2,
    question: 'How do I enable SSO for my team?',
    status: 'Needs answer',
    owner_lane: 'Help Center',
    fix_type: 'create_missing_answer',
    confidence: 'medium',
    recommended_action: 'Write and approve the missing answer.',
    ticket_count: 2,
    estimated_support_cost: 27,
    opportunity_score: 2,
    priority_score: 84,
    priority_drivers: ['repeat_volume', 'missing_answer', 'benchmark_cost'],
    csat_signal: {
      status: 'insufficient_data',
      csat_present_count: 0,
      negative_csat_ticket_count: 0,
      numeric_average: null,
    },
    ...overrides,
  };
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHostedScalar(value) {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function projectHostedFields(data, ownerPath) {
  const projected = {};
  for (const [field, shape] of Object.entries(HOSTED_FIELD_SHAPES[ownerPath] ?? {})) {
    if (!(field in data)) continue;
    const value = data[field];
    const nestedPath = `${ownerPath}.${field}`;
    if (shape === 'scalar' && isHostedScalar(value)) {
      projected[field] = value;
    } else if (shape === 'scalar_array' && Array.isArray(value) && value.every(isHostedScalar)) {
      projected[field] = value.slice();
    } else if (shape === 'record' && isRecord(value)) {
      projected[field] = Object.fromEntries(
        Object.entries(value).filter(([, entryValue]) => isHostedScalar(entryValue)),
      );
    } else if (shape === 'object') {
      if (value === null) {
        projected[field] = null;
      } else if (isRecord(value)) {
        projected[field] = projectHostedFields(value, nestedPath);
      }
    } else if (shape === 'object_array' && Array.isArray(value)) {
      projected[field] = value
        .filter(isRecord)
        .map((item) => projectHostedFields(item, nestedPath));
    }
  }
  return projected;
}

function projectedSection(section) {
  return {
    ...section,
    data: projectHostedFields(section.data, section.id),
  };
}

function priorityFixQueueSection(overrides = {}) {
  return {
    id: 'priority_fix_queue',
    title: 'Priority Fix Queue',
    priority: 35,
    surfaces: ['web', 'pdf', 'email_summary'],
    default_limit: 3,
    required_data: [
      'items',
      'status_counts',
      'result_page_limit',
      'pdf_limit',
      'backlog_limit',
      'support_cost_basis',
    ],
    snapshot_safe_fields: [],
    data: {
      result_page_limit: 3,
      pdf_limit: 10,
      backlog_limit: 25,
      status_counts: { 'Needs answer': 1 },
      support_cost_basis: {
        assisted_contact_cost: 13.5,
        formula: 'ticket_count * assisted_contact_cost',
        source: 'default_assisted_contact_benchmark',
        status: 'benchmark_only',
      },
      items: [actionItem()],
    },
    ...overrides,
  };
}

function topUnresolvedRepeatsSection(overrides = {}) {
  return {
    id: 'top_unresolved_repeats',
    title: 'Top Unresolved Repeats',
    priority: 36,
    surfaces: ['web', 'pdf'],
    default_limit: 3,
    required_data: ['items', 'top_item_count', 'result_page_limit', 'pdf_limit', 'support_cost_basis'],
    snapshot_safe_fields: ['items.rank', 'items.question', 'items.ticket_count'],
    data: {
      top_item_count: 1,
      result_page_limit: 3,
      pdf_limit: 10,
      support_cost_basis: {
        assisted_contact_cost: 13.5,
        formula: 'ticket_count * assisted_contact_cost',
        source: 'default_assisted_contact_benchmark',
        status: 'benchmark_only',
      },
      items: [actionItem({ rank: 1 })],
    },
    ...overrides,
  };
}

function draftedResolutionsSection(overrides = {}) {
  return {
    id: 'drafted_resolutions',
    title: 'Drafted Resolutions',
    priority: 37,
    surfaces: ['web', 'pdf'],
    default_limit: 3,
    required_data: ['items', 'top_item_count', 'result_page_limit', 'pdf_limit'],
    snapshot_safe_fields: [],
    data: {
      top_item_count: 1,
      result_page_limit: 3,
      pdf_limit: 10,
      items: [
        actionItem({
          rank: 1,
          status: 'Draft ready',
          recommended_action: 'Review the drafted answer and publish it to the help center.',
        }),
      ],
    },
    ...overrides,
  };
}

function coveredRecurringSection(overrides = {}) {
  return {
    id: 'already_covered_still_recurring',
    title: 'Already Covered but Still Recurring',
    priority: 38,
    surfaces: ['web', 'pdf'],
    default_limit: 3,
    required_data: ['items', 'top_item_count', 'result_page_limit', 'pdf_limit'],
    snapshot_safe_fields: [],
    data: {
      top_item_count: 1,
      result_page_limit: 3,
      pdf_limit: 10,
      items: [
        actionItem({
          rank: 1,
          status: 'Already covered but still recurring',
          recommended_action: 'Improve discoverability, search wording, macro use, or answer quality.',
          priority_drivers: ['repeat_volume', 'already_covered_recurring', 'negative_csat'],
          csat_signal: {
            status: 'present',
            csat_present_count: 4,
            negative_csat_ticket_count: 2,
            numeric_average: 2,
          },
        }),
      ],
    },
    ...overrides,
  };
}

function backlogTableSection(overrides = {}) {
  return {
    id: 'backlog_table',
    title: 'Backlog Table',
    priority: 39,
    surfaces: ['web', 'pdf', 'export'],
    default_limit: 25,
    required_data: ['items', 'total_item_count', 'default_limit'],
    snapshot_safe_fields: [],
    data: {
      total_item_count: 2,
      default_limit: 25,
      items: [
        actionItem({ rank: 1 }),
        actionItem({
          rank: 2,
          question: 'Why did my invoice retry?',
          status: 'Needs review',
          recommended_action: 'Review billing evidence before publishing customer guidance.',
          ticket_count: 3,
          estimated_support_cost: 40.5,
          priority_score: 76,
        }),
      ],
    },
    ...overrides,
  };
}

function suppressedRepeatReviewQueueSection(overrides = {}) {
  return {
    id: 'suppressed_repeat_review_queue',
    title: 'Suppressed Repeat Review Queue',
    priority: 41,
    surfaces: ['web', 'export'],
    default_limit: 25,
    required_data: ['items', 'total_item_count', 'default_limit', 'reason_counts'],
    snapshot_safe_fields: [],
    data: {
      total_item_count: 1,
      default_limit: 25,
      reason_counts: { too_low_volume: 1 },
      items: [
        actionItem({
          rank: 4,
          question: 'Can I change invoice contacts for a closed invoice?',
          status: 'Review before promotion',
          owner_lane: 'Operations',
          recommended_action: 'Review whether this low-volume repeat belongs in the action queue.',
          ticket_count: 2,
          estimated_support_cost: 27,
          priority_score: 35,
          priority_drivers: ['suppressed_repeat', 'too_low_volume'],
          review_key: 'review_0123456789abcdef01234567',
          suppression_reason: 'too_low_volume',
          suppression_reason_label: 'Too low volume',
        }),
      ],
    },
    ...overrides,
  };
}

function rankedQuestionsSection(overrides = {}) {
  return {
    id: 'ranked_questions',
    title: 'Ranked Questions',
    priority: 30,
    surfaces: ['web', 'pdf'],
    default_limit: 25,
    required_data: ['rows'],
    snapshot_safe_fields: [
      'rows.rank',
      'rows.question',
      'rows.ticket_count',
      'rows.weighted_frequency',
      'rows.customer_wording',
    ],
    data: {
      rows: [
        {
          rank: 1,
          question: 'How do I enable SSO for my team?',
          ticket_count: 7,
          weighted_frequency: 7,
          customer_wording: 'enable SSO for my team',
          estimated_support_cost: 94.5,
          opportunity_score: 88,
          answer_status: 'Needs answer',
          source_proof: '7 source tickets',
        },
      ],
    },
    ...overrides,
  };
}

function outcomeDiagnosticsSection(overrides = {}) {
  return {
    id: 'outcome_diagnostics',
    title: 'Outcome Diagnostics',
    priority: 70,
    surfaces: ['web', 'pdf'],
    default_limit: 25,
    required_data: [
      'outcome_diagnostic_ticket_count',
      'outcome_risk_ticket_count',
      'reopened_ticket_count',
      'negative_csat_ticket_count',
      'rows',
    ],
    snapshot_safe_fields: [],
    data: {
      outcome_diagnostic_ticket_count: 1,
      outcome_risk_ticket_count: 1,
      reopened_ticket_count: 1,
      negative_csat_ticket_count: 0,
      rows: [
        {
          question: 'How do I enable SSO for my team?',
          status_mix: 'reopened: 1',
          reopened_ticket_count: 1,
          negative_csat_ticket_count: 0,
          guidance: 'Review reopened outcomes before publishing.',
        },
      ],
    },
    ...overrides,
  };
}

function questionDetailsSection(overrides = {}) {
  return {
    id: 'question_details',
    title: 'Question Details',
    priority: 80,
    surfaces: ['web', 'export'],
    default_limit: 10,
    required_data: ['rows'],
    snapshot_safe_fields: [
      'rows.rank',
      'rows.question',
      'rows.answer_evidence_status',
      'rows.resolution_evidence_scope',
      'rows.weighted_frequency',
      'rows.source_count',
    ],
    data: {
      rows: [
        {
          rank: 1,
          question: 'How do I enable SSO for my team?',
          customer_wording: 'enable SSO',
          topic: 'Authentication',
          ticket_count: 7,
          weighted_frequency: 7,
          source_count: 4,
          estimated_support_cost: 94.5,
          answer_status: 'Draft ready',
          answer_evidence_status: 'resolution_evidence',
          resolution_evidence_scope: 'scoped',
          answer_linkage: 'publishable_answer',
          answer: 'Open Settings, then SSO.',
          steps: ['Open Settings', 'Choose SSO'],
          term_mappings: [
            {
              customer_term: 'SSO',
              documentation_term: 'single sign-on',
              suggestion: 'Use both terms in the help article.',
              source_id_count: 4,
              source_ids: ['zendesk-ticket-private'],
            },
          ],
          source_ids: ['zendesk-ticket-private'],
          evidence_quotes: ['raw customer quote'],
          outcome_diagnostics: { raw: 'private diagnostic payload' },
        },
      ],
    },
    ...overrides,
  };
}

function minimalModel(overrides = {}) {
  return {
    schema_version: 'deflection.v1',
    title: 'Support Ticket Deflection Report',
    summary: { generated: 1 },
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      topUnresolvedRepeatsSection(),
      draftedResolutionsSection(),
      coveredRecurringSection(),
      backlogTableSection(),
      suppressedRepeatReviewQueueSection(),
    ],
    ...overrides,
  };
}

function projectedModel(overrides = {}) {
  const model = minimalModel(overrides);
  return {
    ...model,
    sections: model.sections
      .filter((section) => section.surfaces.includes('web'))
      .map(projectedSection),
  };
}

function extractPartnerReportModelCopyBranch(source) {
  const partnerMarker = 'if (priceVariant.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID) {';
  const partnerStart = source.indexOf(partnerMarker);
  assert.notEqual(partnerStart, -1, 'report model page should have a partner copy branch');

  const publicMarker = "badge: 'FULL RESOLUTION AUDIT'";
  const publicStart = source.indexOf(publicMarker, partnerStart);
  assert.notEqual(publicStart, -1, 'report model page should have a public copy branch after partner copy');

  return source.slice(partnerStart, publicStart);
}

globalThis.fetch = async (url, init) => {
  fetchCalls.push({
    url: String(url),
    headers: init?.headers ?? {},
    cache: init?.cache,
  });
  return Response.json(fetchPayload, { status: fetchStatus });
};
console.error = (...args) => {
  consoleErrors.push(args.join(' '));
};

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(blobStubDir, { recursive: true });
  await mkdir(nextStubDir, { recursive: true });
  await writeFile(
    join(libStubDir, 'deflection-snapshot.js'),
    "exports.deflectionSnapshotPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/snapshot`;\n",
  );
  await writeFile(
    join(libStubDir, 'deflection-report-contract.js'),
    [
      "exports.deflectionArtifactPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/artifact`;",
      "exports.deflectionReportModelPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/report-model`;",
      `exports.DEFLECTION_REPORT_HOSTED_FIELD_SHAPES = ${JSON.stringify(HOSTED_FIELD_SHAPES)};`,
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'gap-report-intake.js'),
    "exports.gapReportBlobToken = () => 'vercel_blob_rw_unit'; exports.gapReportBlobTokens = () => ['vercel_blob_rw_unit'];\n",
  );
  await writeFile(
    join(libStubDir, 'atlas-deflection-client.js'),
    [
      "exports.fetchDeflectionReportModel = async (id) => {",
      "  const state = globalThis.__atlasDeflectionStatusRoute;",
      "  state.calls.push({ kind: 'model', id });",
      "  return state.modelResult;",
      '};',
      "exports.fetchDeflectionArtifact = async (id) => {",
      "  const state = globalThis.__atlasDeflectionStatusRoute;",
      "  state.calls.push({ kind: 'artifact', id });",
      "  return state.artifactResult;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'deflection-rate-limit.js'),
    [
      "exports.consumeDeflectionRateLimit = (headers, requestId, config) => {",
      "  const state = globalThis.__atlasDeflectionStatusRoute;",
      "  state.calls.push({ kind: 'rateLimit', requestId, scope: config.scope });",
      "  return state.rateLimit;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(nextStubDir, 'server.js'),
    "exports.NextResponse = { json: (body, init) => Response.json(body, init) };\n",
  );
  await writeFile(join(blobStubDir, 'index.js'), "exports.get = async () => ({ statusCode: 404 });\n");

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);
  const statusRouteSource = await readFile(statusRouteUrl, 'utf8');
  const compiledStatusRoute = ts.transpileModule(statusRouteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(statusRouteCompiledPath, compiledStatusRoute.outputText);

  const require = createRequire(compiledPath);
  const { fetchDeflectionReportModel } = require(compiledPath);
  const { GET: reportStatusGET } = require(statusRouteCompiledPath);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com/',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel(),
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/report-model',
  );
  assert.equal(fetchCalls[0].headers.Authorization, 'Bearer service_token_unit');
  assert.equal(fetchCalls[0].cache, 'no-store');

  resetCalls();
  fetchStatus = 403;
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'locked',
  });

  resetCalls();
  fetchStatus = 404;
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'not_found',
  });

  resetCalls();
  fetchStatus = 200;
  fetchPayload = minimalModel({ schema_version: 'deflection.v2' });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });
  assert.ok(
    consoleErrors.some((entry) => entry.includes('deflection report model fetch: upstream shape rejected')),
    'unsupported schema is logged generically',
  );

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      {
        id: 'support_tax',
        title: 'Support Tax Confirmation',
        priority: 10,
        surfaces: ['web'],
        default_limit: null,
        required_data: ['repeat_ticket_count'],
        data: {},
      },
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({ sections: [supportTaxSection({ repeat_ticket_count: '7' })] });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          result_page_limit: 1.9,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      exportOnlySection({
        required_data: ['evidence_row_count', 'source_id_count'],
        data: { evidence_row_count: 42 },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxSection(), priorityFixQueueSection()] }),
  });

  resetCalls();
  const validPriorityQueueSection = priorityFixQueueSection();
  fetchPayload = minimalModel({
    sections: [supportTaxSection(), validPriorityQueueSection],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxSection(), validPriorityQueueSection] }),
  });

  resetCalls();
  const zeroLimitPriorityQueueSection = priorityFixQueueSection({
    data: {
      ...priorityFixQueueSection().data,
      result_page_limit: 0,
    },
  });
  fetchPayload = minimalModel({
    sections: [supportTaxSection(), zeroLimitPriorityQueueSection],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxSection(), zeroLimitPriorityQueueSection] }),
  });

  resetCalls();
  const supportTaxWithoutAnnualized = supportTaxSection();
  delete supportTaxWithoutAnnualized.data.annualized_support_cost;
  delete supportTaxWithoutAnnualized.data.annualized_run_rate_support_cost;
  fetchPayload = minimalModel({
    sections: [supportTaxWithoutAnnualized, priorityFixQueueSection()],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxWithoutAnnualized, priorityFixQueueSection()] }),
  });

  resetCalls();
  const supportTaxWithUnknownWindow = supportTaxSection({
    source_date_window: {
      source_date_start: null,
      source_date_end: null,
      source_window_days: null,
    },
  });
  fetchPayload = minimalModel({
    sections: [supportTaxWithUnknownWindow, priorityFixQueueSection()],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxWithUnknownWindow, priorityFixQueueSection()] }),
  });

  resetCalls();
  const rankedQuestions = rankedQuestionsSection();
  fetchPayload = minimalModel({
    sections: [supportTaxSection(), priorityFixQueueSection(), rankedQuestions],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxSection(), priorityFixQueueSection(), rankedQuestions] }),
  });

  resetCalls();
  const outcomeDiagnostics = outcomeDiagnosticsSection();
  fetchPayload = minimalModel({
    sections: [supportTaxSection(), priorityFixQueueSection(), outcomeDiagnostics],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({ sections: [supportTaxSection(), priorityFixQueueSection(), outcomeDiagnostics] }),
  });

  resetCalls();
  const questionDetails = questionDetailsSection();
  fetchPayload = minimalModel({
    sections: [supportTaxSection(), priorityFixQueueSection(), questionDetails],
  });
  const projectedQuestionDetailsModel = await fetchDeflectionReportModel('content-ops-unit-123');
  assert.equal(projectedQuestionDetailsModel.ok, true);
  const projectedQuestionDetails = projectedQuestionDetailsModel.model.sections.find(
    (section) => section.id === 'question_details',
  );
  assert.ok(projectedQuestionDetails);
  const projectedQuestionRow = projectedQuestionDetails.data.rows[0];
  assert.equal(projectedQuestionRow.source_count, 4);
  assert.equal('source_ids' in projectedQuestionRow, false);
  assert.equal('evidence_quotes' in projectedQuestionRow, false);
  assert.equal('outcome_diagnostics' in projectedQuestionRow, false);
  assert.deepEqual(projectedQuestionRow.term_mappings, [
    {
      customer_term: 'SSO',
      documentation_term: 'single sign-on',
      suggestion: 'Use both terms in the help article.',
      source_id_count: 4,
    },
  ]);

  resetCalls();
  const unsafeActionItem = actionItem({
    recommended_title: 'Unsafe title should not reach page data',
    representative_phrasing: ['My token is raw-customer-phrase'],
    source_ids: ['zendesk-ticket-123'],
    top_evidence: [{ source_id: 'zendesk-ticket-123', quote: 'raw customer evidence quote' }],
  });
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          items: [unsafeActionItem],
        },
      }),
      topUnresolvedRepeatsSection({
        data: {
          ...topUnresolvedRepeatsSection().data,
          items: [unsafeActionItem],
          top_item_count: 1,
        },
      }),
      draftedResolutionsSection({
        data: {
          ...draftedResolutionsSection().data,
          items: [unsafeActionItem],
          top_item_count: 1,
        },
      }),
      coveredRecurringSection({
        data: {
          ...coveredRecurringSection().data,
          items: [unsafeActionItem],
          top_item_count: 1,
        },
      }),
      backlogTableSection({
        data: {
          ...backlogTableSection().data,
          items: [unsafeActionItem],
          total_item_count: 1,
        },
      }),
      suppressedRepeatReviewQueueSection({
        data: {
          ...suppressedRepeatReviewQueueSection().data,
          items: [
            {
              ...unsafeActionItem,
              review_key: 'review_abcdef0123456789abcdef01',
              suppression_reason: 'too_low_volume',
              suppression_reason_label: 'Too low volume',
            },
          ],
          total_item_count: 1,
          reason_counts: { too_low_volume: 1 },
        },
      }),
    ],
  });
  const projectedUnsafeModel = await fetchDeflectionReportModel('content-ops-unit-123');
  assert.equal(projectedUnsafeModel.ok, true);
  for (const section of projectedUnsafeModel.model.sections.filter((section) => (
    section.id === 'priority_fix_queue' ||
    section.id === 'top_unresolved_repeats' ||
    section.id === 'drafted_resolutions' ||
    section.id === 'already_covered_still_recurring' ||
    section.id === 'backlog_table' ||
    section.id === 'suppressed_repeat_review_queue'
  ))) {
    const item = section.data.items[0];
    if (
      section.id === 'top_unresolved_repeats' ||
      section.id === 'drafted_resolutions' ||
      section.id === 'already_covered_still_recurring'
    ) {
      assert.equal('result_page_limit' in section.data, false);
      assert.equal('pdf_limit' in section.data, false);
    }
    assert.equal('recommended_title' in item, false);
    assert.equal('representative_phrasing' in item, false);
    assert.equal('source_ids' in item, false);
    assert.equal('top_evidence' in item, false);
    assert.equal('fix_type' in item, false);
    assert.equal('opportunity_score' in item, false);
    const expectedItemKeys = [
      'confidence',
      'csat_signal',
      'estimated_support_cost',
      'owner_lane',
      'priority_drivers',
      'priority_score',
      'question',
      'rank',
      'recommended_action',
      'status',
      'ticket_count',
    ];
    if (section.id === 'suppressed_repeat_review_queue') {
      expectedItemKeys.push('review_key', 'suppression_reason', 'suppression_reason_label');
      assert.equal(item.review_key, 'review_abcdef0123456789abcdef01');
      assert.equal(item.suppression_reason, 'too_low_volume');
      assert.equal(item.suppression_reason_label, 'Too low volume');
      assert.deepEqual(section.data.reason_counts, { too_low_volume: 1 });
    }
    assert.deepEqual(Object.keys(item).sort(), expectedItemKeys.sort());
  }

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      suppressedRepeatReviewQueueSection({
        data: {
          ...suppressedRepeatReviewQueueSection().data,
          items: [
            {
              ...suppressedRepeatReviewQueueSection().data.items[0],
              review_key: undefined,
            },
          ],
        },
      }),
    ],
  });
  const legacySuppressedQueueModel = await fetchDeflectionReportModel('content-ops-unit-123');
  assert.equal(legacySuppressedQueueModel.ok, true);
  const legacySuppressedQueue = legacySuppressedQueueModel.model.sections.find(
    (section) => section.id === 'suppressed_repeat_review_queue',
  );
  assert.ok(legacySuppressedQueue);
  assert.equal('review_key' in legacySuppressedQueue.data.items[0], false);

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          items: [
            {
              ...priorityFixQueueSection().data.items[0],
              priority_score: '84',
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection({
        source_date_window: {
          source_date_start: '2026-05-01',
          source_date_end: null,
          source_window_days: 15,
        },
      }),
      priorityFixQueueSection(),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: projectedModel({
      sections: [
        supportTaxSection({
          source_date_window: {
            source_date_start: '2026-05-01',
            source_date_end: null,
            source_window_days: 15,
          },
        }),
        priorityFixQueueSection(),
      ],
    }),
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection({
        source_date_window: {
          source_date_start: 17,
          source_date_end: null,
          source_window_days: null,
        },
      }),
      priorityFixQueueSection(),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [supportTaxSection()],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      rankedQuestionsSection({
        data: {
          ...rankedQuestionsSection().data,
          rows: [
            {
              ...rankedQuestionsSection().data.rows[0],
              source_proof: undefined,
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      rankedQuestionsSection({
        data: {
          ...rankedQuestionsSection().data,
          rows: [
            {
              ...rankedQuestionsSection().data.rows[0],
              weighted_frequency: undefined,
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          support_cost_basis: {
            ...priorityFixQueueSection().data.support_cost_basis,
            status: 17,
          },
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      topUnresolvedRepeatsSection({
        data: {
          ...topUnresolvedRepeatsSection().data,
          result_page_limit: undefined,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      draftedResolutionsSection({
        data: {
          ...draftedResolutionsSection().data,
          pdf_limit: undefined,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      coveredRecurringSection({
        data: {
          ...coveredRecurringSection().data,
          result_page_limit: undefined,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          status_counts: { 'Needs answer': '2' },
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          items: [
            {
              ...priorityFixQueueSection().data.items[0],
              rank: 1.9,
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          items: [
            {
              ...priorityFixQueueSection().data.items[0],
              rank: -1,
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection({
        data: {
          ...priorityFixQueueSection().data,
          items: [
            {
              ...priorityFixQueueSection().data.items[0],
              csat_signal: {
                ...priorityFixQueueSection().data.items[0].csat_signal,
                negative_csat_ticket_count: '3',
              },
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      topUnresolvedRepeatsSection({
        data: {
          ...topUnresolvedRepeatsSection().data,
          top_item_count: '1',
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      topUnresolvedRepeatsSection({
        data: {
          ...topUnresolvedRepeatsSection().data,
          top_item_count: 2,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      topUnresolvedRepeatsSection({
        data: {
          ...topUnresolvedRepeatsSection().data,
          items: [actionItem({ priority_score: '84' })],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      topUnresolvedRepeatsSection({
        data: {
          ...topUnresolvedRepeatsSection().data,
          support_cost_basis: {
            ...topUnresolvedRepeatsSection().data.support_cost_basis,
            status: 17,
          },
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      draftedResolutionsSection({
        data: {
          ...draftedResolutionsSection().data,
          top_item_count: '1',
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      draftedResolutionsSection({
        data: {
          ...draftedResolutionsSection().data,
          top_item_count: 2,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      draftedResolutionsSection({
        data: {
          ...draftedResolutionsSection().data,
          items: [actionItem({ priority_score: '84' })],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      coveredRecurringSection({
        data: {
          ...coveredRecurringSection().data,
          top_item_count: '1',
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      coveredRecurringSection({
        data: {
          ...coveredRecurringSection().data,
          top_item_count: 2,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      coveredRecurringSection({
        data: {
          ...coveredRecurringSection().data,
          items: [actionItem({ priority_score: '84' })],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      backlogTableSection({
        data: {
          ...backlogTableSection().data,
          total_item_count: '2',
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      backlogTableSection({
        data: {
          ...backlogTableSection().data,
          total_item_count: 1,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      backlogTableSection({
        data: {
          ...backlogTableSection().data,
          default_limit: '25',
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      backlogTableSection({
        data: {
          ...backlogTableSection().data,
          items: [actionItem({ priority_score: '84' })],
          total_item_count: 1,
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      priorityFixQueueSection(),
      outcomeDiagnosticsSection({
        data: {
          ...outcomeDiagnosticsSection().data,
          rows: [
            {
              ...outcomeDiagnosticsSection().data.rows[0],
              status_mix: { reopened: 1 },
            },
          ],
        },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetEnv({});
  resetCalls();
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'not_configured',
  });
  assert.equal(fetchCalls.length, 0);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  assert.deepEqual(await fetchDeflectionReportModel('../bad'), {
    ok: false,
    reason: 'not_found',
  });
  assert.equal(fetchCalls.length, 0);

  const routeSource = await readFile(routeUrl, 'utf8');
  const modelFetchIndex = routeSource.indexOf('const modelResult = await getReportModel(requestId)');
  const modelPriceVariantIndex = routeSource.indexOf(
    'const priceVariant = await getResultsPriceVariant(requestId, requestedPriceVariant)',
    modelFetchIndex,
  );
  const artifactFetchIndex = routeSource.indexOf("modelResult.reason === 'not_found' ? await getArtifact(requestId) : null");
  const artifactPriceVariantIndex = routeSource.indexOf(
    'const priceVariant = await getResultsPriceVariant(requestId, requestedPriceVariant)',
    artifactFetchIndex,
  );
  const snapshotNotFoundIndex = routeSource.indexOf("if (snapshotState.kind === 'not_found') notFound();");
  const snapshotPriceVariantIndex = routeSource.indexOf(
    'const priceVariant = await getResultsPriceVariant(requestId, requestedPriceVariant)',
    snapshotNotFoundIndex,
  );
  const modelPageRenderIndex = routeSource.indexOf('<DeflectionReportModelPage');
  const artifactPageRenderIndex = routeSource.indexOf('<DeflectionReportArtifactPage');
  assert.ok(modelFetchIndex > -1, 'results route fetches the report model first');
  assert.ok(modelPriceVariantIndex > modelFetchIndex, 'results route resolves paid model price variant after confirming a model exists');
  assert.ok(modelPriceVariantIndex < modelPageRenderIndex, 'results route resolves paid model price variant before paid model render');
  assert.ok(
    snapshotPriceVariantIndex > snapshotNotFoundIndex,
    'results route lets snapshot not-found win before price variant enforcement',
  );
  assert.ok(routeSource.includes('priceVariant={priceVariant}'), 'results route passes price variant to the model page');
  assert.ok(artifactFetchIndex > modelFetchIndex, 'artifact fallback happens after model fetch');
  assert.ok(
    artifactPriceVariantIndex > artifactFetchIndex,
    'results route resolves artifact price variant after confirming an artifact exists',
  );
  assert.ok(
    artifactPriceVariantIndex < artifactPageRenderIndex,
    'results route resolves artifact price variant before artifact render',
  );
  assert.ok(
    routeSource.includes('<DeflectionReportArtifactPage artifact={artifact} priceVariant={priceVariant} />'),
    'results route passes price variant to the artifact page',
  );
  assert.equal(
    routeSource.includes('fetchDeflectionArtifact(requestId);\\n  const model'),
    false,
    'artifact fetch should not precede the model fetch',
  );

  const modelPageSource = await readFile(modelPageUrl, 'utf8');
  const partnerReportModelCopyBranch = extractPartnerReportModelCopyBranch(modelPageSource);
  assert.ok(modelPageSource.includes("section.surfaces.includes('web')"), 'model page filters to web sections');
  assert.ok(modelPageSource.includes('FULL RESOLUTION AUDIT'), 'public paid model page uses Resolution Audit badge copy');
  assert.ok(modelPageSource.includes('Your Resolution Audit is ready.'), 'public paid model page uses Resolution Audit headline copy');
  assert.ok(modelPageSource.includes('Full audit dashboard'), 'public paid model page uses audit dashboard copy');
  assert.ok(partnerReportModelCopyBranch.includes("badge: 'FULL DEFLECTION REPORT'"), 'partner paid model page keeps Deflection Report badge copy');
  assert.ok(partnerReportModelCopyBranch.includes("headline: 'Your Deflection Report is ready.'"), 'partner paid model page keeps Deflection Report headline copy');
  assert.ok(partnerReportModelCopyBranch.includes("dashboardLabel: 'Full report dashboard'"), 'partner paid model page keeps report dashboard copy');
  assert.equal(partnerReportModelCopyBranch.includes('Resolution Audit'), false, 'partner paid model branch should not leak public Resolution Audit copy');
  assert.equal(modelPageSource.includes('MODEL-BACKED REPORT'), false, 'model page should not use the old model-backed report badge');
  assert.equal(modelPageSource.includes('Your Support Tax report is ready.'), false, 'model page should not use the old Support Tax report headline');
  assert.equal(modelPageSource.includes('Paid report dashboard'), false, 'model page should not use the old paid report dashboard label');
  assert.ok(
    modelPageSource.includes('const limit = Math.min(OUTCOME_DIAGNOSTIC_LIMIT, requestedLimit)'),
    'outcome diagnostics clamp upstream limits to the local cap',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(SEO_TARGET_LIMIT, requestedLimit)'),
    'SEO targets clamp upstream limits to the local cap',
  );
  assert.ok(modelPageSource.includes('const diagnostics = allDiagnostics.slice(0, limit)'), 'outcome diagnostics are capped before rendering');
  assert.ok(modelPageSource.includes('Diagnostics capped at'), 'diagnostic cap copy points to the export');
  assert.ok(modelPageSource.includes('complete evidence export'), 'model page points to the complete evidence export');
  assert.ok(modelPageSource.includes("section.id === 'priority_fix_queue'"), 'model page renders priority_fix_queue sections');
  assert.ok(modelPageSource.includes('Priority Fix Queue'), 'model page names the action queue');
  assert.ok(modelPageSource.includes("section.id === 'top_unresolved_repeats'"), 'model page renders top_unresolved_repeats sections');
  assert.ok(modelPageSource.includes('Top Unresolved Repeats'), 'model page names unresolved repeat actions');
  assert.ok(modelPageSource.includes('Content gap'), 'model page frames unresolved repeats as content gaps');
  assert.ok(modelPageSource.includes('data-smoke="topUnresolvedRepeats"'), 'top unresolved repeats keeps a stable smoke marker');
  assert.ok(modelPageSource.includes("section.id === 'drafted_resolutions'"), 'model page renders drafted_resolutions sections');
  assert.ok(modelPageSource.includes('Drafted Resolutions'), 'model page names drafted resolution actions');
  assert.ok(modelPageSource.includes('data-smoke="draftedResolutions"'), 'drafted resolutions keeps a stable smoke marker');
  assert.ok(
    modelPageSource.includes("section.id === 'already_covered_still_recurring'"),
    'model page renders already_covered_still_recurring sections',
  );
  assert.ok(modelPageSource.includes('Already Covered but Still Recurring'), 'model page names covered recurring actions');
  assert.ok(modelPageSource.includes('Product or process gap'), 'model page frames covered recurring rows as product/process gaps');
  assert.ok(modelPageSource.includes('data-smoke="coveredRecurring"'), 'covered recurring keeps a stable smoke marker');
  assert.ok(
    modelPageSource.includes("section.id === 'suppressed_repeat_review_queue'"),
    'model page renders suppressed_repeat_review_queue sections',
  );
  assert.ok(modelPageSource.includes('Suppressed Repeat Review Queue'), 'model page names the suppressed repeat review queue');
  assert.ok(modelPageSource.includes('data-smoke="suppressedRepeatReviewQueue"'), 'suppressed queue keeps a stable smoke marker');
  assert.ok(modelPageSource.includes('Hide reason'), 'suppressed queue exposes the hide reason column');
  assert.ok(modelPageSource.includes("section.id === 'backlog_table'"), 'model page renders backlog_table sections');
  assert.ok(modelPageSource.includes('Backlog Table'), 'model page names the backlog table');
  assert.ok(modelPageSource.includes('data-smoke="backlogTable"'), 'backlog table keeps a stable smoke marker');
  assert.ok(
    modelPageSource.includes('Opportunity is a relative ranking signal: repeat volume weighted by failure-risk signals.'),
    'ranked questions explain opportunity score before the table',
  );
  assert.ok(
    modelPageSource.includes('It is not a dollar figure or percentage.'),
    'ranked questions keep opportunity score out of dollars and percentages',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(PRIORITY_FIX_QUEUE_LIMIT, requestedLimit)'),
    'priority queue clamps the result-page limit locally',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(TOP_UNRESOLVED_REPEATS_LIMIT, requestedLimit)'),
    'top unresolved repeats clamps the result-page limit locally',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(DRAFTED_RESOLUTIONS_LIMIT, requestedLimit)'),
    'drafted resolutions clamp the result-page limit locally',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(COVERED_RECURRING_LIMIT, requestedLimit)'),
    'covered recurring clamps the result-page limit locally',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(BACKLOG_TABLE_LIMIT, requestedLimit)'),
    'backlog table clamps the result-page limit locally',
  );
  assert.ok(
    modelPageSource.includes('nonNegativeIntOrNull(data.result_page_limit) ??'),
    'priority queue preserves explicit zero result-page limits',
  );
  assert.equal(
    modelPageSource.includes('int(data.result_page_limit) ||'),
    false,
    'priority queue must not treat result_page_limit: 0 as missing',
  );
  assert.ok(
    modelPageSource.includes('No priority fixes are shown in this result-page view.'),
    'priority queue renders an empty state when an explicit zero cap selects no rows',
  );
  assert.equal(
    modelPageSource.includes('if (items.length === 0) return null'),
    false,
    'priority queue must keep the section marker visible for explicit zero caps',
  );
  assert.ok(modelPageSource.includes('priority_score'), 'priority queue renders the deterministic score');
  assert.equal(modelPageSource.includes('top_evidence'), false, 'priority queue must not inline evidence snippets in S3A');
  assert.equal(modelPageSource.includes('evidence_quotes'), false, 'model page must not read raw evidence quotes');
  assert.equal(modelPageSource.includes('source_ids'), false, 'model page must not read raw source IDs');
  assert.ok(modelPageSource.includes('int(row.source_count)'), 'model page uses hosted-safe source counts');

  async function readReportStatus(requestId = 'content-ops-unit-123') {
    const response = await reportStatusGET(
      new Request(`https://portfolio.example.com/api/deflection-report-status?requestId=${encodeURIComponent(requestId)}`),
    );
    return {
      status: response.status,
      body: await response.json(),
    };
  }

  let statusState = resetStatusRoute({ modelResult: { ok: true, model: projectedModel() } });
  assert.deepEqual(await readReportStatus(), { status: 200, body: { status: 'unlocked' } });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model']);

  statusState = resetStatusRoute({
    modelResult: { ok: false, reason: 'not_found' },
    artifactResult: { ok: true, artifact: { markdown: '# legacy' } },
  });
  assert.deepEqual(await readReportStatus(), { status: 200, body: { status: 'unlocked' } });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model', 'artifact']);

  statusState = resetStatusRoute({ modelResult: { ok: false, reason: 'locked' } });
  assert.deepEqual(await readReportStatus(), { status: 200, body: { status: 'locked' } });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model']);

  statusState = resetStatusRoute({ modelResult: { ok: false, reason: 'error' } });
  assert.deepEqual(await readReportStatus(), {
    status: 503,
    body: { error: 'Report status unavailable.' },
  });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model']);

  console.log('Deflection report-model result page tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv();
  delete globalThis.__atlasDeflectionStatusRoute;
  await rm(testDir, { recursive: true, force: true });
}
