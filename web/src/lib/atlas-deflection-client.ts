import {
  deflectionSnapshotPath,
  type DeflectionSnapshot,
  type DeflectionSnapshotQuestion,
} from '@/lib/deflection-snapshot';
import {
  deflectionArtifactPath,
  type FAQDeflectionReportArtifact,
} from '@/lib/deflection-report-contract';

// SERVER-ONLY by convention — import this only from server components / route
// handlers, never a client component. It reads `ATLAS_B2B_JWT` (a non-NEXT_PUBLIC_
// env var, so it is never bundled for the browser even if mis-imported).
// ATLAS client for the deflection funnel: reads the service-account credentials
// from env and fetches the free snapshot (GET /snapshot) and the paid-gated full
// report (GET /artifact → 200 unlocked / 403 locked). Go-live-gate discipline:
// validate the upstream shape, generic errors (no host/token leak), bounded
// request id, timeout.

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const FETCH_TIMEOUT_MS = 10_000;

export type SnapshotFetchResult =
  | { ok: true; snapshot: DeflectionSnapshot }
  | { ok: false; reason: 'not_configured' | 'not_found' | 'error' };

function atlasConfig(): { baseUrl: string; jwt: string } | null {
  const baseUrl = process.env.ATLAS_API_BASE_URL?.trim().replace(/\/$/, '');
  const jwt = process.env.ATLAS_B2B_JWT?.trim();
  if (!baseUrl || !jwt) return null;
  return { baseUrl, jwt };
}

function isQuestion(v: unknown): v is DeflectionSnapshotQuestion {
  if (typeof v !== 'object' || v === null) return false;
  const q = v as Record<string, unknown>;
  return (
    typeof q.rank === 'number' &&
    typeof q.question === 'string' &&
    typeof q.customer_wording === 'string' &&
    typeof q.weighted_frequency === 'number'
  );
}

function parseSnapshot(v: unknown): DeflectionSnapshot | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const s = o.summary as Record<string, unknown> | undefined;
  if (
    !s ||
    typeof s.generated !== 'number' ||
    typeof s.drafted_answer_count !== 'number' ||
    typeof s.no_proven_answer_count !== 'number'
  ) {
    return null;
  }
  if (!Array.isArray(o.top_questions) || !o.top_questions.every(isQuestion)) {
    return null;
  }
  return {
    summary: {
      generated: s.generated,
      drafted_answer_count: s.drafted_answer_count,
      no_proven_answer_count: s.no_proven_answer_count,
    },
    top_questions: o.top_questions as DeflectionSnapshotQuestion[],
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
        Authorization: `Bearer ${config.jwt}`,
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

function isStringArray(v: unknown): boolean {
  return Array.isArray(v);
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
    Array.isArray(i.term_mappings)
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
        Authorization: `Bearer ${config.jwt}`,
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
