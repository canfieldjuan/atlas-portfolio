import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blobState = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({
  get: blobState.get,
}));

import {
  fetchDeflectionArtifact,
  fetchDeflectionSnapshot,
  submitDeflectionReportCsv,
} from '@/lib/atlas-deflection-client';

type FetchCall = {
  url: string;
  init: RequestInit;
};

const ENV_KEYS = [
  'ATLAS_API_BASE_URL',
  'ATLAS_B2B_SERVICE_TOKEN',
  'BLOB_READ_WRITE_TOKEN',
  'ticke_deflection_blob_READ_WRITE_TOKEN',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const webRoot = process.cwd();

let fetchCalls: FetchCall[] = [];
let fetchPayload: unknown = { request_id: 'content-ops-unit-123' };
let fetchStatus = 200;
let consoleErrors: string[] = [];

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
    BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_unit',
  });
}

function resetFetch(values: { status?: number; payload?: unknown } = {}) {
  fetchCalls = [];
  fetchStatus = values.status ?? 200;
  fetchPayload = values.payload ?? { request_id: 'content-ops-unit-123' };
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    fetchCalls.push({ url, init });
    return Response.json(fetchPayload, { status: fetchStatus });
  });
}

function resetBlob() {
  blobState.get.mockReset();
  blobState.get.mockResolvedValue({
    statusCode: 200,
    stream: new Blob(['ticket_id,message\n1,How do I export reports?\n'], {
      type: 'text/csv',
    }).stream(),
    blob: { contentType: 'text/csv' },
  });
}

function restoreFetch() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    Reflect.deleteProperty(globalThis, 'fetch');
  }
}

function minimalSummary(summaryExtras: Record<string, unknown> = {}) {
  return {
    generated: 1,
    drafted_answer_count: 1,
    no_proven_answer_count: 0,
    support_ticket_resolution_evidence_present: true,
    support_ticket_resolution_evidence_count: 1,
    repeat_ticket_count: 1,
    non_repeat_ticket_count: 0,
    ...summaryExtras,
  };
}

function minimalSnapshot(summaryExtras: Record<string, unknown> = {}) {
  return {
    title: 'Resolution Snapshot',
    summary: minimalSummary(summaryExtras),
    top_questions: [],
    locked_questions: [],
    top_blind_spots: [],
    teaser: { full_answer: null, previews: [] },
  };
}

function minimalArtifact() {
  return {
    markdown: '# Paid deflection report',
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      ticket_source_count: 2,
      top_question: 'How do I export reports?',
      top_opportunity_score: 2,
      output_checks: {
        uses_user_vocabulary: true,
        condensed: true,
        has_action_items: true,
      },
    },
    faq_result: {
      generated: 1,
      markdown: '# FAQ source',
      items: [
        {
          topic: 'exports',
          question: 'How do I export reports?',
          answer: 'Open Analytics and select Export.',
          when_to_contact_support: 'Contact support if Export is unavailable.',
          answer_evidence_status: 'resolution_evidence',
          ticket_count: 2,
          opportunity_score: 2,
          steps: ['Open Analytics.', 'Select Export.'],
          action_items: ['Confirm the export completed.'],
          source_ids: ['ticket-export-1', 'ticket-export-2'],
          source_labels: ['`ticket-export-1` - Export reports'],
          term_mappings: [
            {
              customer_term: 'export',
              documentation_term: 'Export reports',
              suggestion: 'Add export phrasing.',
            },
          ],
        },
      ],
    },
  };
}

function formDataBody(call: FetchCall) {
  expect(call.init.body).toBeInstanceOf(FormData);
  return call.init.body as FormData;
}

function fetchHeaders(call: FetchCall) {
  return new Headers(call.init.headers);
}

