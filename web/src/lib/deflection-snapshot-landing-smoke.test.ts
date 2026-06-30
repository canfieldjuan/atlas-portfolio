import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { DEMO_DEFLECTION_REPORT_MODEL } from '@/lib/deflection-report-demo';
import {
  DEFLECTION_SNAPSHOT_LOCKED_QUESTION_FIELDS,
  DEFLECTION_SNAPSHOT_TEASER_FULL_ANSWER_FIELDS,
  DEFLECTION_SNAPSHOT_TEASER_PREVIEW_FIELDS,
  DEFLECTION_SNAPSHOT_TOP_BLIND_SPOT_FIELDS,
  DEFLECTION_SNAPSHOT_TOP_QUESTION_FIELDS,
  DEMO_DEFLECTION_SNAPSHOT,
  DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD,
} from '@/lib/deflection-snapshot';

type FetchCall = { url: string; init: RequestInit };
type FetchResponse = { status?: number; body?: string; reject?: string };
type SmokeResult = Record<string, unknown>;
type SmokeRunner = (
  options?: Record<string, unknown>,
  deps?: { fetchImpl?: typeof fetch; now?: () => string },
) => Promise<SmokeResult>;

const SNAPSHOT_URL = 'https://portfolio.example.com/systems/support-ticket-deflection/snapshot';
const MARKER_KEYS = [
  'snapshotBadge',
  'promiseHeadline',
  'heroProofStrip',
  'inlineForm',
  'supportPlatformField',
  'resolutionReportCta',
  'submitSecurityLine',
  'deterministicBadge',
  'supportTaxProjection',
  'assistedContactCost',
  'valueAnchor',
  'blindSpots',
  'lockedReportPreview',
  'lockedPreviewPriorityFixQueue',
  'lockedPreviewTopUnresolvedRepeats',
  'lockedPreviewDraftedResolutions',
  'lockedPreviewCoveredRecurring',
  'lockedPreviewBacklogTable',
  'lockedPreviewOutcomeDiagnostics',
  'lockedPreviewQuestionDetails',
  'snapshotFirst',
  'finalSnapshotAsk',
  'ctaLabel',
];
const GOOD_HTML = [
  '<main>',
  '<span data-smoke="snapshotBadge">Any badge</span>',
  '<h1 data-smoke="promiseHeadline">Any promise</h1>',
  '<section data-smoke="heroProofStrip">Any hero proof strip</section>',
  '<section data-smoke="inlineForm uploadEyebrow">',
  '<select data-smoke="supportPlatformField"></select>',
  '<button data-smoke="resolutionReportCta submitCta">Any submit</button>',
  '<p data-smoke="submitSecurityLine">Any submit reassurance</p>',
  '<p data-smoke="deterministicBadge">Any trust badge</p>',
  '</section>',
  '<section data-smoke="supportTaxProjection assistedContactCost valueAnchor">Any value band</section>',
  '<section data-smoke="blindSpots">Any blind spots section</section>',
  '<section data-smoke="lockedReportPreview">',
  '<article data-smoke="lockedPreviewPriorityFixQueue">Any priority preview</article>',
  '<article data-smoke="lockedPreviewTopUnresolvedRepeats">Any unresolved preview</article>',
  '<article data-smoke="lockedPreviewDraftedResolutions">Any drafted preview</article>',
  '<article data-smoke="lockedPreviewCoveredRecurring">Any covered preview</article>',
  '<article data-smoke="lockedPreviewBacklogTable">Any backlog preview</article>',
  '<article data-smoke="lockedPreviewOutcomeDiagnostics">Any outcome preview</article>',
  '<article data-smoke="lockedPreviewQuestionDetails">Any detail preview</article>',
  '</section>',
  '<section data-smoke="snapshotFirst finalSnapshotAsk">Any final ask</section>',
  '<a data-smoke="ctaLabel" href="/systems/support-ticket-deflection/intake">Any CTA</a>',
  '</main>',
].join('');
const lockedPreviewSectionIds = [
  'priority_fix_queue',
  'top_unresolved_repeats',
  'drafted_resolutions',
  'already_covered_still_recurring',
  'backlog_table',
  'outcome_diagnostics',
  'suppressed_repeat_review_queue',
  'question_details',
];
const generatedDemoSectionIds = [
  'support_tax',
  'seo_targets',
  'ranked_questions',
  'priority_fix_queue',
  'top_unresolved_repeats',
  'drafted_resolutions',
  'already_covered_still_recurring',
  'backlog_table',
  'outcome_diagnostics',
  'suppressed_repeat_review_queue',
  'question_details',
  'complete_evidence',
];
const lockedPreviewSmokeMarkers = [
  'lockedPreviewPriorityFixQueue',
  'lockedPreviewTopUnresolvedRepeats',
  'lockedPreviewDraftedResolutions',
  'lockedPreviewCoveredRecurring',
  'lockedPreviewBacklogTable',
  'lockedPreviewOutcomeDiagnostics',
  'lockedPreviewQuestionDetails',
];

