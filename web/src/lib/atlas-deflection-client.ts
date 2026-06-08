import {
  deflectionSnapshotPath,
  type DeflectionSnapshot,
  type DeflectionSnapshotAnswerPreview,
  type DeflectionSnapshotFullAnswer,
  type DeflectionSnapshotLockedQuestion,
  type DeflectionSnapshotQuestion,
  type DeflectionSnapshotSourceWindow,
  type DeflectionSnapshotTeaser,
} from '@/lib/deflection-snapshot';
import {
  deflectionArtifactPath,
  type FAQDeflectionReportArtifact,
} from '@/lib/deflection-report-contract';
import { get } from '@vercel/blob';
import { gapReportBlobToken, gapReportBlobTokens, type SupportPlatform } from '@/lib/gap-report-intake';

// SERVER-ONLY by convention — import this only from server components / route
// handlers, never a client component. It reads non-NEXT_PUBLIC_ service
// credentials, so the bearer token is never bundled for the browser even if
// mis-imported.
// ATLAS client for the deflection funnel: reads the service-account credentials
// from env and fetches the free snapshot (GET /snapshot) and the paid-gated full
// report (GET /artifact → 200 unlocked / 403 locked). Go-live-gate discipline:
// validate the upstream shape, generic errors (no host/token leak), bounded
// request id, timeout.

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const FETCH_TIMEOUT_MS = 10_000;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SnapshotFetchResult =
  | { ok: true; snapshot: DeflectionSnapshot }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'error' };

