import type { DeflectionSnapshot } from './deflection-snapshot';
import {
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL,
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  DEFLECTION_FULL_REPORT_PRICE_LABEL,
  formatDeflectionWholeUsd,
} from './deflection-pricing';

export type DeflectionSnapshotPdfAttachment = {
  filename: string;
  content: string;
};

type DeflectionSnapshotPdfInput = {
  snapshot: DeflectionSnapshot;
  companyName?: string;
  resultsUrl?: string | null;
  artifactName?: string;
  filenamePrefix?: string;
  paidArtifactName?: string;
};

const MAX_TEXT_LINE_LENGTH = 92;
export const DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE = 48;
const DEFLECTION_SNAPSHOT_PDF_TITLE = 'Resolution Audit Snapshot';
const DEFLECTION_SNAPSHOT_PDF_FILENAME_PREFIX = 'resolution-audit-snapshot';
const DEFLECTION_FULL_ARTIFACT_NAME = 'Full Resolution Audit';

function asciiText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function safeFilenamePart(value: string | undefined) {
  const cleaned = asciiText(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return cleaned || 'snapshot';
}

function count(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function usd(value: number) {
  return formatDeflectionWholeUsd(value);
}

function lowerInitial(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function sourceWindowLabel(snapshot: DeflectionSnapshot) {
  const { source_date_start: start, source_date_end: end, source_window_days: days } = snapshot.summary;
  if (!start || !end || !days) return 'Source window: uploaded CSV window';
  return `Source window: ${start} to ${end} (${count(days)} days)`;
}

function costProjectionLine(snapshot: DeflectionSnapshot) {
  const batchCost = snapshot.summary.repeat_ticket_count * DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD;
  const { source_window_days: days } = snapshot.summary;
  if (typeof days === 'number' && days > 0) {
    const annualPace = (batchCost / days) * 365;
    return `Support Tax: ${usd(batchCost)} in this upload; about ${usd(annualPace)} annualized at ${DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL} per assisted contact.`;
  }
  return `Support Tax: ${usd(batchCost)} in this upload at ${DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL} per assisted contact.`;
}

function wrapLine(line: string, width = MAX_TEXT_LINE_LENGTH) {
  const cleaned = asciiText(line);
  if (!cleaned) return [''];
  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length > width) {
      lines.push(current);
      current = word;
      continue;
    }
    current = `${current} ${word}`;
  }
  if (current) lines.push(current);
  return lines;
}

function addWrapped(lines: string[], line = '') {
  for (const wrapped of wrapLine(line)) lines.push(wrapped);
}

export function buildDeflectionSnapshotPdfLines(input: DeflectionSnapshotPdfInput) {
  const { snapshot } = input;
  const artifactName = input.artifactName || DEFLECTION_SNAPSHOT_PDF_TITLE;
  const paidArtifactName = input.paidArtifactName || DEFLECTION_FULL_ARTIFACT_NAME;
  const paidArtifactLabel = lowerInitial(paidArtifactName);
  const lines: string[] = [
    artifactName,
    input.companyName ? `Company: ${asciiText(input.companyName)}` : 'Company: Uploaded support-ticket CSV',
    sourceWindowLabel(snapshot),
    '',
    `Repeat-ticket hits: ${count(snapshot.summary.repeat_ticket_count)}`,
    `Drafted answers found: ${count(snapshot.summary.drafted_answer_count)}`,
    `No proven answer yet: ${count(snapshot.summary.no_proven_answer_count)}`,
  ];

  addWrapped(lines, costProjectionLine(snapshot));
  lines.push('');
  addWrapped(
    lines,
    `Privacy boundary: this free ${artifactName} PDF includes only summary counts, top free questions, customer wording, the one free answer teaser, and locked rank/count placeholders.`,
  );
  addWrapped(
    lines,
    `It excludes source IDs, evidence quotes, raw ticket bodies, ${paidArtifactLabel} markdown, and locked answer bodies.`,
  );
  if (input.resultsUrl) {
    lines.push('');
    addWrapped(lines, `Live ${artifactName}: ${input.resultsUrl}`);
  }

  lines.push('', 'Top repeat questions');
  for (const question of snapshot.top_questions.slice(0, 5)) {
    addWrapped(
      lines,
      `#${question.rank} ${question.question} - ${count(question.ticket_count)} tickets; weighted frequency ${count(question.weighted_frequency)}.`,
    );
    const customerWording = asciiText(question.customer_wording);
    if (customerWording) {
      addWrapped(lines, `Customer wording: "${customerWording}"`);
    }
  }

  lines.push('', 'Free answer teaser');
  const answer = snapshot.teaser.full_answer;
  if (answer) {
    addWrapped(lines, `#${answer.rank} ${answer.question}`);
    addWrapped(lines, `Answer: ${answer.answer}`);
    if (answer.steps.length > 0) {
      lines.push('Steps:');
      for (const step of answer.steps.slice(0, 5)) {
        addWrapped(lines, `- ${step}`);
      }
    }
  } else {
    addWrapped(lines, `No proven answer was included in the free teaser for this ${artifactName}.`);
  }

  if (snapshot.locked_questions.length > 0) {
    lines.push('', `${DEFLECTION_FULL_REPORT_PRICE_LABEL} ${paidArtifactName} locked preview`);
    for (const question of snapshot.locked_questions.slice(0, 8)) {
      addWrapped(
        lines,
        `#${question.rank}: ${count(question.ticket_count)} repeat tickets - question text, evidence, and answer body stay locked.`,
      );
    }
  }

  return lines;
}

export function buildDeflectionSnapshotPdfPages(input: DeflectionSnapshotPdfInput) {
  const lines = buildDeflectionSnapshotPdfLines(input);
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[input.artifactName || DEFLECTION_SNAPSHOT_PDF_TITLE]];
}

function pdfString(value: string) {
  return asciiText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function contentStream(lines: string[]) {
  const contentLines = [
    'BT',
    '/F1 10 Tf',
    '72 742 Td',
    '14 TL',
    ...lines.map((line, index) => `${index === 0 ? '' : 'T* '}(${pdfString(line)}) Tj`),
    'ET',
  ];
  return `${contentLines.join('\n')}\n`;
}

function buildPdf(pages: string[][]) {
  const kids = pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`,
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  for (let index = 0; index < pages.length; index += 1) {
    const pageLines = pages[index];
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    const stream = contentStream(pageLines);
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
      `${contentId} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}endstream\nendobj\n`,
    );
  }
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'ascii');
}

export function createDeflectionSnapshotPdfAttachment(
  input: DeflectionSnapshotPdfInput,
): DeflectionSnapshotPdfAttachment {
  const pdf = buildPdf(buildDeflectionSnapshotPdfPages(input));
  const filenamePrefix = safeFilenamePart(input.filenamePrefix || DEFLECTION_SNAPSHOT_PDF_FILENAME_PREFIX);
  return {
    filename: `${filenamePrefix}-${safeFilenamePart(input.companyName)}.pdf`,
    content: pdf.toString('base64'),
  };
}
