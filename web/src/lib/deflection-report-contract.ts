// Local TypeScript view of the deflection report contract.
//
// Canonical source of truth: canfieldjuan/ATLAS
// docs/frontend/content_ops_faq_report_contract.md. Keep this file aligned to
// that document; do not copy the full ATLAS doc into this repo.

export type FAQTermMapping = {
  customer_term: string;
  documentation_term: string;
  suggestion: string;
  source_id_count: number;
  zero_result_source_count: number;
  failure_risk_score: number;
  failure_risk_signals: string[];
  opportunity_score: number;
  first_source_id: string;
};

export type TicketFAQItem = {
  topic: string;
  question: string;
  question_source: 'customer_wording' | 'source_policy';
  summary: string;

  frequency: number;
  weighted_frequency: number;
  ticket_count: number;
  opportunity_score: number;
  failure_risk_score: number;
  failure_risk_signals: string[];

  answer: string;
  steps: string[];
  action_items: string[];
  answer_evidence_status: 'resolution_evidence' | 'draft_needs_review';
  resolution_source_count: number;
  when_to_contact_support: string;

  evidence_quotes: string[];
  source_ids: string[];
  source_labels: string[];
  source_type_counts: Record<string, number>;
  weighted_source_volume_by_type: Record<string, number>;

  term_mappings: FAQTermMapping[];

  evidence_count: number;
  displayed_evidence_count: number;
};

export type TicketFAQMarkdownResult = {
  generated: number;
  markdown: string;
  items: TicketFAQItem[];
  source_count: number;
  ticket_source_count: number;
  output_checks: {
    uses_user_vocabulary: boolean;
    condensed: boolean;
    has_action_items: boolean;
  };
  warnings: Array<Record<string, unknown>>;
  saved_ids: string[];
};

export type FAQDeflectionReportSummary = {
  generated: number;
  source_count: number;
  ticket_source_count: number;
  drafted_answer_count: number;
  no_proven_answer_count: number;
  output_checks: {
    uses_user_vocabulary: boolean;
    condensed: boolean;
    has_action_items: boolean;
  };
  top_question: string;
  top_opportunity_score: number;
};

export type FAQDeflectionReportArtifact = {
  markdown: string;
  summary: FAQDeflectionReportSummary;
  faq_result: TicketFAQMarkdownResult;
};

export type DeflectionReportSection = {
  id: string;
  title: string;
  priority: number;
  surfaces: string[];
  default_limit: number | null;
  required_data: string[];
  data: Record<string, unknown>;
};

export type DeflectionStructuredReport = {
  schema_version: 'deflection.v1';
  title: string;
  summary: Record<string, unknown>;
  sections: DeflectionReportSection[];
};

export function deflectionArtifactPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/artifact`;
}

export function deflectionReportModelPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/report-model`;
}
