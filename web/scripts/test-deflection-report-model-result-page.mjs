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

function projectedActionItem(row = actionItem()) {
  return {
    rank: row.rank,
    question: row.question,
    status: row.status,
    owner_lane: row.owner_lane,
    confidence: row.confidence,
    recommended_action: row.recommended_action,
    ticket_count: row.ticket_count,
    estimated_support_cost: row.estimated_support_cost,
    priority_score: row.priority_score,
    priority_drivers: row.priority_drivers,
    csat_signal: {
      status: row.csat_signal.status,
      csat_present_count: row.csat_signal.csat_present_count,
      negative_csat_ticket_count: row.csat_signal.negative_csat_ticket_count,
      numeric_average: row.csat_signal.numeric_average,
    },
  };
}

function projectedSupportCostBasis(section) {
  return { status: section.data.support_cost_basis.status };
}

function projectedSection(section) {
  if (section.id === 'priority_fix_queue') {
    return {
      ...section,
      data: {
        items: section.data.items.map(projectedActionItem),
        status_counts: section.data.status_counts,
        result_page_limit: section.data.result_page_limit,
        pdf_limit: section.data.pdf_limit,
        backlog_limit: section.data.backlog_limit,
        support_cost_basis: projectedSupportCostBasis(section),
      },
    };
  }
  if (section.id === 'top_unresolved_repeats') {
    return {
      ...section,
      data: {
        items: section.data.items.map(projectedActionItem),
        top_item_count: section.data.top_item_count,
        support_cost_basis: projectedSupportCostBasis(section),
      },
    };
  }
  if (section.id === 'drafted_resolutions') {
    return {
      ...section,
      data: {
        items: section.data.items.map(projectedActionItem),
        top_item_count: section.data.top_item_count,
      },
    };
  }
  if (section.id === 'already_covered_still_recurring') {
    return {
      ...section,
      data: {
        items: section.data.items.map(projectedActionItem),
        top_item_count: section.data.top_item_count,
      },
    };
  }
  if (section.id === 'backlog_table') {
    return {
      ...section,
      data: {
        items: section.data.items.map(projectedActionItem),
        total_item_count: section.data.total_item_count,
        default_limit: section.data.default_limit,
      },
    };
  }
  return section;
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
    required_data: ['items', 'top_item_count', 'support_cost_basis'],
    snapshot_safe_fields: ['items.rank', 'items.question', 'items.ticket_count'],
    data: {
      top_item_count: 1,
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
    required_data: ['items', 'top_item_count'],
    snapshot_safe_fields: [],
    data: {
      top_item_count: 1,
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
    required_data: ['items', 'top_item_count'],
    snapshot_safe_fields: [],
    data: {
      top_item_count: 1,
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
    ],
  });
  const projectedUnsafeModel = await fetchDeflectionReportModel('content-ops-unit-123');
  assert.equal(projectedUnsafeModel.ok, true);
  for (const section of projectedUnsafeModel.model.sections.filter((section) => (
    section.id === 'priority_fix_queue' ||
    section.id === 'top_unresolved_repeats' ||
    section.id === 'drafted_resolutions' ||
    section.id === 'already_covered_still_recurring' ||
    section.id === 'backlog_table'
  ))) {
    const item = section.data.items[0];
    assert.equal('recommended_title' in item, false);
    assert.equal('representative_phrasing' in item, false);
    assert.equal('source_ids' in item, false);
    assert.equal('top_evidence' in item, false);
    assert.equal('fix_type' in item, false);
    assert.equal('opportunity_score' in item, false);
    assert.deepEqual(Object.keys(item).sort(), [
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
    ].sort());
  }

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
  assert.ok(modelPageSource.includes('data-smoke="topUnresolvedRepeats"'), 'top unresolved repeats keeps a stable smoke marker');
  assert.ok(modelPageSource.includes("section.id === 'drafted_resolutions'"), 'model page renders drafted_resolutions sections');
  assert.ok(modelPageSource.includes('Drafted Resolutions'), 'model page names drafted resolution actions');
  assert.ok(modelPageSource.includes('data-smoke="draftedResolutions"'), 'drafted resolutions keeps a stable smoke marker');
  assert.ok(
    modelPageSource.includes("section.id === 'already_covered_still_recurring'"),
    'model page renders already_covered_still_recurring sections',
  );
  assert.ok(modelPageSource.includes('Already Covered but Still Recurring'), 'model page names covered recurring actions');
  assert.ok(modelPageSource.includes('data-smoke="coveredRecurring"'), 'covered recurring keeps a stable smoke marker');
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
  assert.equal(modelPageSource.includes('source_ids.map'), false, 'model page must not render raw source IDs');

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
