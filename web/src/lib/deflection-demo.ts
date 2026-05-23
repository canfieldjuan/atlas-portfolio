// Data + logic layer for the Support Ticket Deflection demo.
//
// This is the data seam the real backend plugs into. Today `searchDeflection`
// resolves from the local illustrative dataset below; to wire the Atlas backend,
// change this function's body to `fetch(...)` the live search endpoint (same
// return type). The consuming component already debounces input, guards against
// out-of-order responses with a request id, and recovers to a retryable error
// state if the call rejects — so a real async fetch is safe; the only
// data-source change lives here.
//
// Copy note: numbers here are ILLUSTRATIVE (drawn from the public complaint
// dataset / typical desk economics), not a guaranteed result. The offer is the
// Support Ticket Deflection Report — a CSV analysis, not an integration that
// promises a fixed deflection rate.

export type DeflectionDoc = {
  /** What the help center / search returns for this question. */
  title: string;
  /** For the "traditional" doc: a jargon-y preview. For "improved": step lines. */
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
  /** Illustrative monthly ticket volume for this issue from the sample dataset. */
  ticketsPerMonth: number;
  /** Illustrative blended cost to resolve one ticket, in USD. */
  costPerTicket: number;
  /** Illustrative share of this issue's tickets that a good FAQ can self-serve. */
  deflectionShare: number;
  /** The jargon-y doc a customer hits today. */
  traditional: DeflectionDoc;
  /** The actionable, customer-language FAQ the Report would produce. */
  improved: DeflectionDoc;
};

export type DeflectionSavings = {
  ticketsPerMonth: number;
  deflectedPerMonth: number;
  monthlyCost: number;
  monthlySavings: number;
};

// ── Illustrative dataset (replace via searchDeflection → backend) ─────────────
export const DEMO_ISSUES: DeflectionIssue[] = [
  {
    id: 1,
    intent: 'Account Access',
    phrases: ["can't log in", 'login not working', 'forgot password', 'locked out', 'sign in problem', 'password reset'],
    ticketsPerMonth: 2847,
    costPerTicket: 14,
    deflectionShare: 0.65,
    traditional: {
      title: 'Authentication and Authorization Protocols',
      body: 'Covers the authentication framework: SSO integration, OAuth 2.0 token management, session persistence, and multi-factor deployment strategies for enterprise environments.',
      matchScore: 32,
      matchLabel: 'Partial keyword match',
      format: 'Long article · 4,200 words',
      hasSolution: false,
      actions: ['Read full article', 'Contact IT admin'],
    },
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
    ticketsPerMonth: 1923,
    costPerTicket: 15,
    deflectionShare: 0.55,
    traditional: {
      title: 'Billing Cycle Processing and Invoice Reconciliation',
      body: 'How charges are generated, processed, and reconciled in the financial pipeline — proration logic, invoice timelines, and payment gateway settlement periods.',
      matchScore: 28,
      matchLabel: 'Weak keyword match',
      format: 'Long article · 3,800 words',
      hasSolution: false,
      actions: ['Read full article', 'Submit a ticket'],
    },
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
    ticketsPerMonth: 2156,
    costPerTicket: 11,
    deflectionShare: 0.7,
    traditional: {
      title: 'Order Fulfillment Status and Tracking Methodology',
      body: 'An overview of the fulfillment pipeline: warehouse processing, carrier handoff protocols, tracking-number assignment, and delivery-window calculation.',
      matchScore: 35,
      matchLabel: 'Partial keyword match',
      format: 'Long article · 3,500 words',
      hasSolution: false,
      actions: ['Read full article', 'Contact shipping'],
    },
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
    ticketsPerMonth: 1834,
    costPerTicket: 13,
    deflectionShare: 0.5,
    traditional: {
      title: 'Subscription Lifecycle Management and Termination Procedures',
      body: 'The subscription lifecycle from provisioning through termination — downgrade paths, billing-cycle alignment, data-retention policy, and reactivation workflows.',
      matchScore: 30,
      matchLabel: 'Weak keyword match',
      format: 'Long article · 5,100 words',
      hasSolution: false,
      actions: ['Read full article', 'Contact account manager'],
    },
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
    ticketsPerMonth: 1654,
    costPerTicket: 16,
    deflectionShare: 0.45,
    traditional: {
      title: 'Application Stability and Runtime Diagnostics',
      body: 'Guidance on runtime error handling, crash-dump analysis, memory monitoring, and process lifecycle — stack-trace interpretation and debug-logging configuration.',
      matchScore: 25,
      matchLabel: 'Weak keyword match',
      format: 'Long article · 4,600 words',
      hasSolution: false,
      actions: ['Read full article', 'Submit diagnostic logs'],
    },
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

/**
 * The backend seam. Today: matches the query against the local dataset's
 * phrases. Later: replace the body with a `fetch` to the Atlas search endpoint
 * (same return type). Kept async so that swap needs no caller changes.
 */
export async function searchDeflection(query: string): Promise<DeflectionIssue | null> {
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

/** Illustrative savings for one issue (no guaranteed result — see file header). */
export function estimateSavings(issue: DeflectionIssue): DeflectionSavings {
  const deflectedPerMonth = Math.round(issue.ticketsPerMonth * issue.deflectionShare);
  return {
    ticketsPerMonth: issue.ticketsPerMonth,
    deflectedPerMonth,
    monthlyCost: issue.ticketsPerMonth * issue.costPerTicket,
    monthlySavings: deflectedPerMonth * issue.costPerTicket,
  };
}

/** Aggregate of `estimateSavings` across a dataset — same shape, summed. */
export type DeflectionTotals = DeflectionSavings;

/**
 * Illustrative totals across the sample dataset (no guaranteed result). Sums the
 * per-issue `estimateSavings`, so the "math" section can't drift from the
 * per-search numbers — both derive from the same illustrative `DEMO_ISSUES`.
 */
export function estimateDeflectionTotals(issues: DeflectionIssue[] = DEMO_ISSUES): DeflectionTotals {
  return issues.reduce<DeflectionTotals>(
    (acc, issue) => {
      const s = estimateSavings(issue);
      return {
        ticketsPerMonth: acc.ticketsPerMonth + s.ticketsPerMonth,
        deflectedPerMonth: acc.deflectedPerMonth + s.deflectedPerMonth,
        monthlyCost: acc.monthlyCost + s.monthlyCost,
        monthlySavings: acc.monthlySavings + s.monthlySavings,
      };
    },
    { ticketsPerMonth: 0, deflectedPerMonth: 0, monthlyCost: 0, monthlySavings: 0 },
  );
}

export const DEMO_CHIPS: string[] = [
  "can't log in",
  'charged twice',
  'where is my order',
  'cancel subscription',
  'app crashing',
];
