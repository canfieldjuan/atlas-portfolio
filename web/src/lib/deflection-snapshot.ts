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

export type DeflectionSnapshotBlindSpot = {
  rank: number;
  question: string;
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
  top_blind_spots?: DeflectionSnapshotBlindSpot[];
  teaser: DeflectionSnapshotTeaser;
};

/** Path of the free snapshot endpoint for a request (appended to ATLAS_API_BASE_URL).
 *  account_id comes from the authenticated ATLAS scope — never passed here. */
export function deflectionSnapshotPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/snapshot`;
}

// Preview fixture — used by the results route until the live endpoint + auth are
// wired. Realistic higher-volume SaaS shape so the page reviews like the
// larger support teams this offer targets.
// NOT real customer data. The byte-faithful 2-item contract example lives in
// ATLAS docs/frontend/content_ops_faq_deflection_snapshot_example.json.
export const DEMO_DEFLECTION_SNAPSHOT: DeflectionSnapshot = {
  summary: {
    generated: 12,
    drafted_answer_count: 9,
    no_proven_answer_count: 3,
    repeat_ticket_count: 1700,
    source_date_start: '2026-05-01',
    source_date_end: '2026-05-30',
    source_window_days: 30,
  },
  top_questions: [
    {
      rank: 1,
      question: 'How do I cancel my subscription?',
      customer_wording: 'how do i cancel my subscription',
      ticket_count: 310,
      weighted_frequency: 4120,
    },
    {
      rank: 2,
      question: 'Why was I charged twice?',
      customer_wording: 'why was i charged twice this month',
      ticket_count: 240,
      weighted_frequency: 3880,
    },
    {
      rank: 3,
      question: 'How do I change the email on my account?',
      customer_wording: 'change the email on my account',
      ticket_count: 190,
      weighted_frequency: 3010,
    },
    {
      rank: 4,
      question: 'Can I export my data before downgrading?',
      customer_wording: 'export my data before i downgrade',
      ticket_count: 180,
      weighted_frequency: 2450,
    },
    {
      rank: 5,
      question: 'My team seat is not showing up after I invited someone.',
      customer_wording: 'team seat not showing up after invite',
      ticket_count: 160,
      weighted_frequency: 1980,
    },
  ],
  locked_questions: [
    { rank: 6, ticket_count: 140 },
    { rank: 7, ticket_count: 120 },
    { rank: 8, ticket_count: 100 },
    { rank: 9, ticket_count: 80 },
    { rank: 10, ticket_count: 70 },
    { rank: 11, ticket_count: 60 },
    { rank: 12, ticket_count: 50 },
  ],
  top_blind_spots: [
    {
      rank: 7,
      question: 'How do customers pause billing without losing workspace access?',
      ticket_count: 120,
    },
    {
      rank: 9,
      question: 'What should customers do when SSO provisioning gets stuck?',
      ticket_count: 80,
    },
    {
      rank: 11,
      question: 'How are annual renewal credits applied after a plan change?',
      ticket_count: 60,
    },
  ],
  teaser: {
    full_answer: {
      rank: 1,
      question: 'How do I cancel my subscription?',
      answer:
        'To cancel your subscription, open Settings, choose Billing, and select Cancel plan. Keep the confirmation email until the cancellation date shown in Billing.',
      steps: [
        'Open Settings and choose Billing.',
        'Select Cancel plan and review the cancellation date.',
        'Save the confirmation email until the cancellation is complete.',
      ],
      answer_evidence_status: 'resolution_evidence',
      resolution_evidence_scope: 'scoped',
      weighted_frequency: 4120,
      source_count: 310,
    },
    previews: [
      {
        rank: 2,
        question: 'Why was I charged twice?',
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 3880,
        step_count: 2,
        source_count: 240,
        body_withheld: true,
      },
      {
        rank: 3,
        question: 'How do I change the email on my account?',
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 3010,
        step_count: 2,
        source_count: 190,
        body_withheld: true,
      },
    ],
  },
};

export const DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD: DeflectionSnapshot = {
  ...DEMO_DEFLECTION_SNAPSHOT,
  summary: {
    generated: DEMO_DEFLECTION_SNAPSHOT.summary.generated,
    drafted_answer_count: DEMO_DEFLECTION_SNAPSHOT.summary.generated,
    no_proven_answer_count: 0,
    repeat_ticket_count: DEMO_DEFLECTION_SNAPSHOT.summary.repeat_ticket_count,
  },
  top_blind_spots: [],
};
