import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-snapshot-pdf-'));
const sourceUrl = new URL('../src/lib/deflection-snapshot-pdf.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-snapshot-pdf.cjs');

try {
  await writeFile(
    join(testDir, 'deflection-pricing.js'),
    [
      'exports.DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD = 13.5;',
      "exports.DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL = '$13.50';",
      "exports.DEFLECTION_PRICE_UNAVAILABLE_LABEL = 'Price unavailable';",
      'exports.formatDeflectionWholeUsd = (value) => `$${Math.round(value).toLocaleString("en-US")}`;',
      '',
    ].join('\n'),
  );

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

  const require = createRequire(compiledPath);
  const {
    DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE,
    buildDeflectionSnapshotPdfLines,
    buildDeflectionSnapshotPdfPages,
    createDeflectionSnapshotPdfAttachment,
  } = require(compiledPath);

  const snapshot = {
    summary: {
      generated: 8,
      drafted_answer_count: 1,
      no_proven_answer_count: 3,
      repeat_ticket_count: 64,
      source_date_start: '2026-05-01',
      source_date_end: '2026-05-30',
      source_window_days: 30,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export my data before downgrading?',
        customer_wording: 'export my data before i downgrade',
        ticket_count: 31,
        weighted_frequency: 92,
        source_ids: ['source-secret-001'],
      },
      {
        rank: 2,
        question: 'Why was I charged twice?',
        customer_wording: 'charged twice this month',
        ticket_count: 22,
        weighted_frequency: 71,
      },
    ],
    locked_questions: [
      {
        rank: 6,
        ticket_count: 12,
        question: 'Hidden locked question text must not render',
        answer: 'Hidden locked answer body must not render',
      },
    ],
    teaser: {
      full_answer: {
        rank: 1,
        question: 'How do I export my data before downgrading?',
        answer: 'Open account settings, choose export data, and wait for the confirmation email.',
        steps: ['Open account settings.', 'Choose export data.', 'Save the confirmation email.'],
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 92,
        source_count: 31,
        source_ids: ['answer-source-secret'],
      },
      previews: [
        {
          rank: 2,
          question: 'Preview question should not add an answer body.',
          answer: 'Preview answer body must not render',
          answer_evidence_status: 'resolution_evidence',
          resolution_evidence_scope: 'scoped',
          weighted_frequency: 71,
          step_count: 2,
          source_count: 22,
          body_withheld: true,
        },
      ],
    },
  };

  const lines = buildDeflectionSnapshotPdfLines({
    snapshot,
    companyName: 'Effingham Office Maids, LLC',
    resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  });
  const text = lines.join('\n');

  assert.match(text, /Resolution Audit Snapshot/);
  assert.doesNotMatch(text, /Deflection Snapshot/);
  assert.match(text, /Effingham Office Maids/);
  assert.match(text, /Repeat-ticket hits: 64/);
  assert.match(text, /Support Tax: \$864 in this upload; about \$10,512 annualized/);
  assert.match(text, /export my data before i downgrade/);
  assert.match(text, /Open account settings, choose export data/);
  assert.match(text, /#6: 12 repeat tickets - question text, evidence, and answer body stay locked/);
  assert.doesNotMatch(text, /source-secret/);
  assert.doesNotMatch(text, /answer-source-secret/);
  assert.doesNotMatch(text, /Hidden locked question text/);
  assert.doesNotMatch(text, /Hidden locked answer body/);
  assert.doesNotMatch(text, /Preview answer body/);

  const attachment = createDeflectionSnapshotPdfAttachment({
    snapshot,
    companyName: 'Effingham Office Maids, LLC',
    resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  });
  const pdf = Buffer.from(attachment.content, 'base64');
  const pdfText = pdf.toString('ascii');

  assert.equal(attachment.filename, 'resolution-audit-snapshot-effingham-office-maids-llc.pdf');
  assert.match(pdfText, /^%PDF-1\.4/);
  assert.match(pdfText, /Resolution Audit Snapshot/);
  assert.doesNotMatch(pdfText, /Deflection Snapshot/);
  assert.match(pdfText, /xref/);
  assert.match(pdfText, /%%EOF/);
  assert.doesNotMatch(pdfText, /source-secret/);
  assert.doesNotMatch(pdfText, /Hidden locked question text/);

  const partnerAttachment = createDeflectionSnapshotPdfAttachment({
    snapshot,
    companyName: 'Partner Co',
    resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123?priceVariant=partner',
    artifactName: 'Deflection Snapshot',
    filenamePrefix: 'deflection-snapshot',
    paidArtifactName: 'Full Deflection Report',
  });
  const partnerPdfText = Buffer.from(partnerAttachment.content, 'base64').toString('ascii');
  assert.equal(partnerAttachment.filename, 'deflection-snapshot-partner-co.pdf');
  assert.match(partnerPdfText, /Deflection Snapshot/);
  assert.match(partnerPdfText, /full Deflection Report markdown/);
  assert.match(partnerPdfText, /Full Deflection Report locked preview - Price unavailable/);
  assert.doesNotMatch(partnerPdfText, /audit/i);

  const contentRichSnapshot = {
    ...snapshot,
    top_questions: Array.from({ length: 5 }, (_, index) => ({
      rank: index + 1,
      question: `How do I solve repeat issue ${index + 1} when the customer wording is long enough to wrap inside the PDF export?`,
      customer_wording: `customer wording for repeat issue ${index + 1} that should still fit without clipping the attached snapshot pdf`,
      ticket_count: 50 - index,
      weighted_frequency: 100 - index,
    })),
    locked_questions: Array.from({ length: 8 }, (_, index) => ({
      rank: index + 6,
      ticket_count: 40 - index,
    })),
    teaser: {
      ...snapshot.teaser,
      full_answer: {
        ...snapshot.teaser.full_answer,
        steps: [
          'Open the settings page and review the current account state.',
          'Confirm the customer has the required permissions before changing anything.',
          'Apply the documented fix and save the confirmation screen.',
          'Send the customer the confirmation email and expected timing.',
          'Escalate only when the documented fix does not resolve the issue.',
        ],
      },
    },
  };
  const pages = buildDeflectionSnapshotPdfPages({
    snapshot: contentRichSnapshot,
    companyName: 'Content Rich Co',
    resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-rich',
  });
  assert(
    pages.length >= 2,
    'content-rich snapshots should paginate instead of clipping to a single page',
  );
  assert(
    pages.every((page) => page.length <= DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE),
    'each PDF page should stay inside the line budget',
  );

  const richAttachment = createDeflectionSnapshotPdfAttachment({
    snapshot: contentRichSnapshot,
    companyName: 'Content Rich Co',
    resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-rich',
  });
  const richPdfText = Buffer.from(richAttachment.content, 'base64').toString('ascii');
  assert.equal((richPdfText.match(/\/Type \/Page\b/g) ?? []).length, pages.length);
  assert.match(richPdfText, /#13: 33 repeat tickets - question text, evidence, and answer body stay locked/);
  assert.doesNotMatch(richPdfText, /Hidden locked answer body/);

  console.log('Resolution Audit Snapshot PDF email tests passed.');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
