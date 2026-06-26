// Free-tier deflection snapshot — the projection ATLAS serves before payment.
// Canonical contract: ATLAS docs/frontend/content_ops_faq_deflection_checkout_contract.md
// (+ content_ops_faq_report_contract.md). The snapshot intentionally EXCLUDES the
// paid deliverable: no evidence quotes, no source IDs, no Markdown, and no
// answer bodies outside the bounded teaser.
//
// Live source:
//   GET /content-ops/deflection-reports/{request_id}/snapshot  -> DeflectionSnapshot
//   GET /content-ops/deflection-reports/{request_id}/artifact   -> 200 full | 403 locked | 404 none

import { DEMO_DEFLECTION_SNAPSHOT as GENERATED_DEMO_DEFLECTION_SNAPSHOT } from './deflection-demo-example';
import type { DeflectionSnapshot } from './deflection-snapshot-contract';

export * from './deflection-snapshot-contract';

/** Path of the free snapshot endpoint for a request (appended to ATLAS_API_BASE_URL).
 *  account_id comes from the authenticated ATLAS scope — never passed here. */
export function deflectionSnapshotPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/snapshot`;
}

// Primary public demo fixture. This is generated from the ATLAS paired synthetic
// example so the landing page models the production relationship:
// snapshot = projection(report model), not a separate hand-authored story.
export const DEMO_DEFLECTION_SNAPSHOT: DeflectionSnapshot = GENERATED_DEMO_DEFLECTION_SNAPSHOT;

// Focused alternate fixture for tests/results-state paths that need a clean
// upload with no unresolved repeat/blind-spot branch.
export const DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD: DeflectionSnapshot = {
  ...DEMO_DEFLECTION_SNAPSHOT,
  summary: {
    generated: DEMO_DEFLECTION_SNAPSHOT.summary.generated,
    drafted_answer_count: DEMO_DEFLECTION_SNAPSHOT.summary.generated,
    no_proven_answer_count: 0,
    support_ticket_resolution_evidence_present: true,
    support_ticket_resolution_evidence_count: DEMO_DEFLECTION_SNAPSHOT.summary.generated,
    repeat_ticket_count: DEMO_DEFLECTION_SNAPSHOT.summary.repeat_ticket_count,
    non_repeat_ticket_count: DEMO_DEFLECTION_SNAPSHOT.summary.non_repeat_ticket_count,
  },
  top_blind_spots: [],
};