const webRoot = process.cwd();
let runDeflectionSnapshotLandingSmoke: SmokeRunner;

function sortedKeys(value: unknown) {
  return Object.keys(value as Record<string, unknown>).sort();
}

function objectRows(value: unknown) {
  return Array.isArray(value)
    ? value.filter((row) => typeof row === 'object' && row !== null && !Array.isArray(row))
    : [];
}

function expectArrayFieldSet(items: unknown[], expectedKeys: string[], name: string) {
  expect(items.length, `${name}: expected at least one item`).toBeGreaterThan(0);
  for (const [index, item] of items.entries()) {
    expect(sortedKeys(item), `${name}: item ${index}`).toEqual(expectedKeys);
  }
}

function expectSnapshotShapeMatchesReference(
  snapshot: typeof DEMO_DEFLECTION_SNAPSHOT,
  reference: typeof DEMO_DEFLECTION_SNAPSHOT,
  expectedTopLevelKeys: string[],
  expectedFieldSets: {
    topQuestions: string[];
    lockedQuestions: string[];
    topBlindSpots: string[];
    teaserFullAnswer: string[];
    teaserPreviews: string[];
  },
  name: string,
) {
  expect(sortedKeys(snapshot), `${name}: top-level keys`).toEqual(expectedTopLevelKeys);
  expectArrayFieldSet(snapshot.top_questions, expectedFieldSets.topQuestions, `${name}: top_questions`);
  if (snapshot.locked_questions.length > 0) {
    expectArrayFieldSet(
      snapshot.locked_questions,
      expectedFieldSets.lockedQuestions,
      `${name}: locked_questions`,
    );
  } else {
    expect(snapshot.locked_questions, `${name}: locked_questions empty branch`).toEqual([]);
  }
  expectArrayFieldSet(
    snapshot.top_blind_spots,
    expectedFieldSets.topBlindSpots,
    `${name}: top_blind_spots`,
  );
  expect(sortedKeys(snapshot.teaser.full_answer), `${name}: teaser full_answer`).toEqual(
    expectedFieldSets.teaserFullAnswer,
  );
  if (snapshot.teaser.previews.length > 0) {
    expectArrayFieldSet(snapshot.teaser.previews, expectedFieldSets.teaserPreviews, `${name}: teaser previews`);
  } else {
    expect(snapshot.teaser.previews, `${name}: teaser previews empty branch`).toEqual([]);
  }

  for (const key of [
    'generated',
    'drafted_answer_count',
    'no_proven_answer_count',
    'repeat_ticket_count',
  ]) {
    expect(snapshot.summary).toHaveProperty(key);
    expect(reference.summary).toHaveProperty(key);
  }
}

