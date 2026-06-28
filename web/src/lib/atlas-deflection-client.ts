import {
  deflectionSnapshotPath,
  type DeflectionSnapshot,
  type DeflectionSnapshotAnswerPreview,
  type DeflectionSnapshotBlindSpot,
  type DeflectionSnapshotFullAnswer,
  type DeflectionSnapshotLockedQuestion,
  type DeflectionSnapshotQuestion,
  type DeflectionSnapshotSourceWindow,
  type DeflectionSnapshotTeaser,
} from '@/lib/deflection-snapshot';
import {
  DEFLECTION_REPORT_HOSTED_FIELD_CONTRACT,
  DEFLECTION_REPORT_HOSTED_FIELD_SHAPES,
  deflectionArtifactPath,
  deflectionReportModelPath,
  type DeflectionStructuredReport,
  type FAQDeflectionReportArtifact,
  type TicketFAQItem,
} from '@/lib/deflection-report-contract';
import { get } from '@vercel/blob';
import { gapReportBlobToken, gapReportBlobTokens, type SupportPlatform } from '@/lib/gap-report-intake';
import { structuredRuntimeError } from '@/lib/structured-runtime-log';
import type { DeflectionPriceVariantId } from '@/lib/deflection-pricing';

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
const REPORT_DELETE_TIMEOUT_MS = 3_000;
const ARTIFACT_FETCH_TIMEOUT_MS = 60_000;
// The full-volume submit streams up to 50 MB of CSV to ATLAS and waits for
// the deterministic report build (~52s measured at 35k rows), so it needs a
// much larger budget than the small JSON fetches. Keep it below the /record
// route maxDuration so the route can still return a JSON error on timeout.
const SUBMIT_TIMEOUT_MS = 240_000;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SnapshotFetchResult =
  | { ok: true; snapshot: DeflectionSnapshot }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'error' };

export type DeflectionReportDeleteResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'error' };

