// Data + logic layer for the Support Ticket Deflection demo.
//
// Canonical report contract: canfieldjuan/ATLAS
// docs/frontend/content_ops_faq_report_contract.md. Do not copy that document
// into this repo; keep this local demo type aligned with the fields rendered
// here and use the ATLAS doc as the source of truth for full report hydration.
//
// The interactive demo renders one TicketFAQItem-shaped finding at a time. The
// free snapshot page intentionally uses the smaller DeflectionSnapshot shape in
// `deflection-snapshot.ts`.
import type { TicketFAQItem } from '@/lib/deflection-report-contract';

type DemoTicketFAQItem = TicketFAQItem & {
  /** Local matcher metadata only. Not part of the rendered report contract. */
  phrases: string[];
};

type DemoItemInput = {
  topic: string;
  question: string;
  phrases: string[];
  ticketCount: number;
  failureRiskScore: number;
  failureRiskSignals: string[];
  answerEvidenceStatus?: TicketFAQItem['answer_evidence_status'];
  answer: string;
  steps: string[];
  actionItems: string[];
  whenToContactSupport: string;
  sourceIds: string[];
  evidenceQuestions: string[];
  termMappings: Array<{
    customerTerm: string;
    documentationTerm: string;
    suggestion: string;
    zeroResultSourceCount?: number;
  }>;
};

function makeDemoItem(input: DemoItemInput): DemoTicketFAQItem {
  const opportunityScore = input.ticketCount * (input.failureRiskScore + 1);
  const sourceLabels = input.sourceIds.slice(0, 3).map((sourceId, index) => {
    const quote = input.evidenceQuestions[index] ?? input.question;
    return `${sourceId} - ${quote}`;
  });
  const evidenceQuotes = input.sourceIds.slice(0, 3).map((sourceId, index) => {
    const quote = input.evidenceQuestions[index] ?? input.question;
    return `\`${sourceId}\`: "${quote}"`;
  });

  return {
    topic: input.topic,
    question: input.question,
    question_source: 'customer_wording',
    summary: `Customers are asking about ${input.topic.toLowerCase()} across ${input.ticketCount} ticket source(s). The clearest customer wording is "${input.question}", so this FAQ should answer that request directly and show the wording gap that made the answer hard to find.`,

    frequency: input.ticketCount,
    weighted_frequency: input.ticketCount,
    ticket_count: input.ticketCount,
    opportunity_score: opportunityScore,
    failure_risk_score: input.failureRiskScore,
    failure_risk_signals: input.failureRiskSignals,

    answer: input.answer,
    steps: input.steps,
    action_items: input.actionItems,
    answer_evidence_status: input.answerEvidenceStatus ?? 'resolution_evidence',
    resolution_source_count:
      (input.answerEvidenceStatus ?? 'resolution_evidence') === 'resolution_evidence'
        ? input.sourceIds.length
        : 0,
    when_to_contact_support: input.whenToContactSupport,

    evidence_quotes: evidenceQuotes,
    source_ids: input.sourceIds,
    source_labels: sourceLabels,
    source_type_counts: { support_ticket: input.sourceIds.length },
    weighted_source_volume_by_type: { support_ticket: input.ticketCount },

    term_mappings: input.termMappings.map((mapping) => ({
      customer_term: mapping.customerTerm,
      documentation_term: mapping.documentationTerm,
      suggestion: mapping.suggestion,
      source_id_count: input.sourceIds.length,
      zero_result_source_count: mapping.zeroResultSourceCount ?? 0,
      failure_risk_score: input.failureRiskScore,
      failure_risk_signals: input.failureRiskSignals,
      opportunity_score: opportunityScore,
      first_source_id: input.sourceIds[0] ?? '',
    })),

    evidence_count: evidenceQuotes.length,
    displayed_evidence_count: evidenceQuotes.length,
    phrases: input.phrases,
  };
}

