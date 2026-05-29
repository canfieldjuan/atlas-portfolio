// Data + logic layer for the Support Ticket Deflection demo.
//
// This is the data seam the real backend plugs into. `searchDeflection` (client)
// fetches our same-origin route handler `/api/demo/deflection-search`; that route
// answers from `matchLocal` over the illustrative dataset below until an Atlas
// endpoint is configured there (server-only env). To wire the real backend you
// edit the route handler's `mapAtlasMatch`, not this file. The consuming
// component already debounces input, guards against out-of-order responses with a
// request id, and recovers to a retryable error state if the call rejects — so a
// real async fetch is safe.
//
// Copy note: the demand numbers (ticketVolumeInSample / sourceCount) are real —
// the ticket_count and cited source_ids from a labeled-synthetic B2B-SaaS sample
// run through the Atlas FAQ generator. The answers below are ILLUSTRATIVE
// finished FAQs, not generator output:
// they show what a published answer looks like, while your Report gives you
// drafts from your own tickets to refine. The offer is the Support Ticket
// Deflection Report — a CSV analysis, not an integration that promises a fixed
// deflection rate.

export type DeflectionDoc = {
  /** What the help center / search returns for this question. */
  title: string;
  /** Newline-separated step lines for the answer. */
  body: string;
  /** 0–100 illustrative intent-match score. */
  matchScore: number;
  matchLabel: string;
  format: string;
  hasSolution: boolean;
  /** Action buttons shown under the doc (illustrative). */
  actions: [string, string];
};

export type DeflectionIssue = {
  /** Local: numeric id. Atlas: the FAQ id (string). Metadata only — not rendered. */
  id: number | string;
  intent: string;
  /** Phrases a customer actually types — used by the LOCAL matcher only. */
  phrases: string[];
  /** Customer-facing wording surfaced from the ticket/search evidence. */
  customerWording: string;
  /** Plain-language description of why the existing docs are hard to find. */
  documentationGap: string;
  /** Source ticket ids cited by the finding. */
  sourceIds: string[];
  evidenceStatus: 'resolution_evidence' | 'draft_needs_review';
  /** The actionable answer the Report would publish (Atlas `question` + `answer_summary`). */
  improved: DeflectionDoc;

  // ── Real-signal fields from the Atlas faq-deflection-search projection ────────
  /** Atlas `ticket_count`: tickets for this issue across the sample (a total, NOT monthly). */
  ticketVolumeInSample: number;
  /** Atlas `source_ids.length`: source tickets cited as evidence for this FAQ. */
  sourceCount: number;
};