function atlasConfig(): { baseUrl: string; token: string } | null {
  const baseUrl = process.env.ATLAS_API_BASE_URL?.trim().replace(/\/$/, '');
  const token = process.env.ATLAS_B2B_SERVICE_TOKEN?.trim();
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isoDateTime(value: string): number | null {
  if (!ISO_DATE_RE.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  const parsed = new Date(time);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return time;
}

function parseDeflectionSnapshotSourceWindow(
  summary: Record<string, unknown>,
): DeflectionSnapshotSourceWindow | null {
  const start = summary.source_date_start;
  const end = summary.source_date_end;
  const days = summary.source_window_days;
  if (start === undefined && end === undefined && days === undefined) {
    return null;
  }
  if (
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    typeof days !== 'number' ||
    !Number.isInteger(days) ||
    days <= 0
  ) {
    return null;
  }
  const startTime = isoDateTime(start);
  const endTime = isoDateTime(end);
  if (startTime === null || endTime === null || endTime < startTime) {
    return null;
  }
  const expectedDays = Math.floor((endTime - startTime) / DAY_MS) + 1;
  if (expectedDays !== days) {
    return null;
  }
  return {
    source_date_start: start,
    source_date_end: end,
    source_window_days: days,
  };
}

function parseQuestion(v: unknown): DeflectionSnapshotQuestion | null {
  if (typeof v !== 'object' || v === null) return null;
  const q = v as Record<string, unknown>;
  if (
    typeof q.rank === 'number' &&
    typeof q.question === 'string' &&
    typeof q.customer_wording === 'string' &&
    isNonNegativeNumber(q.ticket_count) &&
    typeof q.weighted_frequency === 'number'
  ) {
    return {
      rank: q.rank,
      question: q.question,
      customer_wording: q.customer_wording,
      ticket_count: q.ticket_count,
      weighted_frequency: q.weighted_frequency,
    };
  }
  return null;
}

function parseLockedQuestion(v: unknown): DeflectionSnapshotLockedQuestion | null {
  if (typeof v !== 'object' || v === null) return null;
  const q = v as Record<string, unknown>;
  if (typeof q.rank === 'number' && isNonNegativeNumber(q.ticket_count)) {
    return {
      rank: q.rank,
      ticket_count: q.ticket_count,
    };
  }
  return null;
}

function parseFullTeaserAnswer(value: unknown): DeflectionSnapshotFullAnswer | null {
  if (typeof value !== 'object' || value === null) return null;
  const answer = value as Record<string, unknown>;
  if (
    typeof answer.rank === 'number' &&
    typeof answer.question === 'string' &&
    typeof answer.answer === 'string' &&
    answer.answer.trim().length > 0 &&
    isStringArray(answer.steps) &&
    answer.answer_evidence_status === 'resolution_evidence' &&
    answer.resolution_evidence_scope === 'scoped' &&
    typeof answer.weighted_frequency === 'number' &&
    typeof answer.source_count === 'number'
  ) {
    return {
      rank: answer.rank,
      question: answer.question,
      answer: answer.answer,
      steps: answer.steps,
      answer_evidence_status: 'resolution_evidence',
      resolution_evidence_scope: 'scoped',
      weighted_frequency: answer.weighted_frequency,
      source_count: answer.source_count,
    };
  }
  return null;
}

function parseTeaserPreview(value: unknown): DeflectionSnapshotAnswerPreview | null {
  if (typeof value !== 'object' || value === null) return null;
  const preview = value as Record<string, unknown>;
  if (
    typeof preview.rank === 'number' &&
    typeof preview.question === 'string' &&
    preview.answer_evidence_status === 'resolution_evidence' &&
    preview.resolution_evidence_scope === 'scoped' &&
    typeof preview.weighted_frequency === 'number' &&
    typeof preview.step_count === 'number' &&
    typeof preview.source_count === 'number' &&
    preview.body_withheld === true
  ) {
    return {
      rank: preview.rank,
      question: preview.question,
      answer_evidence_status: 'resolution_evidence',
      resolution_evidence_scope: 'scoped',
      weighted_frequency: preview.weighted_frequency,
      step_count: preview.step_count,
      source_count: preview.source_count,
      body_withheld: true,
    };
  }
  return null;
}

function parseTeaser(value: unknown): DeflectionSnapshotTeaser | null {
  if (value === undefined) return { full_answer: null, previews: [] };
  if (typeof value !== 'object' || value === null) return null;
  const teaser = value as Record<string, unknown>;
  if (
    teaser.full_answer !== null &&
    teaser.full_answer !== undefined &&
    !parseFullTeaserAnswer(teaser.full_answer)
  ) {
    return null;
  }
  if (!Array.isArray(teaser.previews)) {
    return null;
  }
  const previews: DeflectionSnapshotAnswerPreview[] = [];
  for (const preview of teaser.previews) {
    const parsedPreview = parseTeaserPreview(preview);
    if (!parsedPreview) return null;
    previews.push(parsedPreview);
  }
  return {
    full_answer: teaser.full_answer === undefined || teaser.full_answer === null
      ? null
      : parseFullTeaserAnswer(teaser.full_answer),
    previews,
  };
}

function parseSnapshot(v: unknown): DeflectionSnapshot | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const s = o.summary as Record<string, unknown> | undefined;
  if (
    !s ||
    typeof s.generated !== 'number' ||
    typeof s.drafted_answer_count !== 'number' ||
    typeof s.no_proven_answer_count !== 'number' ||
    !isNonNegativeNumber(s.repeat_ticket_count)
  ) {
    return null;
  }
  if (!Array.isArray(o.top_questions)) {
    return null;
  }
  const topQuestions: DeflectionSnapshotQuestion[] = [];
  for (const question of o.top_questions) {
    const parsedQuestion = parseQuestion(question);
    if (!parsedQuestion) return null;
    topQuestions.push(parsedQuestion);
  }
  if (!Array.isArray(o.locked_questions)) {
    return null;
  }
  const lockedQuestions: DeflectionSnapshotLockedQuestion[] = [];
  for (const question of o.locked_questions) {
    const parsedQuestion = parseLockedQuestion(question);
    if (!parsedQuestion) return null;
    lockedQuestions.push(parsedQuestion);
  }
  const teaser = parseTeaser(o.teaser);
  if (!teaser) return null;
  const sourceWindow = parseDeflectionSnapshotSourceWindow(s);
  return {
    summary: {
      generated: s.generated,
      drafted_answer_count: s.drafted_answer_count,
      no_proven_answer_count: s.no_proven_answer_count,
      repeat_ticket_count: s.repeat_ticket_count,
      ...(sourceWindow ?? {}),
    },
    top_questions: topQuestions,
    locked_questions: lockedQuestions,
    teaser,
  };
}

export async function fetchDeflectionSnapshot(
  requestId: string,
): Promise<SnapshotFetchResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId)) return { ok: false, reason: 'not_found' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${deflectionSnapshotPath(requestId)}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (!res.ok) {
      console.error(`deflection snapshot fetch failed: HTTP ${res.status}`);
      return { ok: false, reason: 'error' };
    }
    const snapshot = parseSnapshot(await res.json());
    if (!snapshot) {
      console.error('deflection snapshot fetch: upstream shape rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, snapshot };
  } catch (err) {
    // Generic — never surface the upstream host or token.
    console.error('deflection snapshot fetch error:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

export type ArtifactFetchResult =
  | { ok: true; artifact: FAQDeflectionReportArtifact }
  | { ok: false; reason: 'not_configured' | 'locked' | 'not_found' | 'error' };

export type DeflectionCheckoutAuthorization = {
  amountCents: number;
  currency: string;
  priceId: string;
};

type CheckoutAuthorizationFailureReason =
  | 'not_configured'
  | 'not_found'
  | 'already_paid'
  | 'unavailable'
  | 'error';

export type CheckoutAuthorizationResult =
  | { ok: true; checkout: DeflectionCheckoutAuthorization }
  | { ok: false; reason: CheckoutAuthorizationFailureReason };

export type DeflectionSubmitResult =
  | { ok: true; requestId: string }
  | {
      ok: false;
      reason: 'not_configured' | 'blob_not_found' | 'invalid_response' | 'rejected' | 'error';
    };

export type DeflectionSubmitInput = {
  csvBlobUrl: string;
  csvFilename: string;
  companyName: string;
  contactEmail: string;
  supportPlatform: SupportPlatform;
};

const DEFLECTION_SUBMIT_PATH = '/api/v1/content-ops/deflection-reports/submit';
const SUPPORT_PLATFORM_SUBMIT_VALUE: Record<SupportPlatform, string> = {
  zendesk: 'zendesk',
  intercom: 'intercom',
  freshdesk: 'other',
  helpscout: 'help_scout',
  other: 'other',
};

function deflectionCheckoutAuthorizationPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/checkout-authorization`;
}

function safeCsvFilename(filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'support-tickets.csv';
  return safe.toLowerCase().endsWith('.csv') ? safe : `${safe}.csv`;
}

function parseSubmitRequestId(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return null;
  const requestId = (v as Record<string, unknown>).request_id;
  return typeof requestId === 'string' && REQUEST_ID_RE.test(requestId) ? requestId : null;
}

async function getPrivateCsvBlob(url: string) {
  const tokens = gapReportBlobTokens();
  const readTokens = tokens.length > 0 ? tokens : [gapReportBlobToken()];
  let lastError: unknown;

  for (const token of readTokens) {
    try {
      const blob = await get(url, {
        access: 'private',
        token,
        useCache: false,
      });
      if (blob && blob.statusCode === 200 && blob.stream) return blob;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return null;
}

// Submit a private intake CSV to ATLAS without exposing the Blob URL to ATLAS or
// the browser. This is intentionally server-only: it reads the private Blob with
// the app's Blob token, then forwards raw CSV bytes as multipart form data.
export async function submitDeflectionReportCsv(
  input: DeflectionSubmitInput,
): Promise<DeflectionSubmitResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };

  let csvBlob: Blob;
  try {
    const blob = await getPrivateCsvBlob(input.csvBlobUrl);
    if (!blob) return { ok: false, reason: 'blob_not_found' };
    const csvBytes = await new Response(blob.stream).arrayBuffer();
    csvBlob = new Blob([csvBytes], { type: blob.blob.contentType || 'text/csv' });
  } catch (err) {
    console.error('deflection submit blob read error:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'blob_not_found' };
  }

  const form = new FormData();
  form.set('csv_file', csvBlob, safeCsvFilename(input.csvFilename));
  form.set('support_platform', SUPPORT_PLATFORM_SUBMIT_VALUE[input.supportPlatform]);
  form.set('company_name', input.companyName);
  form.set('contact_email', input.contactEmail);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${DEFLECTION_SUBMIT_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
      body: form,
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`deflection submit failed: HTTP ${res.status}`);
      return { ok: false, reason: 'rejected' };
    }
    const requestId = parseSubmitRequestId(await res.json());
    if (!requestId) {
      console.error('deflection submit: upstream shape rejected');
      return { ok: false, reason: 'invalid_response' };
    }
    return { ok: true, requestId };
  } catch (err) {
    console.error('deflection submit error:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

function parseCheckoutAuthorization(v: unknown): DeflectionCheckoutAuthorization | null {
  if (typeof v !== 'object' || v === null) return null;
  const response = v as Record<string, unknown>;
  const checkout = response.checkout;
  if (typeof checkout !== 'object' || checkout === null) return null;
  const terms = checkout as Record<string, unknown>;
  const amountCents = terms.amount_cents;
  const currency = terms.currency;
  const priceId = terms.price_id;
  if (
    response.status === 'authorized' &&
    typeof amountCents === 'number' &&
    Number.isSafeInteger(amountCents) &&
    amountCents > 0 &&
    typeof currency === 'string' &&
    /^[a-zA-Z]{3}$/.test(currency) &&
    typeof priceId === 'string' &&
    priceId.trim().length > 0
  ) {
    return {
      amountCents,
      currency: currency.trim().toLowerCase(),
      priceId: priceId.trim(),
    };
  }
  return null;
}

function checkoutAuthorizationConflictReason(
  value: unknown,
): CheckoutAuthorizationFailureReason {
  if (typeof value !== 'object' || value === null) return 'unavailable';
  const detail = (value as Record<string, unknown>).detail;
  if (typeof detail !== 'string') return 'unavailable';
  if (detail.toLowerCase().includes('already paid')) return 'already_paid';
  return 'unavailable';
}

export async function authorizeDeflectionCheckout(
  requestId: string,
): Promise<CheckoutAuthorizationResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId)) return { ok: false, reason: 'not_found' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${deflectionCheckoutAuthorizationPath(requestId)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (res.status === 409) {
      return {
        ok: false,
        reason: checkoutAuthorizationConflictReason(await res.json().catch(() => null)),
      };
    }
    if (res.status === 503) return { ok: false, reason: 'not_configured' };
    if (!res.ok) {
      console.error(`deflection checkout authorization failed: HTTP ${res.status}`);
      return { ok: false, reason: 'error' };
    }
    const checkout = parseCheckoutAuthorization(await res.json());
    if (!checkout) {
      console.error('deflection checkout authorization: upstream shape rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, checkout };
  } catch (err) {
    console.error(
      'deflection checkout authorization error:',
      err instanceof Error ? err.message : err,
    );
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

// The render maps these arrays directly as React children (e.g.
// `item.steps.map(s => <li>{s}</li>)`), so a non-string element (`[{}]`) throws
// "Objects are not valid as a React child". Validate the elements, not just
// array-ness.
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

// The render reads mapping.{customer_term, documentation_term, suggestion}
// without guards, so a `[null]` element would throw on property access.
function isTermMapping(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.customer_term === 'string' &&
    typeof m.documentation_term === 'string' &&
    typeof m.suggestion === 'string'
  );
}

// Validate the TicketFAQItem fields the report render reads — the render maps
// over steps/action_items/term_mappings and reads topic/question/answer/etc, so
// a malformed item would crash it. Reject the whole artifact if any item fails.
function isRenderableItem(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false;
  const i = v as Record<string, unknown>;
  return (
    typeof i.topic === 'string' &&
    typeof i.question === 'string' &&
    typeof i.answer === 'string' &&
    typeof i.when_to_contact_support === 'string' &&
    typeof i.answer_evidence_status === 'string' &&
    typeof i.ticket_count === 'number' &&
    typeof i.opportunity_score === 'number' &&
    isStringArray(i.steps) &&
    isStringArray(i.action_items) &&
    isStringArray(i.source_ids) &&
    isStringArray(i.source_labels) &&
    Array.isArray(i.term_mappings) &&
    i.term_mappings.every(isTermMapping)
  );
}

function parseArtifact(v: unknown): FAQDeflectionReportArtifact | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.markdown !== 'string') return null;

  const s = o.summary as Record<string, unknown> | undefined;
  if (
    !s ||
    typeof s.generated !== 'number' ||
    typeof s.drafted_answer_count !== 'number' ||
    typeof s.no_proven_answer_count !== 'number' ||
    typeof s.ticket_source_count !== 'number' ||
    typeof s.top_question !== 'string' ||
    typeof s.top_opportunity_score !== 'number' ||
    typeof s.output_checks !== 'object' ||
    s.output_checks === null
  ) {
    return null;
  }

  const fr = o.faq_result as Record<string, unknown> | undefined;
  if (
    !fr ||
    typeof fr.generated !== 'number' ||
    typeof fr.markdown !== 'string' ||
    !Array.isArray(fr.items) ||
    !fr.items.every(isRenderableItem)
  ) {
    return null;
  }

  return v as FAQDeflectionReportArtifact;
}

// Fetch the paid-gated full report. 200 → unlocked artifact; 403 → locked
// (payment required) → snapshot stays; 404 → no report; missing env / network /
// bad shape → error. The route renders the artifact only on `ok`.
export async function fetchDeflectionArtifact(
  requestId: string,
): Promise<ArtifactFetchResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId)) return { ok: false, reason: 'not_found' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${deflectionArtifactPath(requestId)}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 403) return { ok: false, reason: 'locked' };
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (!res.ok) {
      console.error(`deflection artifact fetch failed: HTTP ${res.status}`);
      return { ok: false, reason: 'error' };
    }
    const artifact = parseArtifact(await res.json());
    if (!artifact) {
      console.error('deflection artifact fetch: upstream shape rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, artifact };
  } catch (err) {
    console.error('deflection artifact fetch error:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
