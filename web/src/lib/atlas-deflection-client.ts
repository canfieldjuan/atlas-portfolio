import {
  deflectionSnapshotPath,
  type DeflectionSnapshot,
  type DeflectionSnapshotQuestion,
} from '@/lib/deflection-snapshot';

// SERVER-ONLY by convention — import this only from server components / route
// handlers, never a client component. It reads `ATLAS_B2B_JWT` (a non-NEXT_PUBLIC_
// env var, so it is never bundled for the browser even if mis-imported).
// ATLAS client for the deflection funnel: reads the service-account credentials
// from env and fetches the free snapshot. The full report lives behind ATLAS's paid gate (GET /artifact) and
// is a separate slice. Go-live-gate discipline: validate the upstream shape,
// generic errors (no host/token leak), bounded request id, timeout.

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
