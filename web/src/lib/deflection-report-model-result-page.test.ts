import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DeflectionPricingTerms,
  DeflectionStandardPricingTerms,
} from '@/lib/atlas-deflection-client';
import {
  DEFLECTION_REPORT_HOSTED_FIELD_SHAPES,
  type DeflectionStructuredReport,
} from '@/lib/deflection-report-contract';

const blobState = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({
  get: blobState.get,
}));

import { GET as reportStatusGET } from '@/app/api/deflection-report-status/route';
import { fetchDeflectionReportModel } from '@/lib/atlas-deflection-client';

type PlainRecord = Record<string, unknown>;
type FetchCall = { url: string; headers: HeadersInit | undefined; cache: RequestCache | undefined };
type FetchResponse = { status: number; payload: unknown };

const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const webRoot = process.cwd();

let fetchCalls: FetchCall[] = [];
let fetchPayload: unknown;
let fetchStatus = 200;
let fetchQueue: FetchResponse[] = [];
let consoleErrors: string[] = [];
let ownerCostCards: (items: PlainRecord[], cardLimit?: number) => PlainRecord[];
let visibleBacklogRows: (section: PlainRecord, rowLimit?: number) => PlainRecord[];

function resetEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function configureAtlasEnv() {
  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com/',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
}

function resetCalls(values: { status?: number; payload?: unknown; queue?: FetchResponse[] } = {}) {
  fetchCalls = [];
  fetchPayload = values.payload ?? minimalModel();
  fetchStatus = values.status ?? 200;
  fetchQueue = values.queue ?? [];
  consoleErrors = [];
  delete globalThis.__atlasDeflectionRateLimitStore;
}

function installFetch() {
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    fetchCalls.push({ url, headers: init.headers, cache: init.cache });
    const queued = fetchQueue.shift();
    return Response.json(queued?.payload ?? fetchPayload, {
      status: queued?.status ?? fetchStatus,
    });
  });
}

function headerValue(headers: HeadersInit | undefined, key: string) {
  return new Headers(headers).get(key);
}