// Topics and demand numbers are labeled-synthetic B2B-SaaS sample data. The
// structure is the product report shape; the content is a public demo fixture,
// not a customer report.
const DEMO_ITEMS: DemoTicketFAQItem[] = [
  makeDemoItem({
    topic: 'Reporting friction',
    question: 'How do I export attribution reports?',
    phrases: [
      'how do i export attribution reports',
      'export attribution reports',
      'export reports',
      'csv export missing fields',
      'download report',
      'export to csv',
    ],
    ticketCount: 8,
    failureRiskScore: 2,
    failureRiskSignals: ['blocked_access', 'failed_workflow'],
    answerEvidenceStatus: 'draft_needs_review',
    answer:
      'Customers repeatedly ask how to export attribution reports, including CSV/PDF format, missing fields, scheduled exports, and permission-gated export buttons.',
    steps: [
      'Open Dashboard > Analytics and pick the report you need.',
      'Click Export and choose CSV or PDF.',
      'Use Add fields to include source and owner columns before exporting.',
      'For large exports, watch for the emailed download link.',
      'If Export is missing, ask an admin to check plan and role permissions.',
    ],
    actionItems: ['Add export phrasing', 'Review export permissions'],
    whenToContactSupport:
      'Contact support if the export is missing, locked by plan or role, or still unavailable after an admin checks permissions.',
    sourceIds: [
      'search-export-1',
      'ticket-export-2',
      'ticket-export-3',
      'ticket-export-4',
      'ticket-export-5',
      'ticket-export-6',
      'ticket-export-7',
      'ticket-export-8',
    ],
    evidenceQuestions: [
      'How do I export attribution report?',
      'Why is the campaign CSV export missing source and owner columns?',
      'Can I schedule a weekly attribution report export for finance?',
    ],
    termMappings: [
      {
        customerTerm: 'export',
        documentationTerm: 'Download report',
        suggestion: 'Add "export" as alternate phrasing for "Download report" in FAQ headings and answer text.',
      },
      {
        customerTerm: 'reports',
        documentationTerm: 'Dashboard analytics',
        suggestion: 'Add "reports" near dashboard analytics answers so customer searches match the page language.',
      },
    ],
  }),
  makeDemoItem({
    topic: 'Integration setup',
    question: 'Where can I see failed webhook delivery attempts?',
    phrases: [
      'where can i see failed webhook delivery attempts',
      'failed webhook deliveries',
      'webhook delivery log',
      'webhook retries',
      'retry a webhook',
      'webhook not firing',
    ],
    ticketCount: 7,
    failureRiskScore: 1,
    failureRiskSignals: ['failed_workflow'],
    answer:
      'Failed webhook questions cluster around delivery logs, retries, status codes, and whether the failure is caused by the sender or receiver.',
    steps: [
      'Open Settings > Integrations > Webhooks.',
      'Select the endpoint and open its Delivery Log.',
      'Filter by Failed to see the status code and payload for each attempt.',
      'Click Retry on a failed attempt, or Retry all.',
      'Repeated 4xx is usually the signing secret or URL; 5xx is usually the receiver.',
    ],
    actionItems: ['Add delivery-attempt wording', 'Link retry steps'],
    whenToContactSupport:
      'Contact support if the delivery log is missing, retries fail after the receiver is healthy, or the endpoint shows repeated unknown errors.',
    sourceIds: [
      'webhook-fail-1',
      'webhook-retry-2',
      'webhook-log-3',
      'webhook-secret-4',
      'webhook-status-5',
      'webhook-attempt-6',
      'webhook-receiver-7',
    ],
    evidenceQuestions: [
      'Where can I see failed webhook delivery attempts?',
      'Can I retry a failed webhook?',
      'How do I know why the webhook is not firing?',
    ],
    termMappings: [
      {
        customerTerm: 'delivery attempts',
        documentationTerm: 'Webhook delivery logs',
        suggestion: 'Add "delivery attempts" as alternate phrasing for "Webhook delivery logs" in FAQ headings and answer text.',
      },
      {
        customerTerm: 'retry a webhook',
        documentationTerm: 'Replay event',
        suggestion: 'Mention retry and replay together so customer searches find the same recovery workflow.',
      },
    ],
  }),
  makeDemoItem({
    topic: 'Data import',
    question: 'Which CSV columns are required for account imports?',
    phrases: [
      'which csv columns are required for account imports',
      'required csv columns',
      'account import columns',
      'import errors',
      'csv import template',
      'import accounts',
    ],
    ticketCount: 4,
    failureRiskScore: 2,
    failureRiskSignals: ['failed_workflow', 'incorrect_record'],
    answer:
      'Import tickets show customers need the required column list before upload, not after the validator rejects the file.',
    steps: [
      'Go to Settings > Data > Import Accounts.',
      'Download the CSV template; required columns are marked.',
      'Account name and owner email are required; the rest are optional.',
      'Upload your file and review validator warnings before anything imports.',
      'Fix flagged rows and re-upload after validation passes.',
    ],
    actionItems: ['Expose required columns', 'Link CSV template'],
    whenToContactSupport:
      'Contact support if the validator rejects a template file, required columns are unclear, or imported records do not match the preview.',
    sourceIds: ['import-columns-1', 'csv-template-2', 'import-error-3', 'import-history-4'],
    evidenceQuestions: [
      'Which CSV columns are required for account imports?',
      'How do I fix import errors for missing owner email values?',
      'Can we import historical opportunities from last quarter?',
    ],
    termMappings: [
      {
        customerTerm: 'required CSV columns',
        documentationTerm: 'Account import template',
        suggestion: 'Put "required CSV columns" in the import-template FAQ heading and validation help text.',
      },
    ],
  }),
  makeDemoItem({
    topic: 'Manual follow-up',
    question: 'How do I send workflow alerts to a different Slack channel?',
    phrases: [
      'how do i send workflow alerts to a different slack channel',
      'workflow alerts slack channel',
      'route alerts to slack',
      'change slack channel',
      'slack notifications',
      'send alerts to slack',
    ],
    ticketCount: 5,
    failureRiskScore: 1,
    failureRiskSignals: ['failed_workflow'],
    answer:
      'Slack alert tickets repeat because customers search for channel changes while the documentation describes notification routing and app permissions.',
    steps: [
      'Open Settings > Notifications > Slack.',
      'Connect Slack if needed; an admin may need to approve it.',
      'Pick the workflow, then choose the destination channel.',
      'For a private channel, invite the app to it first.',
      'Send a test alert to confirm it lands in the right place.',
    ],
    actionItems: ['Add Slack-channel wording', 'Document private channels'],
    whenToContactSupport:
      'Contact support if the destination channel does not appear, test alerts fail, or Slack approval is blocked by workspace permissions.',
    sourceIds: ['slack-alert-1', 'slack-channel-2', 'slack-private-3', 'slack-test-4', 'slack-admin-5'],
    evidenceQuestions: [
      'How do I send workflow alerts to a different Slack channel?',
      'Can workflow alerts go to a private Slack channel?',
      'Why did the Slack test alert not send?',
    ],
    termMappings: [
      {
        customerTerm: 'different Slack channel',
        documentationTerm: 'Notification routing',
        suggestion: 'Add "Slack channel" and "change channel" to notification-routing headings and answers.',
      },
    ],
  }),
  makeDemoItem({
    topic: 'Billing and payments',
    question: 'Where can I download invoices for the annual subscription?',
    phrases: [
      'where can i download invoices for the annual subscription',
      'download invoices',
      'download my invoice',
      'where are my invoices',
      'get a receipt',
      'annual subscription invoice',
    ],
    ticketCount: 4,
    failureRiskScore: 1,
    failureRiskSignals: ['blocked_access'],
    answer:
      'Billing tickets cluster around invoices, receipts, annual plan wording, tax details, and who can access billing documents.',
    steps: [
      'Open Settings > Billing > Invoices.',
      'Find the invoice by period, plan, or seat count.',
      'Click Download for a PDF, or Email invoice to send it to finance.',
      'Add a VAT or tax ID under Billing > Details.',
      'For annual-plan questions, include the invoice number when you contact billing.',
    ],
    actionItems: ['Add invoice wording', 'Clarify billing roles'],
    whenToContactSupport:
      'Contact support if the invoice is missing, the amount looks wrong, or the billing page is not visible to the right admin.',
    sourceIds: ['invoice-download-1', 'annual-invoice-2', 'receipt-3', 'billing-role-4'],
    evidenceQuestions: [
      'Where can I download invoices for the annual subscription?',
      'Can I get a receipt for last month?',
      'Why can finance not see the invoice?',
    ],
    termMappings: [
      {
        customerTerm: 'invoice',
        documentationTerm: 'Billing document',
        suggestion: 'Use "invoice" and "receipt" in billing-page headings instead of only "billing document."',
      },
    ],
  }),
  makeDemoItem({
    topic: 'Permissions and access',
    question: 'How do I let managers edit workflows without full admin access?',
    phrases: [
      'how do i let managers edit workflows without full admin access',
      'edit workflows without admin',
      'limited admin access',
      'custom roles',
      'role permissions',
      'transfer a seat',
    ],
    ticketCount: 8,
    failureRiskScore: 2,
    failureRiskSignals: ['blocked_access', 'failed_workflow'],
    answer:
      'Customers ask for limited admin access when they actually need workflow-edit permissions separated from billing and account administration.',
    steps: [
      'Open Settings > Members > Roles.',
      'Create or edit a role such as Workflow Editor.',
      'Grant Edit workflows without admin or billing permissions.',
      'Assign the role to the managers who need it.',
      'Test with one manager account before rolling it out broadly.',
    ],
    actionItems: ['Add limited-admin wording', 'Document workflow roles'],
    whenToContactSupport:
      'Need finer-grained control, SSO-mapped roles, or a permission that is not listed? Those controls are usually available on Business plans and up.',
    sourceIds: [
      'role-workflow-1',
      'limited-admin-2',
      'permissions-3',
      'role-editor-4',
      'manager-access-5',
      'billing-admin-6',
      'seat-transfer-7',
      'sso-role-8',
    ],
    evidenceQuestions: [
      'How do I let managers edit workflows without full admin access?',
      'Can I give someone limited admin access?',
      'Which role lets managers edit workflows?',
    ],
    termMappings: [
      {
        customerTerm: 'limited admin access',
        documentationTerm: 'Custom roles',
        suggestion: 'Add "limited admin access" as alternate phrasing for custom roles and workflow permissions.',
      },
      {
        customerTerm: 'edit workflows without admin',
        documentationTerm: 'Workflow permissions',
        suggestion: 'Use the customer phrase "edit workflows without admin" near the workflow-role permission table.',
      },
    ],
  }),
];