function expectBlindSpotRanksMatchOwningRows(
  snapshot: typeof DEMO_DEFLECTION_SNAPSHOT,
  reportModel: typeof DEMO_DEFLECTION_REPORT_MODEL,
  name: string,
) {
  const topQuestionsByRank = new Map(
    snapshot.top_questions.map((question) => [question.rank, question]),
  );
  const rankedRows = reportModel.sections.find((section) => section.id === 'ranked_questions')?.data
    ?.rows ?? [];
  const rankedRowsByRank = new Map(objectRows(rankedRows).map((row) => [row.rank, row]));

  for (const blindSpot of snapshot.top_blind_spots) {
    const topQuestion = topQuestionsByRank.get(blindSpot.rank);
    if (topQuestion) {
      expect(blindSpot.question, `${name}: blind spot rank ${blindSpot.rank} text`).toBe(
        topQuestion.question,
      );
      expect(blindSpot.ticket_count, `${name}: blind spot rank ${blindSpot.rank} count`).toBe(
        topQuestion.ticket_count,
      );
      continue;
    }
    const rankedRow = rankedRowsByRank.get(blindSpot.rank);
    expect(rankedRow, `${name}: rank ${blindSpot.rank} should map to a ranked row`).toBeTruthy();
    expect(blindSpot.question).toBe(rankedRow?.question);
    expect(blindSpot.ticket_count).toBe(rankedRow?.ticket_count);
  }
}

function expectSnapshotCostsMatchReport(
  snapshot: typeof DEMO_DEFLECTION_SNAPSHOT,
  reportModel: typeof DEMO_DEFLECTION_REPORT_MODEL,
  name: string,
) {
  const rankedRows = reportModel.sections.find((section) => section.id === 'ranked_questions')?.data
    ?.rows ?? [];
  const rankedRowsByQuestion = new Map(objectRows(rankedRows).map((row) => [row.question, row]));

  for (const row of [...snapshot.top_questions, ...snapshot.top_blind_spots]) {
    const rankedRow = rankedRowsByQuestion.get(row.question);
    expect(rankedRow, `${name}: ${row.question} should map to a ranked row`).toBeTruthy();
    expect(row.estimated_support_cost, `${name}: ${row.question} cost`).toBe(
      rankedRow?.estimated_support_cost,
    );
  }
}

function expectSyntheticSourceIds(value: unknown, name: string) {
  if (!Array.isArray(value)) return;
  for (const sourceId of value) {
    expect(typeof sourceId, `${name}: source ID should be a string`).toBe('string');
    expect(sourceId, `${name}: source ID namespace`).toMatch(/^synthetic-[a-z0-9-]+-\d{4}$/);
  }
}

function expectSyntheticEvidenceRows(value: unknown, name: string) {
  for (const row of objectRows(value)) {
    expectSyntheticSourceIds([row.source_id], name);
    const quote = typeof row.evidence_quote === 'string' ? row.evidence_quote : '';
    expect(quote.includes('@'), `${name}: synthetic evidence quote should not contain emails`).toBe(
      false,
    );
  }
}

function makeFetchMock(response: FetchResponse) {
  const calls: FetchCall[] = [];
  const fetchImpl = async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    if (response.reject) throw new Error(response.reject);
    return new Response(response.body ?? '', { status: response.status ?? 200 });
  };
  return { fetchImpl, calls };
}

async function run({
  baseUrl = 'https://portfolio.example.com/',
  response = {},
}: {
  baseUrl?: string;
  response?: FetchResponse;
} = {}) {
  const { fetchImpl, calls } = makeFetchMock({ body: GOOD_HTML, ...response });
  const result = await runDeflectionSnapshotLandingSmoke(
    { baseUrl },
    { fetchImpl: fetchImpl as typeof fetch, now: () => '2026-06-04T00:30:00.000Z' },
  );
  return { result, calls };
}