function atlasConfig(): { baseUrl: string; token: string } | null {
  const baseUrl = process.env.ATLAS_API_BASE_URL?.trim().replace(/\/$/, '');
  const token = process.env.ATLAS_B2B_SERVICE_TOKEN?.trim();
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

function deflectionReportDeletePath(reportRequestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(reportRequestId)}`;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
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
    isNonEmptyString(q.question) &&
    typeof q.customer_wording === 'string' &&
    isNonNegativeNumber(q.ticket_count) &&
    typeof q.weighted_frequency === 'number' &&
    isNonEmptyString(q.owner_lane) &&
    isNonEmptyString(q.action_label) &&
    isNonNegativeNumber(q.estimated_support_cost)
  ) {
    return {
      rank: q.rank,
      question: q.question,
      customer_wording: q.customer_wording,
      ticket_count: q.ticket_count,
      weighted_frequency: q.weighted_frequency,
      owner_lane: q.owner_lane,
      action_label: q.action_label,
      estimated_support_cost: q.estimated_support_cost,
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

function parseBlindSpot(v: unknown): DeflectionSnapshotBlindSpot | null {
  if (typeof v !== 'object' || v === null) return null;
  const q = v as Record<string, unknown>;
  if (
    typeof q.rank === 'number' &&
    isNonEmptyString(q.question) &&
    isNonNegativeNumber(q.ticket_count) &&
    isNonEmptyString(q.owner_lane) &&
    isNonEmptyString(q.action_label) &&
    isNonNegativeNumber(q.estimated_support_cost)
  ) {
    return {
      rank: q.rank,
      question: q.question,
      ticket_count: q.ticket_count,
      owner_lane: q.owner_lane,
      action_label: q.action_label,
      estimated_support_cost: q.estimated_support_cost,
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
    typeof s.support_ticket_resolution_evidence_present !== 'boolean' ||
    !isNonNegativeNumber(s.support_ticket_resolution_evidence_count) ||
    !isNonNegativeNumber(s.repeat_ticket_count) ||
    !isNonNegativeNumber(s.non_repeat_ticket_count)
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
  if (!Array.isArray(o.top_blind_spots)) {
    return null;
  }
  const blindSpots: DeflectionSnapshotBlindSpot[] = [];
  for (const blindSpot of o.top_blind_spots) {
    const parsedBlindSpot = parseBlindSpot(blindSpot);
    if (!parsedBlindSpot) return null;
    blindSpots.push(parsedBlindSpot);
  }
  const teaser = parseTeaser(o.teaser);
  if (!teaser) return null;
  const sourceWindow = parseDeflectionSnapshotSourceWindow(s);
  return {
    summary: {
      generated: s.generated,
      drafted_answer_count: s.drafted_answer_count,
      no_proven_answer_count: s.no_proven_answer_count,
      support_ticket_resolution_evidence_present: s.support_ticket_resolution_evidence_present,
      support_ticket_resolution_evidence_count: s.support_ticket_resolution_evidence_count,
      repeat_ticket_count: s.repeat_ticket_count,
      non_repeat_ticket_count: s.non_repeat_ticket_count,
      ...(sourceWindow ?? {}),
    },
    top_questions: topQuestions,
    locked_questions: lockedQuestions,
    top_blind_spots: blindSpots,
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
      structuredRuntimeError('deflection.snapshot.fetch_http_error', { status: res.status });
      return { ok: false, reason: 'error' };
    }
    const snapshot = parseSnapshot(await res.json());
    if (!snapshot) {
      structuredRuntimeError('deflection.snapshot.shape_rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, snapshot };
  } catch (err) {
    // Generic — never surface the upstream host or token.
    structuredRuntimeError('deflection.snapshot.fetch_error', { error: err });
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

export async function deleteDeflectionReport(
  reportRequestId: string,
): Promise<DeflectionReportDeleteResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(reportRequestId)) return { ok: false, reason: 'not_found' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPORT_DELETE_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${deflectionReportDeletePath(reportRequestId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 204 || res.status === 404) return { ok: true };
    if (!res.ok) {
      structuredRuntimeError('deflection.report_delete.http_error', { status: res.status });
      return { ok: false, reason: 'error' };
    }
    structuredRuntimeError('deflection.report_delete.unexpected_status', { status: res.status });
    return { ok: false, reason: 'error' };
  } catch (err) {
    structuredRuntimeError('deflection.report_delete.error', { error: err });
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

export type ArtifactFetchResult =
  | { ok: true; artifact: FAQDeflectionReportArtifact }
  | { ok: false; reason: 'not_configured' | 'locked' | 'not_found' | 'error' };

export type ReportModelFetchResult =
  | { ok: true; model: DeflectionStructuredReport }
  | { ok: false; reason: 'not_configured' | 'locked' | 'not_found' | 'error' };

type ParsedReportSection = {
  id: string;
  title: string;
  priority: number;
  surfaces: string[];
  default_limit: number | null;
  required_data: string[];
  snapshot_safe_fields: string[];
  data: Record<string, unknown>;
};

export type DeflectionCheckoutAuthorization = {
  amountCents: number;
  currency: string;
  priceId: string;
};

export type DeflectionStandardPricingTerms = {
  variant: 'standard';
  status: 'configured';
  amountCents: number;
  currency: string;
};

export type DeflectionPricingTerms = {
  variant: DeflectionPriceVariantId;
  status: 'configured';
  amountCents: number;
  currency: string;
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

export type StandardPricingTermsResult =
  | { ok: true; terms: DeflectionStandardPricingTerms }
  | { ok: false; reason: 'not_configured' | 'unavailable' | 'error' };

export type PricingTermsResult =
  | { ok: true; terms: DeflectionPricingTerms }
  | { ok: false; reason: 'not_configured' | 'unavailable' | 'error' };

export type DeflectionSubmitResult =
  | { ok: true; requestId: string }
  | {
      ok: false;
      reason: 'not_configured' | 'blob_not_found' | 'invalid_response' | 'rejected' | 'error';
    };

export type UploadedDeflectionSearchResult =
  | { ok: true; item: TicketFAQItem | null }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'invalid_response' | 'error' };

export type DeflectionSubmitInput = {
  csvBlobUrl: string;
  csvFilename: string;
  companyName: string;
  contactEmail: string;
  supportPlatform: SupportPlatform;
};

const DEFLECTION_SUBMIT_PATH = '/api/v1/content-ops/deflection-reports/submit';
const DEFLECTION_PRICING_TERMS_PATH =
  '/api/v1/content-ops/deflection-reports/pricing';
const DEFLECTION_REPORT_SEARCH_LIMIT = 5;
const SUPPORT_PLATFORM_SUBMIT_VALUE: Record<SupportPlatform, string> = {
  zendesk: 'zendesk',
  intercom: 'intercom',
  freshdesk: 'other',
  helpscout: 'help_scout',
  other: 'other',
};
const CHECKOUT_AUTHORIZATION_PRICE_VARIANT_IDS = new Set(['standard', 'partner']);

function checkoutAuthorizationPriceVariant(value: DeflectionPriceVariantId | undefined): string | null {
  if (value === undefined) return '';
  return CHECKOUT_AUTHORIZATION_PRICE_VARIANT_IDS.has(value) ? value : null;
}

function deflectionCheckoutAuthorizationPath(
  requestId: string,
  priceVariantId?: DeflectionPriceVariantId,
): string | null {
  const priceVariant = checkoutAuthorizationPriceVariant(priceVariantId);
  if (priceVariant === null) return null;
  const path = `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/checkout-authorization`;
  if (!priceVariant) return path;
  const params = new URLSearchParams({ price_variant: priceVariant });
  return `${path}?${params.toString()}`;
}

function deflectionPricingTermsPath(priceVariantId: DeflectionPriceVariantId): string | null {
  const priceVariant = checkoutAuthorizationPriceVariant(priceVariantId);
  if (!priceVariant) return null;
  return `${DEFLECTION_PRICING_TERMS_PATH}/${encodeURIComponent(priceVariant)}`;
}

function deflectionReportSearchPath(requestId: string): string {
  return `/api/v1/content-ops/deflection-reports/${encodeURIComponent(requestId)}/search`;
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

function parseSearchResultItem(value: unknown): TicketFAQItem | null {
  if (isRenderableItem(value)) return value as TicketFAQItem;
  if (!isPlainRecord(value)) return null;
  const nested = value.item ?? value.faq_item;
  return isRenderableItem(nested) ? (nested as TicketFAQItem) : null;
}

function parseUploadedDeflectionSearchResponse(value: unknown): TicketFAQItem | null | undefined {
  if (!isPlainRecord(value) || !Array.isArray(value.results)) return undefined;
  if (value.results.length === 0) return null;
  const item = parseSearchResultItem(value.results[0]);
  return item ?? undefined;
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
    structuredRuntimeError('deflection.submit.blob_read_error', { error: err });
    return { ok: false, reason: 'blob_not_found' };
  }

  const form = new FormData();
  form.set('csv_file', csvBlob, safeCsvFilename(input.csvFilename));
  form.set('support_platform', SUPPORT_PLATFORM_SUBMIT_VALUE[input.supportPlatform]);
  form.set('company_name', input.companyName);
  form.set('contact_email', input.contactEmail);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
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
      structuredRuntimeError('deflection.submit.http_error', { status: res.status });
      return { ok: false, reason: 'rejected' };
    }
    const requestId = parseSubmitRequestId(await res.json());
    if (!requestId) {
      structuredRuntimeError('deflection.submit.shape_rejected');
      return { ok: false, reason: 'invalid_response' };
    }
    return { ok: true, requestId };
  } catch (err) {
    structuredRuntimeError('deflection.submit.error', { error: err });
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

export async function searchUploadedDeflectionReport(input: {
  requestId: string;
  query: string;
}): Promise<UploadedDeflectionSearchResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(input.requestId)) return { ok: false, reason: 'not_found' };
  const query = input.query.trim();
  if (!query) return { ok: true, item: null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${deflectionReportSearchPath(input.requestId)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        limit: DEFLECTION_REPORT_SEARCH_LIMIT,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (!res.ok) {
      structuredRuntimeError('deflection.uploaded_search.http_error', { status: res.status });
      return { ok: false, reason: 'error' };
    }
    const item = parseUploadedDeflectionSearchResponse(await res.json());
    if (item === undefined) {
      structuredRuntimeError('deflection.uploaded_search.shape_rejected');
      return { ok: false, reason: 'invalid_response' };
    }
    return { ok: true, item };
  } catch (err) {
    structuredRuntimeError('deflection.uploaded_search.error', { error: err });
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

function parsePricingTerms(
  v: unknown,
  expectedVariant: DeflectionPriceVariantId,
): DeflectionPricingTerms | null {
  if (typeof v !== 'object' || v === null) return null;
  const terms = v as Record<string, unknown>;
  const amountCents = terms.amount_cents;
  const currency = terms.currency;
  if (
    terms.variant === expectedVariant &&
    terms.status === 'configured' &&
    typeof amountCents === 'number' &&
    Number.isSafeInteger(amountCents) &&
    amountCents > 0 &&
    typeof currency === 'string' &&
    /^[a-zA-Z]{3}$/.test(currency)
  ) {
    return {
      variant: expectedVariant,
      status: 'configured',
      amountCents,
      currency: currency.trim().toLowerCase(),
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

export async function fetchDeflectionPricingTerms(
  priceVariantId: DeflectionPriceVariantId,
): Promise<PricingTermsResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  const pricingPath = deflectionPricingTermsPath(priceVariantId);
  if (!pricingPath) return { ok: false, reason: 'error' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${pricingPath}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 503) return { ok: false, reason: 'not_configured' };
    if (!res.ok) {
      structuredRuntimeError('deflection.pricing_terms.http_error', {
        priceVariantId,
        status: res.status,
      });
      return { ok: false, reason: 'unavailable' };
    }
    const terms = parsePricingTerms(await res.json(), priceVariantId);
    if (!terms) {
      structuredRuntimeError('deflection.pricing_terms.shape_rejected', { priceVariantId });
      return { ok: false, reason: 'error' };
    }
    return { ok: true, terms };
  } catch (err) {
    structuredRuntimeError('deflection.pricing_terms.error', { priceVariantId, error: err });
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDeflectionStandardPricingTerms(): Promise<StandardPricingTermsResult> {
  const result = await fetchDeflectionPricingTerms('standard');
  if (!result.ok) return result;
  return { ok: true, terms: result.terms as DeflectionStandardPricingTerms };
}

export async function authorizeDeflectionCheckout(
  requestId: string,
  priceVariantId?: DeflectionPriceVariantId,
): Promise<CheckoutAuthorizationResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId)) return { ok: false, reason: 'not_found' };
  const authorizationPath = deflectionCheckoutAuthorizationPath(requestId, priceVariantId);
  if (!authorizationPath) return { ok: false, reason: 'error' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${authorizationPath}`, {
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
      structuredRuntimeError('deflection.checkout_authorization.http_error', {
        status: res.status,
      });
      return { ok: false, reason: 'error' };
    }
    const checkout = parseCheckoutAuthorization(await res.json());
    if (!checkout) {
      structuredRuntimeError('deflection.checkout_authorization.shape_rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, checkout };
  } catch (err) {
    structuredRuntimeError('deflection.checkout_authorization.error', { error: err });
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
// Keep this shape aligned with `summarizeRenderableItem` in
// `web/scripts/smoke-deflection-uploaded-search.mjs` and ATLAS
// `_deflection_report_full_item`.
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return null;
  }
  return value;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isHostedScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

type HostedFieldContract = {
  shape: string;
  required: boolean;
  nullable: boolean;
  value?: string;
};

function hostedFieldShapes(ownerPath: string): Record<string, string> {
  const shapes = (DEFLECTION_REPORT_HOSTED_FIELD_SHAPES as Record<string, unknown>)[ownerPath];
  return isPlainRecord(shapes)
    ? Object.fromEntries(
      Object.entries(shapes).filter((entry): entry is [string, string] => (
        typeof entry[0] === 'string' && typeof entry[1] === 'string'
      )),
    )
    : {};
}

function isHostedFieldContract(value: unknown): value is HostedFieldContract {
  return (
    isPlainRecord(value) &&
    typeof value.shape === 'string' &&
    typeof value.required === 'boolean' &&
    typeof value.nullable === 'boolean' &&
    (
      value.value === undefined ||
      typeof value.value === 'string'
    )
  );
}

function hostedFieldContracts(ownerPath: string): Record<string, HostedFieldContract> {
  const contracts = (DEFLECTION_REPORT_HOSTED_FIELD_CONTRACT as Record<string, unknown>)[ownerPath];
  return isPlainRecord(contracts)
    ? Object.fromEntries(
      Object.entries(contracts).filter((entry): entry is [string, HostedFieldContract] => (
        typeof entry[0] === 'string' && isHostedFieldContract(entry[1])
      )),
    )
    : {};
}

function validateHostedScalarValue(value: unknown, contract: HostedFieldContract): boolean {
  if (value === null) {
    return contract.nullable;
  }
  if (contract.value === 'string') {
    return typeof value === 'string';
  }
  if (contract.value === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (contract.value === 'boolean') {
    return typeof value === 'boolean';
  }
  return isHostedScalar(value);
}

function validateHostedValue(value: unknown, ownerPath: string, contract: HostedFieldContract): boolean {
  if (value === null) {
    return contract.nullable;
  }
  const shape = contract.shape;
  if (shape === 'scalar') {
    return validateHostedScalarValue(value, contract);
  }
  if (shape === 'scalar_array') {
    return Array.isArray(value) && value.every((item) => validateHostedScalarValue(item, contract));
  }
  if (shape === 'record') {
    return isPlainRecord(value) && Object.values(value).every((item) => validateHostedScalarValue(item, contract));
  }
  if (shape === 'object') {
    return isPlainRecord(value) && validateHostedFields(value, ownerPath);
  }
  if (shape === 'object_array') {
    return Array.isArray(value) && value.every((item) => (
      isPlainRecord(item) && validateHostedFields(item, ownerPath)
    ));
  }
  return false;
}

function validateHostedFields(data: Record<string, unknown>, ownerPath: string): boolean {
  return Object.entries(hostedFieldContracts(ownerPath)).every(([field, contract]) => {
    if (!(field in data)) {
      return !contract.required;
    }
    return validateHostedValue(data[field], `${ownerPath}.${field}`, contract);
  });
}

function projectHostedFields(data: Record<string, unknown>, ownerPath: string): Record<string, unknown> {
  const projected: Record<string, unknown> = {};
  for (const [field, shape] of Object.entries(hostedFieldShapes(ownerPath))) {
    if (!(field in data)) continue;
    const value = data[field];
    const nestedPath = `${ownerPath}.${field}`;
    if (shape === 'scalar' && isHostedScalar(value)) {
      projected[field] = value;
    } else if (shape === 'scalar_array' && Array.isArray(value) && value.every(isHostedScalar)) {
      projected[field] = value.slice();
    } else if (shape === 'record' && isPlainRecord(value)) {
      projected[field] = Object.fromEntries(
        Object.entries(value).filter((entry): entry is [string, string | number | boolean | null] => (
          isHostedScalar(entry[1])
        )),
      );
    } else if (shape === 'object') {
      if (value === null) {
        projected[field] = null;
      } else if (isPlainRecord(value)) {
        projected[field] = projectHostedFields(value, nestedPath);
      }
    } else if (shape === 'object_array' && Array.isArray(value)) {
      projected[field] = value
        .filter(isPlainRecord)
        .map((item) => projectHostedFields(item, nestedPath));
    }
  }
  return projected;
}

function constructWebReportSection(section: ParsedReportSection): ParsedReportSection | null {
  if (!validateHostedFields(section.data, section.id)) return null;
  return {
    ...section,
    data: projectHostedFields(section.data, section.id),
  };
}

function parseReportSection(value: unknown): ParsedReportSection | null {
  if (!isPlainRecord(value)) return null;
  const surfaces = parseStringList(value.surfaces);
  const requiredData = parseStringList(value.required_data);
  const snapshotSafeFields = parseStringList(value.snapshot_safe_fields);
  const data = value.data;
  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.priority !== 'number' ||
    !Number.isFinite(value.priority) ||
    !surfaces ||
    !requiredData ||
    !snapshotSafeFields ||
    !(value.default_limit === null || isNonNegativeFiniteNumber(value.default_limit)) ||
    !isPlainRecord(data)
  ) {
    return null;
  }
  if (requiredData.some((key) => !(key in data))) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    priority: value.priority,
    surfaces,
    default_limit: value.default_limit,
    required_data: requiredData,
    snapshot_safe_fields: snapshotSafeFields,
    data,
  };
}

function parseReportModel(value: unknown): DeflectionStructuredReport | null {
  if (!isPlainRecord(value)) return null;
  if (
    value.schema_version !== 'deflection.v1' ||
    typeof value.title !== 'string' ||
    !isPlainRecord(value.summary) ||
    !Array.isArray(value.sections)
  ) {
    return null;
  }
  const sections: ParsedReportSection[] = [];
  for (const section of value.sections) {
    const surfaces = isPlainRecord(section) ? parseStringList(section.surfaces) : null;
    const isWebSection = surfaces?.includes('web') === true;
    const parsed = parseReportSection(section);
    if (!parsed) {
      if (surfaces && !isWebSection) continue;
      return null;
    }
    if (!parsed.surfaces.includes('web')) continue;
    const constructed = constructWebReportSection(parsed);
    if (!constructed) return null;
    sections.push(constructed);
  }
  if (!sections.some((section) => section.id === 'support_tax')) return null;
  if (!sections.some((section) => section.id === 'priority_fix_queue')) return null;
  return {
    schema_version: 'deflection.v1',
    title: value.title,
    summary: value.summary,
    sections: sections as DeflectionStructuredReport['sections'],
  };
}

export async function fetchDeflectionReportModel(
  requestId: string,
): Promise<ReportModelFetchResult> {
  const config = atlasConfig();
  if (!config) return { ok: false, reason: 'not_configured' };
  if (!REQUEST_ID_RE.test(requestId)) return { ok: false, reason: 'not_found' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${config.baseUrl}${deflectionReportModelPath(requestId)}`, {
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
      structuredRuntimeError('deflection.report_model.http_error', { status: res.status });
      return { ok: false, reason: 'error' };
    }
    const model = parseReportModel(await res.json());
    if (!model) {
      structuredRuntimeError('deflection.report_model.shape_rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, model };
  } catch (err) {
    structuredRuntimeError('deflection.report_model.fetch_error', { error: err });
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
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
  const timer = setTimeout(() => controller.abort(), ARTIFACT_FETCH_TIMEOUT_MS);
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
      structuredRuntimeError('deflection.artifact.http_error', { status: res.status });
      return { ok: false, reason: 'error' };
    }
    const artifact = parseArtifact(await res.json());
    if (!artifact) {
      structuredRuntimeError('deflection.artifact.shape_rejected');
      return { ok: false, reason: 'error' };
    }
    return { ok: true, artifact };
  } catch (err) {
    structuredRuntimeError('deflection.artifact.fetch_error', { error: err });
    return { ok: false, reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
