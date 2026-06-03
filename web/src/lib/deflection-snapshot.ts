// Free-tier deflection snapshot — the projection ATLAS serves before payment.
// Canonical contract: ATLAS docs/frontend/content_ops_faq_deflection_checkout_contract.md
// (+ content_ops_faq_report_contract.md). The snapshot intentionally EXCLUDES the
// paid deliverable: no evidence quotes, no source IDs, no Markdown, and no
// answer bodies outside the bounded teaser.
//
// Live source (wired in the gated follow-up slice, needs ATLAS host + B2B JWT):
//   GET /content-ops/deflection-reports/{request_id}/snapshot  -> DeflectionSnapshot
//   GET /content-ops/deflection-reports/{request_id}/artifact   -> 200 full | 403 locked | 404 none

export type DeflectionSnapshotQuestion = {
  rank: number;
  question: string;
  customer_wording: string;
  ticket_count: number;
  weighted_frequency: number;
};

export type DeflectionSnapshotLockedQuestion = {
  rank: number;
  ticket_count: number;
};

export type DeflectionSnapshotFullAnswer = {
  rank: number;
  question: string;
  answer: string;
  steps: string[];
  answer_evidence_status: 'resolution_evidence';
  resolution_evidence_scope: 'scoped';
  weighted_frequency: number;
  source_count: number;
};

export type DeflectionSnapshotAnswerPreview = {
  rank: number;
  question: string;
  answer_evidence_status: 'resolution_evidence';
  resolution_evidence_scope: 'scoped';
  weighted_frequency: number;
  step_count: number;
  source_count: number;
  body_withheld: true;
};

export type DeflectionSnapshotTeaser = {
  full_answer: DeflectionSnapshotFullAnswer | null;
  previews: DeflectionSnapshotAnswerPreview[];
};

export type DeflectionSnapshotSourceWindow = {
  source_date_start: string;
  source_date_end: string;
  source_window_days: number;
};

export type DeflectionSnapshot = {
  summary: {
    generated: number;
    drafted_answer_count: number;
    no_proven_answer_count: number;
    repeat_ticket_count: number;
  } & Partial<DeflectionSnapshotSourceWindow>;
  top_questions: DeflectionSnapshotQuestion[];
  locked_questions: DeflectionSnapshotLockedQuestion[];
  teaser: DeflectionSnapshotTeaser;
};

/** Path of the free snapshot endpoint for a request (appended to ATLAS_API_BASE_URL).
 *  account_id comes from the authenticated ATLAS scope — never passed here. */
export function deflectionSnapshotPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/snapshot`;
}

// Preview fixture — used by the results route until the live endpoint + auth are
// wired. Realistic 5-question SaaS shape so the page reviews like production.
// NOT real customer data. The byte-faithful 2-item contract example lives in
// ATLAS docs/frontend/content_ops_faq_deflection_snapshot_example.json.
export const DEMO_DEFLECTION_SNAPSHOT: DeflectionSnapshot = {
  summary: {
    generated: 12,
    drafted_answer_count: 9,
    no_proven_answer_count: 3,
    repeat_ticket_count: 170,
    source_date_start: '2026-05-01',
    source_date_end: '2026-05-30',
    source_window_days: 30,
  },
  top_questions: [
    {
      rank: 1,
      question: 'How do I cancel my subscription?',
      customer_wording: 'how do i cancel my subscription',
      ticket_count: 31,
      weighted_frequency: 412,
    },
    {
      rank: 2,
      question: 'Why was I charged twice?',
      customer_wording: 'why was i charged twice this month',
      ticket_count: 24,
      weighted_frequency: 388,
    },
    {
      rank: 3,
      question: 'How do I change the email on my account?',
      customer_wording: 'change the email on my account',
      ticket_count: 19,
      weighted_frequency: 301,
    },
    {
      rank: 4,
      question: 'Can I export my data before downgrading?',
      customer_wording: 'export my data before i downgrade',
      ticket_count: 18,
      weighted_frequency: 245,
    },
    {
      rank: 5,
      question: 'My team seat is not showing up after I invited someone.',
      customer_wording: 'team seat not showing up after invite',
      ticket_count: 16,
      weighted_frequency: 198,
    },
  ],
  locked_questions: [
    { rank: 6, ticket_count: 14 },
    { rank: 7, ticket_count: 12 },
    { rank: 8, ticket_count: 10 },
    { rank: 9, ticket_count: 8 },
    { rank: 10, ticket_count: 7 },
    { rank: 11, ticket_count: 6 },
    { rank: 12, ticket_count: 5 },
  ],
  teaser: {
    full_answer: {
      rank: 4,
      question: 'Can I export my data before downgrading?',
      answer:
        'To export your data before downgrading, open Settings, choose Billing, and select Export workspace data. Keep the export confirmation email until the downgrade completes.',
      steps: [
        'Open Settings and choose Billing.',
        'Select Export workspace data before changing the plan.',
        'Wait for the export confirmation email, then complete the downgrade.',
      ],
      answer_evidence_status: 'resolution_evidence',
      resolution_evidence_scope: 'scoped',
      weighted_frequency: 245,
      source_count: 18,
    },
    previews: [
      {
        rank: 1,
        question: 'How do I cancel my subscription?',
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 412,
        step_count: 3,
        source_count: 31,
        body_withheld: true,
      },
      {
        rank: 2,
        question: 'Why was I charged twice?',
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 388,
        step_count: 2,
        source_count: 24,
        body_withheld: true,
      },
    ],
  },
};