function supportTaxSection(dataOverrides: PlainRecord = {}) {
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

function exportOnlySection(overrides: PlainRecord = {}) {
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

function actionItem(overrides: PlainRecord = {}) {
  return {
    rank: 2,
    question: 'How do I enable SSO for my team?',
    status: 'Needs answer',
    owner_lane: 'Help Center',
    evidence_tier: 'csv_customer_text',
    routing_signals: {
      group: ['Authentication Support'],
      assignee: [],
      tags: ['login', 'mfa'],
      brand: [],
      organization: [],
      product_area: ['Authentication'],
      custom_product_area: [],
    },
    product_gap_summary: 'Repeated authentication friction routes to support.',
    customer_vocabulary: ['enable SSO', 'single sign-on'],
    cost_period: 'batch_upload',
    cost_confidence: 'benchmark_only',
    jira_template: {
      recommended_title: 'How do I enable SSO for my team?',
      question: 'How do I enable SSO for my team?',
      owner_lane: 'Help Center',
      owner_category: 'Content / Support Enablement',
      product_gap_summary: 'Repeated authentication friction routes to support.',
      ticket_count: 2,
      estimated_support_cost: 27,
      cost_period: 'batch_upload',
      cost_confidence: 'benchmark_only',
      evidence_tier: 'csv_customer_text',
      customer_vocabulary: ['enable SSO', 'single sign-on'],
      recommended_action: 'Write and approve the missing answer.',
    },
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

function priorityFixQueueSection(overrides: PlainRecord = {}) {
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

function topUnresolvedRepeatsSection(overrides: PlainRecord = {}) {
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

function draftedResolutionsSection(overrides: PlainRecord = {}) {
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

function coveredRecurringSection(overrides: PlainRecord = {}) {
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

function backlogTableSection(overrides: PlainRecord = {}) {
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

function ownerCostSummaryFixtureSection() {
  const visibleCategoryItems = [
    ['Content / Support Enablement', 'Docs / Authentication', 100, 10],
    ['Product / Support Experience', 'Auth / Product UX', 90, 9],
    ['Product / Support Experience', 'Settings / Product UX', 80, 8],
    ['Support Enablement', 'Support operations', 70, 7],
    ['Operations', 'Billing operations', 60, 6],
    ['Engineering', 'API platform', 50, 5],
    [null, 'Legacy billing topic', 40, 4],
    ['Security', 'SSO security review', 30, 3],
  ].map(([owner_category, owner_lane, estimated_support_cost, ticket_count], index) =>
    actionItem({
      rank: index + 1,
      owner_lane,
      ...(owner_category ? { owner_category } : {}),
      estimated_support_cost,
      ticket_count,
    }),
  );
  const hiddenHighCostItem = actionItem({
    rank: 9,
    owner_lane: 'Hidden high-cost lane',
    owner_category: 'Hidden high-cost category',
    estimated_support_cost: 1000,
    ticket_count: 100,
  });
  return backlogTableSection({
    data: {
      ...backlogTableSection().data,
      total_item_count: 9,
      default_limit: 8,
      items: [...visibleCategoryItems, hiddenHighCostItem],
    },
  });
}

function suppressedRepeatReviewQueueSection(overrides: PlainRecord = {}) {
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

function rankedQuestionsSection(overrides: PlainRecord = {}) {
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

function outcomeDiagnosticsSection(overrides: PlainRecord = {}) {
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

function questionDetailsSection(overrides: PlainRecord = {}) {
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
          evidence_tier: 'csv_full_thread_resolution_evidence',
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

function minimalModel(overrides: PlainRecord = {}) {
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

function minimalArtifact() {
  return {
    markdown: '# legacy',
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      ticket_source_count: 1,
      top_question: 'How do I enable SSO?',
      top_opportunity_score: 1,
      output_checks: {
        uses_user_vocabulary: true,
        condensed: true,
        has_action_items: true,
      },
    },
    faq_result: {
      generated: 1,
      markdown: '# legacy',
      items: [
        {
          topic: 'Authentication',
          question: 'How do I enable SSO?',
          answer: 'Open Settings.',
          when_to_contact_support: 'Contact support if the setting is missing.',
          answer_evidence_status: 'resolution_evidence',
          ticket_count: 1,
          opportunity_score: 1,
          steps: ['Open Settings.'],
          action_items: ['Publish the SSO article.'],
          source_ids: ['ticket-1'],
          source_labels: ['ticket-1'],
          term_mappings: [],
        },
      ],
    },
  };
}

function pricingTermsFixtures() {
  const standard: DeflectionStandardPricingTerms = {
    variant: 'standard',
    status: 'configured',
    amountCents: 250000,
    currency: 'usd',
  };
  const partner: DeflectionPricingTerms = {
    variant: 'partner',
    status: 'configured',
    amountCents: 150000,
    currency: 'usd',
  };
  return { standard, partner };
}

function isRecord(value: unknown): value is PlainRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHostedScalar(value: unknown) {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function projectHostedFields(data: PlainRecord, ownerPath: string): PlainRecord {
  const shapes = (DEFLECTION_REPORT_HOSTED_FIELD_SHAPES as Record<string, PlainRecord>)[ownerPath];
  const projected: PlainRecord = {};
  for (const [field, shape] of Object.entries(shapes ?? {})) {
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
      projected[field] = value.filter(isRecord).map((item) => projectHostedFields(item, nestedPath));
    }
  }
  return projected;
}

function projectedSection(section: PlainRecord) {
  return {
    ...section,
    data: projectHostedFields(section.data, section.id),
  };
}

function projectedModel(overrides: PlainRecord = {}) {
  const model = minimalModel(overrides);
  return {
    ...model,
    sections: model.sections
      .filter((section: PlainRecord) => section.surfaces.includes('web'))
      .map(projectedSection),
  } satisfies DeflectionStructuredReport;
}

function extractPartnerReportModelCopyBranch(source: string) {
  const partnerMarker = 'if (priceVariant.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID) {';
  const partnerStart = source.indexOf(partnerMarker);
  expect(partnerStart).toBeGreaterThanOrEqual(0);
  const publicMarker = "badge: 'FULL RESOLUTION AUDIT'";
  const publicStart = source.indexOf(publicMarker, partnerStart);
  expect(publicStart).toBeGreaterThan(partnerStart);
  return source.slice(partnerStart, publicStart);
}

async function expectReportModelError(payload: unknown) {
  resetCalls({ payload });
  await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
    ok: false,
    reason: 'error',
  });
}

async function readReportStatus(requestId = 'content-ops-unit-123') {
  const response = await reportStatusGET(
    new Request(
      `https://portfolio.example.com/api/deflection-report-status?requestId=${encodeURIComponent(requestId)}`,
      { headers: { 'x-forwarded-for': '203.0.113.10' } },
    ),
  );
  return {
    status: response.status,
    body: await response.json(),
  };
}

beforeEach(async () => {
  configureAtlasEnv();
  resetCalls();
  installFetch();
  blobState.get.mockReset();
  vi.spyOn(console, 'error').mockImplementation((message) => {
    consoleErrors.push(String(message));
  });
  if (!ownerCostCards || !visibleBacklogRows) {
    const ownerSummary = await import('./deflection-owner-cost-summary.mjs');
    ownerCostCards = ownerSummary.ownerCostCards;
    visibleBacklogRows = ownerSummary.visibleBacklogRows;
  }
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    Reflect.deleteProperty(globalThis, 'fetch');
  }
  restoreEnv();
  delete globalThis.__atlasDeflectionRateLimitStore;
  vi.restoreAllMocks();
});

describe('deflection report-model result-page real imports', () => {
  it('summarizes owner cost from the visible backlog rows only', () => {
    const ownerFixture = ownerCostSummaryFixtureSection();
    const shownRows = visibleBacklogRows(ownerFixture);

    expect(shownRows).toHaveLength(8);
    expect(shownRows.some((row) => row.owner_lane === 'Hidden high-cost lane')).toBe(false);

    const cards = ownerCostCards(shownRows);
    expect(cards.map((row) => row.ownerCategory)).toEqual([
      'Product / Support Experience',
      'Content / Support Enablement',
      'Support Enablement',
      'Operations',
      'Engineering',
      'Legacy billing topic',
      'Other (1 category)',
    ]);
    expect(cards.reduce((total, row) => total + row.estimatedSupportCost, 0)).toBe(520);
    expect(cards[0].estimatedSupportCost).toBe(170);
    expect(cards.at(-1)?.estimatedSupportCost).toBe(30);
    expect(cards.reduce((total, row) => total + row.ticketCount, 0)).toBe(
      shownRows.reduce((total, row) => total + row.ticket_count, 0),
    );
  });

  it('fetches and projects a hosted-safe report model through the real ATLAS client', async () => {
    expect(pricingTermsFixtures()).toEqual({
      standard: {
        variant: 'standard',
        status: 'configured',
        amountCents: 250000,
        currency: 'usd',
      },
      partner: {
        variant: 'partner',
        status: 'configured',
        amountCents: 150000,
        currency: 'usd',
      },
    });

    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: true,
      model: projectedModel(),
    });
    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/report-model',
    );
    expect(headerValue(fetchCalls[0].headers, 'authorization')).toBe('Bearer service_token_unit');
    expect(fetchCalls[0].cache).toBe('no-store');
  });

  it('maps report-model lock, missing, config, and invalid-id states', async () => {
    resetCalls({ status: 403 });
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: false,
      reason: 'locked',
    });

    resetCalls({ status: 404 });
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: false,
      reason: 'not_found',
    });

    resetEnv({});
    resetCalls();
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: false,
      reason: 'not_configured',
    });
    expect(fetchCalls).toHaveLength(0);

    configureAtlasEnv();
    resetCalls();
    await expect(fetchDeflectionReportModel('../bad')).resolves.toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(fetchCalls).toHaveLength(0);
  });

  it('keeps optional legacy-safe fields but strips raw evidence fields', async () => {
    const questionDetails = questionDetailsSection();
    resetCalls({
      payload: minimalModel({
        sections: [supportTaxSection(), priorityFixQueueSection(), questionDetails],
      }),
    });

    const modelResult = await fetchDeflectionReportModel('content-ops-unit-123');
    expect(modelResult.ok).toBe(true);
    if (!modelResult.ok) return;

    const questionSection = modelResult.model.sections.find(
      (section) => section.id === 'question_details',
    );
    const row = questionSection?.data.rows[0];
    expect(row.source_count).toBe(4);
    expect(row.evidence_tier).toBe('csv_full_thread_resolution_evidence');
    expect(row.source_ids).toBeUndefined();
    expect(row.evidence_quotes).toBeUndefined();
    expect(row.outcome_diagnostics).toBeUndefined();
    expect(row.term_mappings).toEqual([
      {
        customer_term: 'SSO',
        documentation_term: 'single sign-on',
        suggestion: 'Use both terms in the help article.',
        source_id_count: 4,
      },
    ]);

    const legacyQuestionRow = { ...questionDetailsSection().data.rows[0] };
    delete legacyQuestionRow.evidence_tier;
    resetCalls({
      payload: minimalModel({
        sections: [
          supportTaxSection(),
          priorityFixQueueSection(),
          questionDetailsSection({
            data: { ...questionDetailsSection().data, rows: [legacyQuestionRow] },
          }),
        ],
      }),
    });
    const legacyResult = await fetchDeflectionReportModel('content-ops-unit-123');
    expect(legacyResult.ok).toBe(true);
    if (!legacyResult.ok) return;
    const legacyRow = legacyResult.model.sections.find(
      (section) => section.id === 'question_details',
    )?.data.rows[0];
    expect(legacyRow.evidence_tier).toBeUndefined();
    expect(legacyRow.source_ids).toBeUndefined();
    expect(legacyRow.evidence_quotes).toBeUndefined();
  });

  it('projects only hosted-safe action item fields across action sections', async () => {
    const unsafeActionItem = actionItem({
      owner_category: 'Content / Support Enablement',
      recommended_title: 'Unsafe title should not reach page data',
      representative_phrasing: ['My token is raw-customer-phrase'],
      source_ids: ['zendesk-ticket-123'],
      top_evidence: [{ source_id: 'zendesk-ticket-123', quote: 'raw customer evidence quote' }],
    });
    resetCalls({
      payload: minimalModel({
        sections: [
          supportTaxSection(),
          priorityFixQueueSection({
            data: { ...priorityFixQueueSection().data, items: [unsafeActionItem] },
          }),
          topUnresolvedRepeatsSection({
            data: { ...topUnresolvedRepeatsSection().data, items: [unsafeActionItem] },
          }),
          draftedResolutionsSection({
            data: { ...draftedResolutionsSection().data, items: [unsafeActionItem] },
          }),
          coveredRecurringSection({
            data: { ...coveredRecurringSection().data, items: [unsafeActionItem] },
          }),
          backlogTableSection({
            data: { ...backlogTableSection().data, items: [unsafeActionItem], total_item_count: 1 },
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
            },
          }),
        ],
      }),
    });

    const result = await fetchDeflectionReportModel('content-ops-unit-123');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const section of result.model.sections.filter((section) =>
      [
        'priority_fix_queue',
        'top_unresolved_repeats',
        'drafted_resolutions',
        'already_covered_still_recurring',
        'backlog_table',
        'suppressed_repeat_review_queue',
      ].includes(section.id),
    )) {
      const item = section.data.items[0];
      expect(item.recommended_title).toBeUndefined();
      expect(item.representative_phrasing).toBeUndefined();
      expect(item.source_ids).toBeUndefined();
      expect(item.top_evidence).toBeUndefined();
      expect(item.fix_type).toBeUndefined();
      expect(item.opportunity_score).toBeUndefined();
      expect(item.evidence_tier).toBe('csv_customer_text');
      expect(item.routing_signals).toEqual({
        tags: ['login', 'mfa'],
        product_area: ['Authentication'],
        custom_product_area: [],
      });
      expect(item.jira_template).toEqual({
        recommended_title: 'How do I enable SSO for my team?',
        question: 'How do I enable SSO for my team?',
        owner_lane: 'Help Center',
        owner_category: 'Content / Support Enablement',
        product_gap_summary: 'Repeated authentication friction routes to support.',
        ticket_count: 2,
        estimated_support_cost: 27,
        cost_period: 'batch_upload',
        cost_confidence: 'benchmark_only',
        evidence_tier: 'csv_customer_text',
        customer_vocabulary: ['enable SSO', 'single sign-on'],
        recommended_action: 'Write and approve the missing answer.',
      });
      if (section.id === 'suppressed_repeat_review_queue') {
        expect(item.review_key).toBe('review_abcdef0123456789abcdef01');
        expect(item.suppression_reason).toBe('too_low_volume');
        expect(item.suppression_reason_label).toBe('Too low volume');
        expect(section.data.reason_counts).toEqual({ too_low_volume: 1 });
      }
    }
  });

  it('preserves legacy action items without optional evidence tier and routing signals', async () => {
    const legacyItem = { ...priorityFixQueueSection().data.items[0] };
    delete legacyItem.evidence_tier;
    delete legacyItem.routing_signals;
    resetCalls({
      payload: minimalModel({
        sections: [
          supportTaxSection(),
          priorityFixQueueSection({
            data: { ...priorityFixQueueSection().data, items: [legacyItem] },
          }),
        ],
      }),
    });
    const result = await fetchDeflectionReportModel('content-ops-unit-123');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const item = result.model.sections.find((section) => section.id === 'priority_fix_queue')
      ?.data.items[0];
    expect(item.evidence_tier).toBeUndefined();
    expect(item.routing_signals).toBeUndefined();

    const legacySuppressedItem = { ...suppressedRepeatReviewQueueSection().data.items[0] };
    delete legacySuppressedItem.evidence_tier;
    delete legacySuppressedItem.routing_signals;
    resetCalls({
      payload: minimalModel({
        sections: [
          supportTaxSection(),
          priorityFixQueueSection(),
          suppressedRepeatReviewQueueSection({
            data: { ...suppressedRepeatReviewQueueSection().data, items: [legacySuppressedItem] },
          }),
        ],
      }),
    });
    const suppressedResult = await fetchDeflectionReportModel('content-ops-unit-123');
    expect(suppressedResult.ok).toBe(true);
    if (!suppressedResult.ok) return;
    const suppressedItem = suppressedResult.model.sections.find(
      (section) => section.id === 'suppressed_repeat_review_queue',
    )?.data.items[0];
    expect(suppressedItem.evidence_tier).toBeUndefined();
    expect(suppressedItem.routing_signals).toBeUndefined();
  });

  it('accepts valid optional sections and limit edge cases', async () => {
    const validPriorityQueueSection = priorityFixQueueSection();
    resetCalls({ payload: minimalModel({ sections: [supportTaxSection(), validPriorityQueueSection] }) });
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: true,
      model: projectedModel({ sections: [supportTaxSection(), validPriorityQueueSection] }),
    });

    const zeroLimitPriorityQueueSection = priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, result_page_limit: 0 },
    });
    resetCalls({
      payload: minimalModel({ sections: [supportTaxSection(), zeroLimitPriorityQueueSection] }),
    });
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: true,
      model: projectedModel({ sections: [supportTaxSection(), zeroLimitPriorityQueueSection] }),
    });

    const supportTaxWithoutAnnualized = supportTaxSection();
    delete supportTaxWithoutAnnualized.data.annualized_support_cost;
    delete supportTaxWithoutAnnualized.data.annualized_run_rate_support_cost;
    resetCalls({
      payload: minimalModel({
        sections: [supportTaxWithoutAnnualized, priorityFixQueueSection()],
      }),
    });
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: true,
      model: projectedModel({ sections: [supportTaxWithoutAnnualized, priorityFixQueueSection()] }),
    });

    for (const sourceDateWindow of [
      { source_date_start: null, source_date_end: null, source_window_days: null },
      null,
      { source_date_start: '2026-05-01', source_date_end: null, source_window_days: 15 },
    ]) {
      const supportTax = supportTaxSection({ source_date_window: sourceDateWindow });
      resetCalls({ payload: minimalModel({ sections: [supportTax, priorityFixQueueSection()] }) });
      await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
        ok: true,
        model: projectedModel({ sections: [supportTax, priorityFixQueueSection()] }),
      });
    }

    for (const section of [
      rankedQuestionsSection(),
      outcomeDiagnosticsSection(),
    ]) {
      resetCalls({
        payload: minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), section] }),
      });
      await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
        ok: true,
        model: projectedModel({ sections: [supportTaxSection(), priorityFixQueueSection(), section] }),
      });
    }
    resetCalls({
      payload: minimalModel({
        sections: [supportTaxSection(), priorityFixQueueSection(), questionDetailsSection()],
      }),
    });
    const questionDetailsResult = await fetchDeflectionReportModel('content-ops-unit-123');
    expect(questionDetailsResult.ok).toBe(true);

    resetCalls({
      payload: minimalModel({
        sections: [
          supportTaxSection(),
          priorityFixQueueSection(),
          exportOnlySection({
            required_data: ['evidence_row_count', 'source_id_count'],
            data: { evidence_row_count: 42 },
          }),
        ],
      }),
    });
    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: true,
      model: projectedModel({ sections: [supportTaxSection(), priorityFixQueueSection()] }),
    });
  });

  it('logs malformed report-model shapes generically', async () => {
    resetCalls({ payload: minimalModel({ schema_version: 'deflection.v2' }) });

    await expect(fetchDeflectionReportModel('content-ops-unit-123')).resolves.toEqual({
      ok: false,
      reason: 'error',
    });
    expect(
      consoleErrors.some((entry) => entry.includes('deflection.report_model.shape_rejected')),
    ).toBe(true);
  });

  it.each([
    ['unsupported schema', () => minimalModel({ schema_version: 'deflection.v2' })],
    ['missing required support-tax field', () => minimalModel({
      sections: [{
        id: 'support_tax',
        title: 'Support Tax Confirmation',
        priority: 10,
        surfaces: ['web'],
        default_limit: null,
        required_data: ['repeat_ticket_count'],
        snapshot_safe_fields: [],
        data: {},
      }],
    })],
    ['object support-tax scalar', () => minimalModel({ sections: [supportTaxSection({ repeat_ticket_count: { count: 7 } })] })],
    ['object status count', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, status_counts: { 'Needs answer': { count: 1 } } },
    })] })],
    ['string support-tax count', () => minimalModel({ sections: [supportTaxSection({ repeat_ticket_count: '7' })] })],
    ['missing action question', () => {
      const item = actionItem();
      delete item.question;
      return minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
        data: { ...priorityFixQueueSection().data, items: [item] },
      })] });
    }],
    ['null csat object', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: [actionItem({ csat_signal: null })] },
    })] })],
    ['string support cost basis', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, support_cost_basis: 'benchmark_only' },
    })] })],
    ['object priority driver', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: [{ ...actionItem(), priority_drivers: ['repeat_volume', { reason: 'missing_answer' }] }] },
    })] })],
    ['non-object priority item', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: ['not an action item'] },
    })] })],
    ['missing suppressed review key', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), suppressedRepeatReviewQueueSection({
      data: { ...suppressedRepeatReviewQueueSection().data, items: [{ ...suppressedRepeatReviewQueueSection().data.items[0], review_key: undefined }] },
    })] })],
    ['object priority score', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: [{ ...priorityFixQueueSection().data.items[0], priority_score: { score: 84 } }] },
    })] })],
    ['object action rank', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: [{ ...priorityFixQueueSection().data.items[0], rank: { value: 1.9 } }] },
    })] })],
    ['object action question', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: [{ ...priorityFixQueueSection().data.items[0], question: { value: 'How do I enable SSO for my team?' } }] },
    })] })],
    ['object nested csat scalar', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, items: [{ ...priorityFixQueueSection().data.items[0], csat_signal: { ...priorityFixQueueSection().data.items[0].csat_signal, negative_csat_ticket_count: { count: 3 } } }] },
    })] })],
    ['string source window', () => minimalModel({ sections: [supportTaxSection({ source_date_window: '2026-05-01 to 2026-05-15' }), priorityFixQueueSection()] })],
    ['missing priority queue', () => minimalModel({ sections: [supportTaxSection()] })],
    ['object ranked source proof', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), rankedQuestionsSection({
      data: { ...rankedQuestionsSection().data, rows: [{ ...rankedQuestionsSection().data.rows[0], source_proof: { label: 'source-backed' } }] },
    })] })],
    ['object ranked weighted frequency', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), rankedQuestionsSection({
      data: { ...rankedQuestionsSection().data, rows: [{ ...rankedQuestionsSection().data.rows[0], weighted_frequency: { value: 0.7 } }] },
    })] })],
    ['object queue cost status', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection({
      data: { ...priorityFixQueueSection().data, support_cost_basis: { ...priorityFixQueueSection().data.support_cost_basis, status: { label: 'benchmark_only' } } },
    })] })],
    ['array unresolved cost basis', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), topUnresolvedRepeatsSection({
      data: { ...topUnresolvedRepeatsSection().data, support_cost_basis: ['benchmark_only'] },
    })] })],
    ['object unresolved item score', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), topUnresolvedRepeatsSection({
      data: { ...topUnresolvedRepeatsSection().data, items: [actionItem({ priority_score: { score: 84 } })] },
    })] })],
    ['object unresolved cost status', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), topUnresolvedRepeatsSection({
      data: { ...topUnresolvedRepeatsSection().data, support_cost_basis: { ...topUnresolvedRepeatsSection().data.support_cost_basis, status: { label: 'benchmark_only' } } },
    })] })],
    ['object drafted top count', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), draftedResolutionsSection({
      data: { ...draftedResolutionsSection().data, top_item_count: { count: 1 } },
    })] })],
    ['non-object drafted item', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), draftedResolutionsSection({
      data: { ...draftedResolutionsSection().data, items: ['not an action item'] },
    })] })],
    ['object covered top count', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), coveredRecurringSection({
      data: { ...coveredRecurringSection().data, top_item_count: { count: 1 } },
    })] })],
    ['non-object covered item', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), coveredRecurringSection({
      data: { ...coveredRecurringSection().data, items: ['not an action item'] },
    })] })],
    ['object backlog total count', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), backlogTableSection({
      data: { ...backlogTableSection().data, total_item_count: { count: 2 } },
    })] })],
    ['object backlog default limit', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), backlogTableSection({
      data: { ...backlogTableSection().data, default_limit: { count: 25 } },
    })] })],
    ['object outcome status mix', () => minimalModel({ sections: [supportTaxSection(), priorityFixQueueSection(), outcomeDiagnosticsSection({
      data: { ...outcomeDiagnosticsSection().data, rows: [{ ...outcomeDiagnosticsSection().data.rows[0], status_mix: { reopened: 1 } }] },
    })] })],
  ])('rejects malformed hosted report data: %s', async (_label, payloadFactory) => {
    await expectReportModelError(payloadFactory());
  });

  it('keeps result route, model page, and review decision source contracts wired', async () => {
    const [routeSource, modelPageSource, reviewDecisionControlSource] = await Promise.all([
      readFile(join(webRoot, 'src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionReportModelPage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionReviewDecisionControl.tsx'), 'utf8'),
    ]);
    const partnerBranch = extractPartnerReportModelCopyBranch(modelPageSource);

    expect(routeSource).toContain('fetchDeflectionPricingTerms(priceVariant.id)');
    expect(routeSource).toContain('withDeflectionPriceDisplayTerms(');
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
    expect(modelFetchIndex).toBeGreaterThanOrEqual(0);
    expect(modelPriceVariantIndex).toBeGreaterThan(modelFetchIndex);
    expect(modelPageRenderIndex).toBeGreaterThanOrEqual(0);
    expect(modelPriceVariantIndex).toBeLessThan(modelPageRenderIndex);
    expect(snapshotPriceVariantIndex).toBeGreaterThan(snapshotNotFoundIndex);
    expect(artifactFetchIndex).toBeGreaterThan(modelFetchIndex);
    expect(artifactPriceVariantIndex).toBeGreaterThan(artifactFetchIndex);
    expect(artifactPageRenderIndex).toBeGreaterThanOrEqual(0);
    expect(artifactPriceVariantIndex).toBeLessThan(artifactPageRenderIndex);
    expect(routeSource).toContain('priceVariant={priceVariant}');
    expect(routeSource.indexOf('artifact={artifact}', artifactPageRenderIndex)).toBeGreaterThan(
      artifactPageRenderIndex,
    );
    expect(routeSource.indexOf('requestId={requestId}', artifactPageRenderIndex)).toBeGreaterThan(
      artifactPageRenderIndex,
    );
    expect(routeSource.indexOf('priceVariant={priceVariant}', artifactPageRenderIndex)).toBeGreaterThan(
      artifactPageRenderIndex,
    );
    expect(routeSource).not.toContain('fetchDeflectionArtifact(requestId);\\n  const model');

    expect(modelPageSource).toContain("section.surfaces.includes('web')");
    expect(modelPageSource).toContain('FULL RESOLUTION AUDIT');
    expect(modelPageSource).toContain('Your Resolution Audit is ready.');
    expect(modelPageSource).toContain('Full audit dashboard');
    expect(partnerBranch).toContain("badge: 'FULL DEFLECTION REPORT'");
    expect(partnerBranch).toContain("headline: 'Your Deflection Report is ready.'");
    expect(partnerBranch).toContain("dashboardLabel: 'Full report dashboard'");
    expect(partnerBranch).not.toContain('Resolution Audit');
    expect(modelPageSource).not.toContain('MODEL-BACKED REPORT');
    expect(modelPageSource).not.toContain('Your Support Tax report is ready.');
    expect(modelPageSource).not.toContain('Paid report dashboard');

    for (const expected of [
      'data-smoke="ownerCostSummary"',
      "const backlog = sectionById(model, 'backlog_table');",
      '<OwnerCostSummary section={backlog} />',
      'Cost by Owner Category',
      'row-level owner lane remains the routeable topic',
      'const limit = Math.min(OUTCOME_DIAGNOSTIC_LIMIT, requestedLimit)',
      'const limit = Math.min(SEO_TARGET_LIMIT, requestedLimit)',
      'const diagnostics = allDiagnostics.slice(0, limit)',
      'Diagnostics capped at',
      'complete evidence export',
      "section.id === 'priority_fix_queue'",
      'Priority Fix Queue',
      "section.id === 'top_unresolved_repeats'",
      'Top Unresolved Repeats',
      'Content gap',
      'data-smoke="topUnresolvedRepeats"',
      "section.id === 'drafted_resolutions'",
      'Drafted Resolutions',
      'data-smoke="draftedResolutions"',
      "section.id === 'already_covered_still_recurring'",
      'Already Covered but Still Recurring',
      'Product or process gap',
      'data-smoke="coveredRecurring"',
      "section.id === 'suppressed_repeat_review_queue'",
      'Suppressed Repeat Review Queue',
      'data-smoke="suppressedRepeatReviewQueue"',
      'Hide reason',
      "import { DeflectionReviewDecisionControl } from '@/components/landing/DeflectionReviewDecisionControl';",
      '<SuppressedRepeatReviewQueue key={section.id} section={section} requestId={requestId} />',
      'reviewKey={text(row.review_key)}',
      'recommendedAction={text(row.recommended_action)}',
      "section.id === 'backlog_table'",
      'Backlog Table',
      'data-smoke="backlogTable"',
      'Opportunity is a relative ranking signal: repeat volume weighted by failure-risk signals.',
      'It is not a dollar figure or percentage.',
      'const limit = Math.min(PRIORITY_FIX_QUEUE_LIMIT, requestedLimit)',
      'const limit = Math.min(TOP_UNRESOLVED_REPEATS_LIMIT, requestedLimit)',
      'const limit = Math.min(DRAFTED_RESOLUTIONS_LIMIT, requestedLimit)',
      'const limit = Math.min(COVERED_RECURRING_LIMIT, requestedLimit)',
      'const items = visibleBacklogRows(section);',
      'nonNegativeIntOrNull(data.result_page_limit) ??',
      'No priority fixes are shown in this result-page view.',
      'priority_score',
      'evidenceTierLabel',
      'routingSignalCue',
      'product, content, or support friction',
      'int(row.source_count)',
    ]) {
      expect(modelPageSource).toContain(expected);
    }

    for (const forbidden of [
      'review_key}</',
      'int(data.result_page_limit) ||',
      'if (items.length === 0) return null',
      "['assignee'",
      "['organization'",
      "['brand'",
      "['group'",
      'docs queue',
      'top_evidence',
      'evidence_quotes',
      'source_ids',
    ]) {
      expect(modelPageSource).not.toContain(forbidden);
    }
    expect(modelPageSource).toContain("['product_area', 'Product area']");
    expect(modelPageSource).toContain("['custom_product_area', 'Product area']");
    expect(modelPageSource).toContain("['tags', 'Tags']");

    expect(reviewDecisionControlSource).toContain("'use client';");
    expect(reviewDecisionControlSource).toContain(
      "const DEFAULT_REVIEW_DECISION_API_PATH = '/api/deflection-review-decisions';",
    );
    expect(reviewDecisionControlSource).toContain(
      'const loadUrl = `${apiPath}${separator}requestId=${encodedRequestId}`;',
    );
    expect(reviewDecisionControlSource).toContain("method: 'POST'");
    expect(reviewDecisionControlSource).toContain('decision: nextDecision');
    expect(reviewDecisionControlSource).toContain("persistence === 'unconfigured'");
    expect(reviewDecisionControlSource).toContain('data-smoke="deflectionReviewDecisionControl"');
    expect(reviewDecisionControlSource).not.toContain('source_ids');
    expect(reviewDecisionControlSource).not.toContain('evidence_quotes');
  });

  it('reports paid status through the real status route', async () => {
    resetCalls({ payload: minimalModel() });
    await expect(readReportStatus()).resolves.toEqual({
      status: 200,
      body: { status: 'unlocked' },
    });
    expect(fetchCalls.map((call) => call.url)).toEqual([
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/report-model',
    ]);

    resetCalls({
      queue: [
        { status: 404, payload: { error: 'missing model' } },
        { status: 200, payload: minimalArtifact() },
      ],
    });
    await expect(readReportStatus()).resolves.toEqual({
      status: 200,
      body: { status: 'unlocked' },
    });
    expect(fetchCalls.map((call) => call.url)).toEqual([
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/report-model',
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/artifact',
    ]);

    resetCalls({ status: 403 });
    await expect(readReportStatus()).resolves.toEqual({
      status: 200,
      body: { status: 'locked' },
    });

    resetCalls({ status: 500, payload: { error: 'upstream' } });
    await expect(readReportStatus()).resolves.toEqual({
      status: 503,
      body: { error: 'Report status unavailable.' },
    });
  });
});
