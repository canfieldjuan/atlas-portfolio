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
// Copy note: the per-issue numbers and quotes here are ILLUSTRATIVE (modeled on a
// public consumer-complaint dataset), not a guaranteed result. The offer is the
// Support Ticket Deflection Report — a CSV analysis, not an integration that
// promises a fixed deflection rate.

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
  id: number;
  intent: string;
  /** Phrases a customer actually types — used for matching. */
  phrases: string[];
  /** The actionable, customer-language FAQ the Report would produce (Atlas's "improved" side). */
  improved: DeflectionDoc;

  // ── Real-signal fields (Atlas's ticket-FAQ pipeline provides these) ──────────
  /** Atlas `frequency`: ticket count across the sample corpus (a total, NOT monthly). */
  ticketVolumeInSample: number;
  /** Atlas `opportunity_score`: relative priority of fixing this issue. */
  opportunityScore: number;
  /** Atlas `failure_risk_signals`: snake_case "why it matters" tags. */
  riskSignals: string[];
  /** Atlas `evidence_quotes[0]`: a real customer quote (PII-redacted in real data). */
  customerQuote: string;
  /** Atlas `summary`: one-line demand summary across the sample. */
  summary: string;
};

// ── Illustrative dataset (replace via searchDeflection → backend) ─────────────
export const DEMO_ISSUES: DeflectionIssue[] = [
  {
    id: 1,
    intent: 'Account Access',
    phrases: ["can't log in", 'login not working', 'forgot password', 'locked out', 'sign in problem', 'password reset'],
    ticketVolumeInSample: 3120,
    opportunityScore: 15600,
    riskSignals: ['blocked_access', 'failed_login', 'account_lockout'],
    customerQuote: "I've reset my password three times and still can't get back into my account.",
    summary: 'Login and password-reset failures are the single largest access driver across the sample.',
    improved: {
      title: "I can't log in — how do I get back into my account?",
      body: 'Open the login page and click "Forgot password"\nEnter the email linked to your account\nCheck your inbox and spam for the reset link\nClick it and set a new password\nStill stuck? Use chat — we verify and reset manually',
      matchScore: 94,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Reset my password', 'Chat with support'],
    },
  },
  {
    id: 2,
    intent: 'Billing Dispute',
    phrases: ['charged twice', 'double charge', 'duplicate charge', 'billed twice', 'overcharged', 'two charges'],
    ticketVolumeInSample: 2418,
    opportunityScore: 13600,
    riskSignals: ['money_or_account_risk', 'duplicate_charge', 'billing_error'],
    customerQuote: "I was charged twice for the same order and I can't find where to dispute it.",
    summary: 'Duplicate-charge and billing-error reports recur heavily across the sample.',
    improved: {
      title: 'I see a duplicate charge — how do I get it removed?',
      body: 'Check whether it is a pending authorization (often drops off in 3–5 days)\nIf both have posted, open Billing → Transaction History\nClick "Report Issue" on the duplicate\nWe review within 24 hours and issue a refund\nYou get an email when the refund is processed',
      matchScore: 97,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Report duplicate charge', 'Check transactions'],
    },
  },
  {
    id: 3,
    intent: 'Order Status',
    phrases: ['where is my order', 'order not received', 'delivery late', 'order missing', 'never arrived', 'shipping delayed'],
    ticketVolumeInSample: 2890,
    opportunityScore: 11200,
    riskSignals: ['delivery_delay', 'missing_order', 'tracking_gap'],
    customerQuote: 'My order says delivered but it never arrived.',
    summary: 'Where-is-my-order and missing-delivery questions dominate post-purchase tickets.',
    improved: {
      title: "My order hasn't arrived — what should I do right now?",
      body: 'Check Account → Orders → Track\nIf tracking has not updated in 48+ hours, the carrier may be delayed\nIf the delivery date has passed, click "Report Missing Order"\nWe contact the carrier and ship a replacement within 2 days\nYou keep the original if it later arrives',
      matchScore: 96,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Track my order', 'Report missing order'],
    },
  },
  {
    id: 4,
    intent: 'Cancellation',
    phrases: ['cancel subscription', 'how to cancel', 'stop billing', 'end subscription', 'unsubscribe', 'cancel plan'],
    ticketVolumeInSample: 1760,
    opportunityScore: 8800,
    riskSignals: ['failed_workflow', 'retention_risk', 'data_loss_fear'],
    customerQuote: "I just want to cancel but I can't find the option anywhere.",
    summary: 'Customers struggle to self-serve cancellation and worry about losing their data.',
    improved: {
      title: 'How do I cancel my plan without losing my data?',
      body: 'Open Settings → Subscription → Cancel Plan\nPick your cancellation date (effective at period end)\nExport first: Settings → Data → Download Everything\nConfirm — access continues until the period ends\nReactivate within 90 days and everything is preserved',
      matchScore: 95,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Cancel my plan', 'Export my data first'],
    },
  },
  {
    id: 5,
    intent: 'App Stability',
    phrases: ['app crashing', 'keeps closing', 'freezing', 'not responding', "app won't open", 'keeps crashing'],
    ticketVolumeInSample: 1540,
    opportunityScore: 9200,
    riskSignals: ['app_crash', 'blocked_access', 'failed_workflow'],
    customerQuote: 'The app crashes every time I open the reports tab.',
    summary: 'Repeated crash reports cluster around a few specific app actions.',
    improved: {
      title: 'The app keeps crashing — how do I fix it fast?',
      body: 'Force-close the app and reopen it once\nUpdate to the latest version in your app store\nClear the app cache: Settings → Storage → Clear Cache\nRestart your device, then reopen\nStill crashing? Tap "Send crash report" so we can see the exact error',
      matchScore: 93,
      matchLabel: 'Strong intent match',
      format: 'Actionable FAQ · 5 steps',
      hasSolution: true,
      actions: ['Send crash report', 'Chat with support'],
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
  "can't log in",
  'charged twice',
  'where is my order',
  'cancel subscription',
  'app crashing',
];