// ── Illustrative dataset (replace via searchDeflection → backend) ─────────────
// Topics + demand numbers are from the labeled-synthetic B2B-SaaS sample (the
// same run behind the wedge-page demo); the answers are illustrative finished
// FAQs (see the copy note above).
export const DEMO_ISSUES: DeflectionIssue[] = [
  {
    id: 1,
    intent: 'Reporting friction',
    phrases: ['how do i export attribution reports', 'export attribution reports', 'export reports', 'csv export missing fields', 'download report', 'export to csv'],
    customerWording: 'How do I export attribution report?',
    documentationGap: 'Customers search for "export"; existing docs tend to say "download report." Add export phrasing to the FAQ heading and answer.',
    sourceIds: ['search-export-1', 'ticket-export-2', 'ticket-export-3'],
    evidenceStatus: 'draft_needs_review',
    ticketVolumeInSample: 8,
    sourceCount: 8,
    improved: {
      title: 'How do I export attribution reports (CSV or PDF)?',
      body: 'Open Dashboard → Analytics and pick the report you need\nClick Export (top right) and choose CSV or PDF\nUse "Add fields" to include source and owner columns before exporting\nLarge exports email you a download link when they finish\nNo Export button? Your plan or role may gate it — an admin can enable it under Settings → Permissions',
      matchScore: 96,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Export a report', 'Check export permissions'],
    },
  },
  {
    id: 2,
    intent: 'Integration setup',
    phrases: ['where can i see failed webhook delivery attempts', 'failed webhook deliveries', 'webhook delivery log', 'webhook retries', 'retry a webhook', 'webhook not firing'],
    customerWording: 'Where can I see failed webhook delivery attempts?',
    documentationGap: 'Customers ask for failed deliveries and retries; docs often bury this under integration logs.',
    sourceIds: ['webhook-fail-1', 'webhook-retry-2', 'webhook-log-3'],
    evidenceStatus: 'resolution_evidence',
    ticketVolumeInSample: 7,
    sourceCount: 7,
    improved: {
      title: 'Where do I see failed webhook deliveries and retry them?',
      body: 'Open Settings → Integrations → Webhooks\nSelect the endpoint and open its Delivery Log\nFilter by "Failed" to see the status code and payload for each attempt\nClick Retry on a failed attempt, or "Retry all"\nRepeated 4xx is usually the signing secret or URL; 5xx is usually the receiver',
      matchScore: 95,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Open webhook logs', 'Retry a delivery'],
    },
  },
  {
    id: 3,
    intent: 'Data import',
    phrases: ['which csv columns are required for account imports', 'required csv columns', 'account import columns', 'import errors', 'csv import template', 'import accounts'],
    customerWording: 'Which CSV columns are required for account imports?',
    documentationGap: 'Customers look for required CSV columns; docs frame the same task as an account import template.',
    sourceIds: ['import-columns-1', 'csv-template-2', 'import-error-3'],
    evidenceStatus: 'resolution_evidence',
    ticketVolumeInSample: 4,
    sourceCount: 4,
    improved: {
      title: 'Which CSV columns are required to import accounts?',
      body: 'Go to Settings → Data → Import Accounts\nDownload the CSV template — required columns are marked\nAccount name and owner email are required; the rest are optional\nUpload your file — the validator flags missing or malformed rows before anything imports\nFix the flagged rows and re-upload; nothing is created until validation passes',
      matchScore: 96,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Download the template', 'Start an import'],
    },
  },
  {
    id: 4,
    intent: 'Manual follow-up',
    phrases: ['how do i send workflow alerts to a different slack channel', 'workflow alerts slack channel', 'route alerts to slack', 'change slack channel', 'slack notifications', 'send alerts to slack'],
    customerWording: 'How do I send workflow alerts to a different Slack channel?',
    documentationGap: 'Customers ask to change Slack channels; docs describe notification routing and app permissions.',
    sourceIds: ['slack-alert-1', 'slack-channel-2', 'slack-private-3'],
    evidenceStatus: 'resolution_evidence',
    ticketVolumeInSample: 5,
    sourceCount: 5,
    improved: {
      title: 'How do I route workflow alerts to a specific Slack channel?',
      body: 'Open Settings → Notifications → Slack\nConnect Slack if you have not yet (an admin may need to approve it)\nPick the workflow, then choose the destination channel\nUsing a private channel? Invite the app to it first with /invite\nSend a test alert to confirm it lands in the right place',
      matchScore: 94,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Open Slack settings', 'Send a test alert'],
    },
  },
  {
    id: 5,
    intent: 'Billing & payments',
    phrases: ['where can i download invoices for the annual subscription', 'download invoices', 'download my invoice', 'where are my invoices', 'get a receipt', 'annual subscription invoice'],
    customerWording: 'Where can I download invoices for the annual subscription?',
    documentationGap: 'Customers ask for invoices, receipts, and annual-plan billing; docs split those terms across billing pages.',
    sourceIds: ['invoice-download-1', 'annual-invoice-2', 'receipt-3'],
    evidenceStatus: 'resolution_evidence',
    ticketVolumeInSample: 4,
    sourceCount: 4,
    improved: {
      title: 'Where do I download invoices and receipts?',
      body: 'Open Settings → Billing → Invoices\nEach invoice lists the period, plan, and seats\nClick Download for a PDF, or "Email invoice" to send it to finance\nAdd a VAT/Tax ID or a billing email under Billing → Details\nAnnual-plan question or an amount that looks wrong? Contact billing with the invoice number',
      matchScore: 95,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Download an invoice', 'Update billing details'],
    },
  },
  {
    id: 6,
    intent: 'Permissions & access',
    phrases: ['how do i let managers edit workflows without full admin access', 'edit workflows without admin', 'limited admin access', 'custom roles', 'role permissions', 'transfer a seat'],
    customerWording: 'How do I let managers edit workflows without full admin access?',
    documentationGap: 'Customers ask for limited admin access; docs describe custom roles and workflow permissions separately.',
    sourceIds: ['role-workflow-1', 'limited-admin-2', 'permissions-3'],
    evidenceStatus: 'resolution_evidence',
    ticketVolumeInSample: 8,
    sourceCount: 8,
    improved: {
      title: 'How do I let managers edit workflows without making them admins?',
      body: 'Open Settings → Members → Roles\nCreate or edit a role (for example, "Workflow Editor")\nGrant "Edit workflows" without the admin or billing permissions\nAssign the role to the managers who need it\nNeed finer-grained control or SSO-mapped roles? Those are on Business plans and up',
      matchScore: 93,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Open role settings', 'Create a custom role'],
    },
  },
];