function extractNumericConst(source: string, name: string) {
  const match = source.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s+=\\s+([0-9_]+)`));
  expect(match, `${name} constant should be present`).not.toBeNull();
  return Number(match?.[1].replaceAll('_', ''));
}

async function expectSnapshotError(payload: unknown) {
  resetFetch({ payload });
  await expect(fetchDeflectionSnapshot('content-ops-unit-123')).resolves.toEqual({
    ok: false,
    reason: 'error',
  });
}

beforeEach(() => {
  configureAtlasEnv();
  resetBlob();
  resetFetch();
  consoleErrors = [];
  vi.spyOn(console, 'error').mockImplementation((message) => {
    consoleErrors.push(String(message));
  });
});

afterEach(() => {
  restoreFetch();
  restoreEnv();
  vi.restoreAllMocks();
});

describe('deflection submit client', () => {
  it('reads a private CSV blob and submits multipart data to ATLAS with service auth', async () => {
    await expect(submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'unit tickets.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'helpscout',
    })).resolves.toEqual({ ok: true, requestId: 'content-ops-unit-123' });

    expect(blobState.get).toHaveBeenCalledWith(
      'https://blob.example/gap-report-csvs/unit.csv',
      { access: 'private', token: 'vercel_blob_rw_unit', useCache: false },
    );
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/submit',
    );
    expect(fetchHeaders(fetchCalls[0]).get('authorization')).toBe('Bearer service_token_unit');
    expect(fetchHeaders(fetchCalls[0]).get('content-type')).toBeNull();

    const body = formDataBody(fetchCalls[0]);
    expect(body.get('support_platform')).toBe('help_scout');
    expect(body.get('company_name')).toBe('Acme Co.');
    expect(body.get('contact_email')).toBe('lead@acme.example');
    expect((body.get('csv_file') as File).name).toBe('unit_tickets.csv');
  });

  it('does not read Blob or call ATLAS when service env is missing', async () => {
    resetEnv();
    await expect(submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'unit.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'zendesk',
    })).resolves.toEqual({ ok: false, reason: 'not_configured' });

    expect(blobState.get).not.toHaveBeenCalled();
    expect(fetchCalls).toHaveLength(0);
  });

  it('rejects unsafe submit response ids and logs the shape failure generically', async () => {
    resetFetch({ payload: { request_id: '../../bad' } });

    await expect(submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'freshdesk.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'freshdesk',
    })).resolves.toEqual({ ok: false, reason: 'invalid_response' });

    expect(fetchHeaders(fetchCalls[0]).get('authorization')).toBe('Bearer service_token_unit');
    expect(formDataBody(fetchCalls[0]).get('support_platform')).toBe('other');
    expect(consoleErrors.some((entry) => entry.includes('deflection.submit.shape_rejected')))
      .toBe(true);
  });
});

describe('deflection snapshot client', () => {
  it('projects the public snapshot while stripping private source evidence', async () => {
    resetFetch({
      payload: {
        title: 'Resolution Snapshot',
        summary: minimalSummary({
          generated: 2,
          drafted_answer_count: 1,
          no_proven_answer_count: 1,
          repeat_ticket_count: 6,
          non_repeat_ticket_count: 4,
          source_date_start: '2026-05-01',
          source_date_end: '2026-05-06',
          source_window_days: 6,
        }),
        top_questions: [
          {
            rank: 1,
            question: 'How do I export reports?',
            customer_wording: 'export reports',
            ticket_count: 4,
            weighted_frequency: 4,
            owner_lane: 'Reporting',
            action_label: 'Publish answer',
            estimated_support_cost: 54,
            source_ids: ['ticket-private-top'],
            evidence_quotes: ['private top evidence'],
          },
        ],
        locked_questions: [
          {
            rank: 2,
            ticket_count: 2,
            question: 'Locked private billing question',
            customer_wording: 'schedule exports',
            source_ids: ['ticket-private-locked'],
            evidence_quotes: ['private locked evidence'],
            markdown: '# locked markdown',
          },
        ],
        top_blind_spots: [
          {
            rank: 1,
            question: 'Can I schedule exports?',
            ticket_count: 2,
            owner_lane: 'Reporting',
            action_label: 'Write missing answer',
            estimated_support_cost: 27,
            customer_wording: 'schedule exports',
            source_ids: ['ticket-private-blind'],
            evidence_quotes: ['private blind evidence'],
            markdown: '# blind markdown',
          },
        ],
        teaser: {
          full_answer: {
            rank: 1,
            question: 'How do I export reports?',
            answer: 'Open Analytics and select Export.',
            steps: ['Open Analytics.', 'Select Export.'],
            answer_evidence_status: 'resolution_evidence',
            resolution_evidence_scope: 'scoped',
            weighted_frequency: 4,
            source_count: 2,
            source_ids: ['ticket-private-1'],
            evidence_quotes: ['private evidence quote'],
            markdown: '# paid markdown',
            term_mappings: [{ customer_term: 'export' }],
          },
          previews: [
            {
              rank: 2,
              question: 'Can I schedule exports?',
              answer: 'Preview answer must not cross to the browser.',
              steps: ['Preview step must not cross to the browser.'],
              answer_evidence_status: 'resolution_evidence',
              resolution_evidence_scope: 'scoped',
              weighted_frequency: 3,
              step_count: 2,
              source_count: 1,
              body_withheld: true,
              source_ids: ['ticket-private-2'],
            },
          ],
        },
      },
    });

    const result = await fetchDeflectionSnapshot('content-ops-unit-123');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected snapshot fetch to pass');

    expect(result.snapshot.summary).toEqual({
      generated: 2,
      drafted_answer_count: 1,
      no_proven_answer_count: 1,
      support_ticket_resolution_evidence_present: true,
      support_ticket_resolution_evidence_count: 1,
      repeat_ticket_count: 6,
      non_repeat_ticket_count: 4,
      source_date_start: '2026-05-01',
      source_date_end: '2026-05-06',
      source_window_days: 6,
    });
    expect(result.snapshot.top_questions).toEqual([
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        ticket_count: 4,
        weighted_frequency: 4,
        owner_lane: 'Reporting',
        action_label: 'Publish answer',
        estimated_support_cost: 54,
      },
    ]);
    expect(result.snapshot.locked_questions).toEqual([{ rank: 2, ticket_count: 2 }]);
    expect(result.snapshot.top_blind_spots).toEqual([
      {
        rank: 1,
        question: 'Can I schedule exports?',
        ticket_count: 2,
        owner_lane: 'Reporting',
        action_label: 'Write missing answer',
        estimated_support_cost: 27,
      },
    ]);
    expect(result.snapshot.teaser.full_answer).toEqual({
      rank: 1,
      question: 'How do I export reports?',
      answer: 'Open Analytics and select Export.',
      steps: ['Open Analytics.', 'Select Export.'],
      answer_evidence_status: 'resolution_evidence',
      resolution_evidence_scope: 'scoped',
      weighted_frequency: 4,
      source_count: 2,
    });
    expect(result.snapshot.teaser.previews).toEqual([
      {
        rank: 2,
        question: 'Can I schedule exports?',
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 3,
        step_count: 2,
        source_count: 1,
        body_withheld: true,
      },
    ]);

    const serializedSnapshot = JSON.stringify(result.snapshot);
    for (const privateText of [
      'ticket-private',
      'private evidence quote',
      'paid markdown',
      'private top evidence',
      'private locked evidence',
      'locked markdown',
      'Locked private billing question',
      'private blind evidence',
      'blind markdown',
      'Preview answer must not cross',
    ]) {
      expect(serializedSnapshot).not.toContain(privateText);
    }
  });

  it('omits source window fields unless the full date window is valid', async () => {
    for (const summaryExtras of [
      {},
      { source_date_start: '2026-05-01', source_window_days: 1 },
      {
        source_date_start: '2026-05-01',
        source_date_end: '2026-05-06',
        source_window_days: 30,
      },
      {
        source_date_start: '2026-02-30',
        source_date_end: '2026-03-01',
        source_window_days: 1,
      },
      {
        source_date_start: '2026-05-06',
        source_date_end: '2026-05-01',
        source_window_days: 6,
      },
    ]) {
      resetFetch({ payload: minimalSnapshot(summaryExtras) });
      const result = await fetchDeflectionSnapshot('content-ops-unit-123');
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('expected snapshot fetch to pass');
      expect(result.snapshot.summary).toEqual(minimalSummary());
    }
  });

  it('fails closed for malformed public snapshot rows and teaser shapes', async () => {
    await expectSnapshotError({
      title: 'Resolution Snapshot',
      summary: {
        generated: 1,
        drafted_answer_count: 1,
        no_proven_answer_count: 0,
      },
      top_questions: [
        {
          rank: 1,
          question: 'How do I export reports?',
          customer_wording: 'export reports',
          ticket_count: 1,
          weighted_frequency: 1,
          owner_lane: 'Reporting',
          action_label: 'Publish answer',
          estimated_support_cost: 13.5,
        },
      ],
      locked_questions: [],
      teaser: { full_answer: null, previews: [] },
    });

    const missingBlindSpots = minimalSnapshot();
    delete (missingBlindSpots as Record<string, unknown>).top_blind_spots;
    await expectSnapshotError(missingBlindSpots);

    await expectSnapshotError({
      ...minimalSnapshot(),
      top_questions: [
        {
          rank: 1,
          question: 'How do I export reports?',
          customer_wording: 'export reports',
          ticket_count: 1,
          weighted_frequency: 1,
          action_label: 'Publish answer',
          estimated_support_cost: 13.5,
        },
      ],
    });

    await expectSnapshotError({
      ...minimalSnapshot(),
      top_blind_spots: [
        {
          rank: 1,
          question: 'Can I schedule exports?',
          ticket_count: 1,
          owner_lane: 'Reporting',
          action_label: 'Write missing answer',
        },
      ],
    });

    await expectSnapshotError({
      ...minimalSnapshot(),
      top_blind_spots: [
        {
          rank: 1,
          question: '',
          ticket_count: 1,
          owner_lane: 'Reporting',
          action_label: 'Write missing answer',
          estimated_support_cost: 13.5,
        },
      ],
    });

    await expectSnapshotError({
      ...minimalSnapshot({
        generated: 2,
        drafted_answer_count: 1,
        no_proven_answer_count: 1,
        repeat_ticket_count: 2,
      }),
      top_blind_spots: 'not-an-array',
    });

    await expectSnapshotError({
      ...minimalSnapshot(),
      top_questions: [
        {
          rank: 1,
          question: 'How do I export reports?',
          customer_wording: 'export reports',
          weighted_frequency: 1,
          owner_lane: 'Reporting',
          action_label: 'Publish answer',
          estimated_support_cost: 13.5,
        },
      ],
    });

    await expectSnapshotError({
      ...minimalSnapshot({
        generated: 2,
        drafted_answer_count: 1,
        no_proven_answer_count: 1,
        repeat_ticket_count: 2,
      }),
      locked_questions: [{ rank: 2, ticket_count: '1' }],
    });

    await expectSnapshotError({
      ...minimalSnapshot(),
      teaser: {
        full_answer: {
          rank: 1,
          question: 'Missing source count',
          answer: 'This malformed teaser should fail closed.',
          steps: [],
          answer_evidence_status: 'resolution_evidence',
          resolution_evidence_scope: 'scoped',
          weighted_frequency: 1,
        },
        previews: [],
      },
    });

    expect(consoleErrors.some((entry) => entry.includes('deflection.snapshot.shape_rejected')))
      .toBe(true);
  });
});

describe('deflection artifact client and intake wiring', () => {
  it('uses a 60-second artifact fetch timeout below the results route budget', async () => {
    resetFetch({ payload: minimalArtifact() });
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const artifactResult = await fetchDeflectionArtifact('content-ops-unit-123');

    expect(artifactResult.ok).toBe(true);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 60_000);
    expect(fetchCalls.at(-1)?.url).toBe(
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/artifact',
    );

    const [clientSource, resultsRoute] = await Promise.all([
      readFile(join(webRoot, 'src/lib/atlas-deflection-client.ts'), 'utf8'),
      readFile(
        join(webRoot, 'src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx'),
        'utf8',
      ),
    ]);
    const artifactFetchTimeoutMs = extractNumericConst(clientSource, 'ARTIFACT_FETCH_TIMEOUT_MS');
    const resultsRouteMaxDurationSeconds = extractNumericConst(resultsRoute, 'maxDuration');
    expect(artifactFetchTimeoutMs).toBe(60_000);
    expect(resultsRouteMaxDurationSeconds * 1000).toBeGreaterThan(artifactFetchTimeoutMs);
  });

  it('keeps the record route and intake UI wired to the ATLAS submit flow', async () => {
    const [recordRoute, intakePage, intakeForm] = await Promise.all([
      readFile(join(webRoot, 'src/app/api/gap-report-intake/record/route.ts'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/SupportTicketCsvIntakePage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/SupportTicketCsvIntakeForm.tsx'), 'utf8'),
    ]);
    const intakeSource = `${intakePage}\n${intakeForm}`;

    expect(recordRoute).toContain('submitDeflectionReportCsv');
    expect(recordRoute).toContain('reportRequestId');
    expect(recordRoute).toContain('deflectionSubmitFailureResponse(submit.reason)');
    expect(recordRoute).toContain("status: 'failed_to_submit'");
    expect(recordRoute).toContain('consumeRecordClientRateLimit(request.headers)');
    expect(recordRoute).toContain('consumeRecordEmailRateLimit(meta.value.email)');
    expect(recordRoute).toContain('getRecentGapReportSubmissionByEmailAndBlob');
    expect(recordRoute).toContain("status: 'already_submitted'");
    expect(recordRoute).not.toContain('Deflection report was not generated immediately.');

    expect(intakeSource).toContain('deflectionResultsPath');
    expect(intakeSource).toContain("phase: 'processing'");
    expect(intakeSource).toContain('window.setTimeout');
    expect(intakeSource).toContain('window.location.assign(submission.resultsHref)');
    expect(intakeSource).toContain('disabled={isSubmitting}');
    expect(intakeSource).toContain('aria-busy={isSubmitting}');
    expect(intakeSource).toContain('Snapshot processing steps');
    expect(intakeSource).toContain('Reading the ticket export');
    expect(intakeSource).toContain('Pulling customer wording from tickets');
    expect(intakeSource).toContain('processingHeadingRef');
    expect(intakeSource).toContain('processingHeadingRef.current?.focus()');
    expect(intakeSource).toContain('tabIndex={-1}');
    expect(intakeSource).toContain('Open Snapshot now');
  });
});
