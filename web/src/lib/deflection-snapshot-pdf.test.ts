import { describe, expect, it } from 'vitest';
import type { DeflectionSnapshot } from '@/lib/deflection-snapshot';
import {
  DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE,
  buildDeflectionSnapshotPdfLines,
  buildDeflectionSnapshotPdfPages,
  createDeflectionSnapshotPdfAttachment,
} from '@/lib/deflection-snapshot-pdf';

const snapshot: DeflectionSnapshot = {
  title: 'Resolution Snapshot',
  summary: {
    generated: 8,
    drafted_answer_count: 1,
    no_proven_answer_count: 3,
    support_ticket_resolution_evidence_present: true,
    support_ticket_resolution_evidence_count: 1,
    repeat_ticket_count: 64,
    non_repeat_ticket_count: 0,
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
      owner_lane: 'Account',
      action_label: 'Publish answer',
      estimated_support_cost: 418.5,
    },
    {
      rank: 2,
      question: 'Why was I charged twice?',
      customer_wording: 'charged twice this month',
      ticket_count: 22,
      weighted_frequency: 71,
      owner_lane: 'Billing',
      action_label: 'Write missing answer',
      estimated_support_cost: 297,
    },
  ],
  locked_questions: [
    {
      rank: 6,
      ticket_count: 12,
    },
  ],
  top_blind_spots: [],
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
    },
    previews: [
      {
        rank: 2,
        question: 'Preview question should not add an answer body.',
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

function pdfTextFromAttachment(attachment: { content: string }) {
  return Buffer.from(attachment.content, 'base64').toString('ascii');
}

describe('Deflection Snapshot PDF email attachment', () => {
  it('builds default Resolution Audit Snapshot lines without leaking locked or source content', () => {
    const lines = buildDeflectionSnapshotPdfLines({
      snapshot,
      companyName: 'Effingham Office Maids, LLC',
      resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
    });
    const text = lines.join('\n');

    expect(text).toMatch(/Resolution Audit Snapshot/);
    expect(text).not.toMatch(/Deflection Snapshot/);
    expect(text).toMatch(/Effingham Office Maids/);
    expect(text).toMatch(/Repeat-ticket hits: 64/);
    expect(text).toMatch(/Support Tax: \$864 in this upload; about \$10,512 annualized/);
    expect(text).toMatch(/export my data before i downgrade/);
    expect(text).toMatch(/Open account settings, choose export data/);
    expect(text).toMatch(/#6: 12 repeat tickets - question text, evidence, and answer body stay locked/);
    expect(text).not.toMatch(/source-secret/);
    expect(text).not.toMatch(/answer-source-secret/);
    expect(text).not.toMatch(/Hidden locked question text/);
    expect(text).not.toMatch(/Hidden locked answer body/);
    expect(text).not.toMatch(/Preview answer body/);
  });

  it('creates a default PDF attachment with safe naming and no locked content', () => {
    const attachment = createDeflectionSnapshotPdfAttachment({
      snapshot,
      companyName: 'Effingham Office Maids, LLC',
      resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
    });
    const pdfText = pdfTextFromAttachment(attachment);

    expect(attachment.filename).toBe('resolution-audit-snapshot-effingham-office-maids-llc.pdf');
    expect(pdfText).toMatch(/^%PDF-1\.4/);
    expect(pdfText).toMatch(/Resolution Audit Snapshot/);
    expect(pdfText).not.toMatch(/Deflection Snapshot/);
    expect(pdfText).toMatch(/xref/);
    expect(pdfText).toMatch(/%%EOF/);
    expect(pdfText).not.toMatch(/source-secret/);
    expect(pdfText).not.toMatch(/Hidden locked question text/);
  });

  it('keeps partner override copy free of audit wording', () => {
    const partnerAttachment = createDeflectionSnapshotPdfAttachment({
      snapshot,
      companyName: 'Partner Co',
      resultsUrl:
        'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123?priceVariant=partner',
      artifactName: 'Deflection Snapshot',
      filenamePrefix: 'deflection-snapshot',
      paidArtifactName: 'Full Deflection Report',
    });
    const partnerPdfText = pdfTextFromAttachment(partnerAttachment);

    expect(partnerAttachment.filename).toBe('deflection-snapshot-partner-co.pdf');
    expect(partnerPdfText).toMatch(/Deflection Snapshot/);
    expect(partnerPdfText).toMatch(/full Deflection Report markdown/);
    expect(partnerPdfText).toMatch(/Full Deflection Report locked preview - Price unavailable/);
    expect(partnerPdfText).not.toMatch(/audit/i);
  });

  it('paginates content-rich snapshots instead of clipping them to one page', () => {
    const contentRichSnapshot: DeflectionSnapshot = {
      ...snapshot,
      top_questions: Array.from({ length: 5 }, (_, index) => ({
        rank: index + 1,
        question: `How do I solve repeat issue ${index + 1} when the customer wording is long enough to wrap inside the PDF export?`,
        customer_wording: `customer wording for repeat issue ${index + 1} that should still fit without clipping the attached snapshot pdf`,
        ticket_count: 50 - index,
        weighted_frequency: 100 - index,
        owner_lane: 'Support',
        action_label: 'Publish answer',
        estimated_support_cost: (50 - index) * 13.5,
      })),
      locked_questions: Array.from({ length: 8 }, (_, index) => ({
        rank: index + 6,
        ticket_count: 40 - index,
      })),
      teaser: {
        ...snapshot.teaser,
        full_answer: {
          ...snapshot.teaser.full_answer!,
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
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages.every((page) => page.length <= DEFLECTION_SNAPSHOT_PDF_LINES_PER_PAGE)).toBe(true);

    const richAttachment = createDeflectionSnapshotPdfAttachment({
      snapshot: contentRichSnapshot,
      companyName: 'Content Rich Co',
      resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-rich',
    });
    const richPdfText = pdfTextFromAttachment(richAttachment);
    expect(richPdfText.match(/\/Type \/Page\b/g) ?? []).toHaveLength(pages.length);
    expect(richPdfText).toMatch(
      /#13: 33 repeat tickets - question text, evidence, and answer body stay locked/,
    );
    expect(richPdfText).not.toMatch(/Hidden locked answer body/);
  });
});