function publicItem(item: DemoTicketFAQItem): TicketFAQItem {
  const ticketFAQItem = { ...item };
  delete (ticketFAQItem as Partial<DemoTicketFAQItem>).phrases;
  return ticketFAQItem;
}

export type DeflectionSearchSource = 'local' | 'atlas';

/** Wire contract for `GET /api/demo/deflection-search` (see the route handler). */
export type DeflectionSearchResponse = {
  match: TicketFAQItem | null;
  source: DeflectionSearchSource;
};

/**
 * Local illustrative matcher over TicketFAQItem-shaped demo data. Phrase
 * metadata is local-only; returned matches are stripped back to TicketFAQItem.
 */
export function matchLocal(query: string): TicketFAQItem | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  let best: { item: DemoTicketFAQItem; score: number } | null = null;
  for (const item of DEMO_ITEMS) {
    for (const phrase of item.phrases) {
      const p = phrase.toLowerCase();
      let score = 0;
      if (q === p) score = 100;
      else if (q.length >= 3 && (q.includes(p) || p.includes(q))) score = 80;
      else {
        const qTokens = new Set(q.split(/\s+/).filter((t) => t.length >= 2));
        const overlap = p.split(/\s+/).filter((t) => qTokens.has(t)).length;
        score = overlap * 20;
      }
      if (score >= 40 && (!best || score > best.score)) best = { item, score };
    }
  }

  return best ? publicItem(best.item) : null;
}

/**
 * The backend seam (client side). Calls our same-origin route handler, which
 * returns one TicketFAQItem-shaped sample result until live full-artifact
 * hydration is wired.
 */
export async function searchDeflection(query: string): Promise<DeflectionSearchResponse> {
  const q = query.trim();
  if (!q) return { match: null, source: 'local' };

  const res = await fetch(`/api/demo/deflection-search?q=${encodeURIComponent(q)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`deflection search failed: ${res.status}`);

  return (await res.json()) as DeflectionSearchResponse;
}

export const DEMO_CHIPS: string[] = [
  'export attribution reports',
  'failed webhook deliveries',
  'required CSV columns for imports',
  'workflow alerts to a Slack channel',
  'download invoices',
  'edit workflows without admin access',
];
