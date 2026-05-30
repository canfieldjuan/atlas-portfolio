// Free-tier deflection snapshot — the projection ATLAS serves before payment.
// Canonical contract: ATLAS docs/frontend/content_ops_faq_deflection_checkout_contract.md
// (+ content_ops_faq_report_contract.md). The snapshot intentionally EXCLUDES the
// paid deliverable: no answer text/steps, no evidence quotes, no source IDs.
//
// Live source (wired in the gated follow-up slice, needs ATLAS host + B2B JWT):
//   GET /content-ops/deflection-reports/{request_id}/snapshot  -> DeflectionSnapshot
//   GET /content-ops/deflection-reports/{request_id}/artifact   -> 200 full | 403 locked | 404 none

export type DeflectionSnapshotQuestion = {
  rank: number;
  question: string;
  customer_wording: string;
  weighted_frequency: number;
};

export type DeflectionSnapshot = {
  summary: {
    generated: number;
    drafted_answer_count: number;
    no_proven_answer_count: number;
  };
  top_questions: DeflectionSnapshotQuestion[];
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
    generated: 47,
    drafted_answer_count: 39,
    no_proven_answer_count: 8,
  },
  top_questions: [
    {
      rank: 1,
      question: 'How do I cancel my subscription?',
      customer_wording: 'how do i cancel my subscription',
      weighted_frequency: 412,
    },
    {
      rank: 2,
      question: 'Why was I charged twice?',
      customer_wording: 'why was i charged twice this month',
      weighted_frequency: 388,
    },
    {
      rank: 3,
      question: 'How do I change the email on my account?',
      customer_wording: 'change the email on my account',
      weighted_frequency: 301,
    },
    {
      rank: 4,
      question: 'Can I export my data before downgrading?',
      customer_wording: 'export my data before i downgrade',
      weighted_frequency: 245,
    },
    {
      rank: 5,
      question: 'My team seat is not showing up after I invited someone.',
      customer_wording: 'team seat not showing up after invite',
      weighted_frequency: 198,
    },
  ],
};