/** Wire contract for `GET /api/demo/deflection-search` (see the route handler). */
export type DeflectionSearchResponse = { match: DeflectionIssue | null };

/**
 * Local illustrative matcher over `DEMO_ISSUES` (phrase exact/substring, then
 * token overlap). Pure + synchronous, so the route handler can call it
 * server-side as the no-backend fallback. The real Atlas backend replaces this
 * path in the route handler, not here.
 */
export function matchLocal(query: string): DeflectionIssue | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  // Best phrase match: exact-contains first, then token overlap.
  let best: { issue: DeflectionIssue; score: number } | null = null;
  for (const issue of DEMO_ISSUES) {
    for (const phrase of issue.phrases) {
      const p = phrase.toLowerCase();
      let score = 0;
      if (q === p) score = 100;
      // Substring match only for queries long enough to be meaningful — a 1–2
      // char query (e.g. "a") otherwise matches many phrases at score 80.
      else if (q.length >= 3 && (q.includes(p) || p.includes(q))) score = 80;
      else {
        // Whole-token overlap; ignore 1-char tokens so stray characters don't match.
        const qTokens = new Set(q.split(/\s+/).filter((t) => t.length >= 2));
        const overlap = p.split(/\s+/).filter((t) => qTokens.has(t)).length;
        score = overlap * 20;
      }
      // Only surface an issue on a meaningful match: exact/substring (100/80) or
      // a 2+ word token overlap (40+). A single weak token (e.g. "in" → 20) is
      // not enough — otherwise the UI shows "strong intent match" for noise.
      if (score >= 40 && (!best || score > best.score)) best = { issue, score };
    }
  }
  return best?.issue ?? null;
}

/**
 * The backend seam (client side). Calls our same-origin route handler, which
 * answers from `matchLocal` until an Atlas endpoint is configured there. Same
 * signature as before, so the consuming component is unchanged — it already
 * debounces, guards out-of-order responses, and recovers from a rejection (a
 * non-ok response throws here and surfaces the component's retryable error state).
 */
export async function searchDeflection(query: string): Promise<DeflectionIssue | null> {
  const q = query.trim();
  if (!q) return null;
  const res = await fetch(`/api/demo/deflection-search?q=${encodeURIComponent(q)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`deflection search failed: ${res.status}`);
  const data = (await res.json()) as DeflectionSearchResponse;
  return data.match ?? null;
}

export const DEMO_CHIPS: string[] = [
  'export attribution reports',
  'failed webhook deliveries',
  'required CSV columns for imports',
  'workflow alerts to a Slack channel',
  'download invoices',
  'edit workflows without admin access',
];
