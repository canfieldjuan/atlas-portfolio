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
      "exports.DEFLECTION_FULL_REPORT_PRICE_LABEL = '$1,500';",
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
    buildDeflectionSnapshotPdfLines,
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

  assert.match(text, /Deflection Snapshot/);
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

  assert.equal(attachment.filename, 'deflection-snapshot-effingham-office-maids-llc.pdf');
  assert.match(pdfText, /^%PDF-1\.4/);
  assert.match(pdfText, /Deflection Snapshot/);
  assert.match(pdfText, /xref/);
  assert.match(pdfText, /%%EOF/);
  assert.doesNotMatch(pdfText, /source-secret/);
  assert.doesNotMatch(pdfText, /Hidden locked question text/);

  console.log('Deflection Snapshot PDF email tests passed.');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