async function runCli(args: string[]) {
  const child = spawn(
    process.execPath,
    [join(webRoot, 'scripts/smoke-deflection-snapshot-landing.mjs'), ...args],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const code = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  return { code, stdout, stderr };
}

beforeAll(async () => {
  const smokeModule = await import('../../scripts/smoke-deflection-snapshot-landing.mjs');
  runDeflectionSnapshotLandingSmoke = smokeModule.runDeflectionSnapshotLandingSmoke;
});

describe('deflection Snapshot landing smoke real fixtures', () => {
  it('keeps generated Snapshot fixtures aligned to the report model', async () => {
    const groundTruth = JSON.parse(
      await readFile(join(webRoot, 'plans/deflection-snapshot-report-groundtruth.json'), 'utf8'),
    );
    const referenceSnapshot = groundTruth.snapshot as typeof DEMO_DEFLECTION_SNAPSHOT;
    const expectedSnapshotTopLevelKeys = [
      ...(groundTruth._meta.snapshot_top_level_keys as string[]),
    ].sort();
    const expectedFieldSets = {
      topQuestions: [...DEFLECTION_SNAPSHOT_TOP_QUESTION_FIELDS].sort(),
      lockedQuestions: [...DEFLECTION_SNAPSHOT_LOCKED_QUESTION_FIELDS].sort(),
      topBlindSpots: [...DEFLECTION_SNAPSHOT_TOP_BLIND_SPOT_FIELDS].sort(),
      teaserFullAnswer: [...DEFLECTION_SNAPSHOT_TEASER_FULL_ANSWER_FIELDS].sort(),
      teaserPreviews: [...DEFLECTION_SNAPSHOT_TEASER_PREVIEW_FIELDS].sort(),
    };

    expect(groundTruth._meta.top_blind_spots_emitted).toBe(true);
    expect(
      (groundTruth._meta.demo_deltas as string[]).some((delta) =>
        delta.includes('NEVER emitted by the snapshot'),
      ),
    ).toBe(false);
    expect(sortedKeys(referenceSnapshot)).toEqual(expectedSnapshotTopLevelKeys);
    expectSnapshotShapeMatchesReference(
      DEMO_DEFLECTION_SNAPSHOT,
      referenceSnapshot,
      expectedSnapshotTopLevelKeys,
      expectedFieldSets,
      'Primary demo Snapshot',
    );
    expect(DEMO_DEFLECTION_SNAPSHOT.top_blind_spots.length).toBeGreaterThan(0);
    expect(
      DEMO_DEFLECTION_SNAPSHOT.top_blind_spots.some(
        (blindSpot, index) => blindSpot.rank !== index + 1,
      ),
    ).toBe(true);
    expectBlindSpotRanksMatchOwningRows(
      DEMO_DEFLECTION_SNAPSHOT,
      DEMO_DEFLECTION_REPORT_MODEL,
      'Primary demo Snapshot',
    );
    expectSnapshotCostsMatchReport(
      DEMO_DEFLECTION_SNAPSHOT,
      DEMO_DEFLECTION_REPORT_MODEL,
      'Primary demo Snapshot',
    );
    expect(sortedKeys(DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD)).toEqual(expectedSnapshotTopLevelKeys);
    expect(DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD.top_blind_spots).toEqual([]);
    for (const key of ['source_date_start', 'source_date_end', 'source_window_days']) {
      expect(DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD.summary).not.toHaveProperty(key);
    }
    expect(DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD.summary.no_proven_answer_count).toBe(0);
    expect(DEMO_DEFLECTION_REPORT_MODEL.sections.map((section) => section.id)).toEqual(
      generatedDemoSectionIds,
    );
  });

  it('keeps Snapshot, locked-preview, and paid-report source contracts aligned', async () => {
    const [
      snapshotLandingSource,
      lockedPreviewSource,
      reportModelPageSource,
      reportModelContractSource,
      snapshotFixtureSource,
      reportDemoFixtureSource,
      generatedDemoSource,
      intakeFormSource,
      supportDeflectionLayoutSource,
      globalsSource,
    ] = await Promise.all([
      readFile(join(webRoot, 'src/components/landing/DeflectionSnapshotLandingPage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionLockedReportPreview.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionReportModelPage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/lib/deflection-report-model-contract.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/deflection-snapshot.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/deflection-report-demo.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/deflection-demo-example.ts'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/SupportTicketCsvIntakeForm.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/app/systems/support-ticket-deflection/layout.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/app/globals.css'), 'utf8'),
    ]);
    const compactSnapshotLandingSource = snapshotLandingSource.replace(/\s+/g, ' ');
    const submitSecurityLineIndex = intakeFormSource.indexOf('data-smoke="submitSecurityLine"');
    const submitCtaIndex = intakeFormSource.indexOf('data-smoke="resolutionReportCta submitCta"');

    expect(snapshotFixtureSource).toContain("from './deflection-demo-example'");
    expect(reportDemoFixtureSource).toContain("from './deflection-demo-example'");
    expect(generatedDemoSource).toContain('content_ops_faq_deflection_report_example.json');
    expect(generatedDemoSource).toContain('content_ops_faq_deflection_snapshot_example.json');
    expect(snapshotLandingSource).toContain('Top Proven Resolutions');
    expect(snapshotLandingSource).toContain('const provenQuestions = top_questions.filter');
    expect(snapshotLandingSource).toContain('questions={provenQuestions}');
    expect(snapshotLandingSource).toContain('locked_questions.length > 0');
    expect(snapshotLandingSource.indexOf("label: 'Estimated Support Tax'")).toBeLessThan(
      snapshotLandingSource.indexOf("label: 'Repeat Contacts'"),
    );
    expect(snapshotLandingSource.indexOf("label: 'Repeat Contacts'")).toBeLessThan(
      snapshotLandingSource.indexOf("label: 'Draft + Gap'"),
    );
    expect(snapshotLandingSource).not.toContain("label: 'Remaining backlog'");
    expect(snapshotLandingSource).toContain("sourceOffer: 'support-ticket-deflection-intake'");
    expect(snapshotLandingSource).not.toContain("sourceOffer: 'hero_intake'");
    expect(snapshotLandingSource).toContain("const CTA_LABEL = 'Start Your Forensic Audit';");
    expect(snapshotLandingSource).toContain('submitLabel: CTA_LABEL');
    expect(snapshotLandingSource).toContain('Deflect tickets by actually resolving them.');
    expect(intakeFormSource).toContain('Identify the cost exposure behind your unresolved questions.');
    expect(intakeFormSource).toContain('data-smoke="submitSecurityLine"');
    expect(intakeFormSource).toContain('data-smoke="deterministicBadge"');
    expect(supportDeflectionLayoutSource).toContain('ZERO Generative AI Models');
    expect(supportDeflectionLayoutSource).toContain('Private encrypted storage + browser and backend PII controls');
    expect(supportDeflectionLayoutSource).not.toContain('AES-256');
    expect(supportDeflectionLayoutSource).not.toContain('VPC isolated');
    expect(submitSecurityLineIndex).toBeGreaterThanOrEqual(0);
    expect(submitSecurityLineIndex).toBeLessThan(submitCtaIndex);
    expect(snapshotLandingSource).toContain('data-smoke="heroProofStrip"');
    expect(snapshotLandingSource).toContain('data-smoke="blindSpots"');
    expect(snapshotLandingSource).toContain('DEMO_DEFLECTION_REPORT_MODEL');
    expect(snapshotLandingSource).toContain('<SnapshotArtifact');
    expect(compactSnapshotLandingSource).toContain(
      '<section className="section-band section-band-wide"> <div className="mx-auto max-w-7xl">',
    );
    expect(globalsSource).toContain('.section-band-wide');
    expect(globalsSource).toContain('calc((100vw - 80rem) / 2)');
    expect(snapshotLandingSource).toContain('<DeflectionLockedReportPreview');
    expect(snapshotLandingSource.indexOf('<SnapshotArtifact')).toBeLessThan(
      snapshotLandingSource.indexOf('<DeflectionLockedReportPreview'),
    );

    expect(
      lockedPreviewSectionIds.filter((sectionId) =>
        DEMO_DEFLECTION_REPORT_MODEL.sections.some((section) => section.id === sectionId),
      ),
    ).toEqual(lockedPreviewSectionIds);
    for (const sectionId of lockedPreviewSectionIds) {
      expect(reportModelContractSource).toContain(`"${sectionId}"`);
    }
    for (const smokeMarker of lockedPreviewSmokeMarkers) {
      expect(lockedPreviewSource).toContain(smokeMarker);
    }
    expect(lockedPreviewSource).toMatch(
      /data-smoke="lockedReportPreview"[\s\S]*className="section-band section-band-muted section-band-wide"[\s\S]*<div className="mx-auto max-w-7xl">/,
    );
    expect(lockedPreviewSource).toContain('hasPreviewRows(section)');

    for (const section of DEMO_DEFLECTION_REPORT_MODEL.sections) {
      const data = section.data;
      if ('items' in data) {
        expect(Array.isArray(data.items), `${section.id} items should stay an array`).toBe(true);
        if (data.items.length === 0) {
          expect(['already_covered_still_recurring', 'suppressed_repeat_review_queue']).toContain(
            section.id,
          );
          continue;
        }
        for (const item of data.items) {
          expectSyntheticEvidenceRows(item.top_evidence, `${section.id} demo item`);
        }
      }
      if ('rows' in data) {
        expect(Array.isArray(data.rows), `${section.id} rows should stay an array`).toBe(true);
        expect(data.rows.length, `${section.id} should keep representative rows`).toBeGreaterThan(0);
        for (const row of data.rows) {
          expectSyntheticSourceIds(row.source_ids, `${section.id} demo row`);
          for (const quote of Array.isArray(row.evidence_quotes) ? row.evidence_quotes : []) {
            expect(typeof quote).toBe('string');
            expect(quote.includes('@')).toBe(false);
          }
        }
      }
    }

    for (const label of [
      'Priority Fix Queue',
      'Top Unresolved Repeats',
      'Drafted Resolutions',
      'Already Covered but Still Recurring',
      'Backlog Table',
      'Resolution outcome diagnostics',
      'Suppressed Repeat Review Queue',
      'Top publishable answers and gaps',
      'Question/theme',
      'Status',
      'Hide reason',
      'Repeats',
      'Cost',
      'CSAT',
      'Owner lane',
      'Next action',
    ]) {
      expect(reportModelPageSource).toContain(label);
      expect(lockedPreviewSource).toContain(label);
    }

    for (const expected of [
      'Estimated Support Tax',
      'Repeat Contacts',
      'Draft + Gap',
      'one agent-backed answer and one unresolved finding',
      'grouped into ${formatInteger(summary.generated)} ranked question clusters',
      'Customer wording &rarr; your long-tail SEO target list',
      'const customerWordingExamples = top_questions',
      'aria-label="Customer wording examples"',
      'A preview of the truth.',
      'The mechanism behind the audit.',
      'The Anatomy of a Finding',
      'The Audit Trail',
      'A Diagnostic, Not a Dashboard',
      'Decide if an audit is worth the investment before you commit.',
      'When the upload includes customer phrasing',
      'stays hidden instead of inventing terms',
      'SEO outcomes are not guaranteed rankings',
    ]) {
      expect(snapshotLandingSource).toContain(expected);
    }
    expect(compactSnapshotLandingSource).toContain(
      'the volume of repeat tickets, the strength of existing agent resolution evidence, the estimated support cost, and the original source tickets.',
    );
    expect(snapshotLandingSource).not.toContain('Repeat-ticket hits');
    expect(snapshotLandingSource).not.toContain('Support Tax estimate');
    expect(snapshotLandingSource).not.toContain('Included draft');
    expect(compactSnapshotLandingSource).toContain(
      'Every drafted resolution is anchored to source ticket IDs.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'we mark the issue as "no proven answer" rather than inventing a solution.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'It separates ready-to-review documentation drafts from product or policy gaps',
    );
    expect(compactSnapshotLandingSource).toContain(
      'Upload your support-ticket CSV to receive a Snapshot. You will immediately see your top deflection topic and a summary count.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'If the data is thin, you have a bounded starting point instead of a sales pitch.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'If the data warrants it, the full report provides a ranked, source-backed action queue.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'draft answers anchored to real agent resolutions and a list of operational blind spots.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'We do not promise guaranteed savings. We promise a usable audit trail.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'ranked, source-backed queue of questions and answers, we will correct the findings.',
    );
    expect(compactSnapshotLandingSource).toContain(
      'SEO outcomes vary; we make no ranking guarantees.',
    );

    for (const forbidden of [
      'Built for you to take action today: Fix the most unresolved questions now.',
      'No LLM or Model touches your data',
      'Upload your Zendesk or Freshdesk CSV to receive a Snapshot.',
      'Start with the Snapshot before you commit to a deeper audit.',
      'entirely-new findings',
      'Customer wording can become the target list',
    ]) {
      expect(snapshotLandingSource).not.toContain(forbidden);
    }
  });

  it('validates Snapshot landing smoke helper success and failure modes', async () => {
    const success = await run({
      response: { body: `${GOOD_HTML}<template>This page could not be found</template>` },
    });
    expect(success.result).toEqual({
      ok: true,
      mode: 'DEFLECTION_SNAPSHOT_LANDING_SMOKE',
      apiCalls: true,
      checkedAt: '2026-06-04T00:30:00.000Z',
      baseUrl: 'https://portfolio.example.com',
      url: SNAPSHOT_URL,
      markers: Object.fromEntries(MARKER_KEYS.map((key) => [key, true])),
    });
    expect(success.calls).toHaveLength(1);
    expect(success.calls[0].url).toBe(SNAPSHOT_URL);
    expect(success.calls[0].init.cache).toBe('no-store');

    const failureCases: Array<[
      string,
      Parameters<typeof run>[0],
      number | undefined,
      Record<string, unknown>,
    ]> = [
      [
        'invalid base URL',
        { baseUrl: 'http://evil.example.com' },
        0,
        {
          ok: false,
          error: 'Deflection Snapshot landing smoke base URL is invalid.',
          apiCalls: false,
        },
      ],
      [
        'HTTP failure',
        { response: { status: 404, body: 'not found' } },
        1,
        {
          ok: false,
          stage: 'fetch',
          error: 'Snapshot landing page failed with HTTP 404.',
          apiCalls: true,
        },
      ],
      [
        'network failure',
        { response: { reject: 'network reset' } },
        1,
        {
          ok: false,
          stage: 'fetch',
          error: 'Snapshot landing page fetch failed before an HTTP response.',
          apiCalls: true,
        },
      ],
      [
        'missing inline form marker',
        {
          response: {
            body: GOOD_HTML.replace(
              'data-smoke="inlineForm uploadEyebrow"',
              'data-smoke="uploadEyebrow"',
            ),
          },
        },
        undefined,
        {
          ok: false,
          stage: 'render',
          error: 'Snapshot landing page is missing required render markers.',
          missing: ['inlineForm'],
          forbidden: [],
        },
      ],
      [
        'missing support platform marker',
        { response: { body: GOOD_HTML.replace('data-smoke="supportPlatformField"', '') } },
        undefined,
        {
          ok: false,
          stage: 'render',
          error: 'Snapshot landing page is missing required render markers.',
          missing: ['supportPlatformField'],
          forbidden: [],
        },
      ],
      [
        'paid-report-first copy',
        { response: { body: `${GOOD_HTML}<p>Full report unlock</p>` } },
        undefined,
        {
          ok: false,
          stage: 'render',
          error: 'Snapshot landing page rendered forbidden paid-report-first copy.',
          missing: [],
          forbidden: ['fullReportUnlockMetric'],
        },
      ],
      [
        'rendered error marker',
        { response: { body: 'Application error' } },
        undefined,
        {
          ok: false,
          stage: 'render',
          error: 'Snapshot landing page rendered an error marker: Application error.',
          missing: MARKER_KEYS,
        },
      ],
    ];

    for (const [name, options, expectedCalls, expected] of failureCases) {
      const result = await run(options);
      expect(result.result, name).toMatchObject(expected);
      if (expectedCalls !== undefined) expect(result.calls, name).toHaveLength(expectedCalls);
    }
  });

  it('keeps the Snapshot landing CLI bare-output guard', async () => {
    const result = await runCli(['--output', '--json']);

    expect(result.code).toBe(1);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe('Refusing to continue without --output <path>.');
  });
});
