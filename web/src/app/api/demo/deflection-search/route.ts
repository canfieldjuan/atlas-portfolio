import { NextRequest, NextResponse } from 'next/server';
import { matchLocal, type DeflectionIssue, type DeflectionSearchResponse } from '@/lib/deflection-demo';

// Backend seam for the Support Ticket Deflection demo.
//
//   GET /api/demo/deflection-search?q=<query>  →  200 { match: DeflectionIssue | null }
//
// With no Atlas env configured this answers from the local illustrative dataset
// (`matchLocal`), so the demo works out of the box. To proxy the live Atlas
// faq-deflection-search endpoint, set (server-only env, never NEXT_PUBLIC):
//
//   DEFLECTION_SEARCH_ATLAS_BASE_URL    e.g. https://atlas.example/api/v1/content-ops/faq-deflection-search
//   DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN  a B2B-growth (or higher) JWT
//
// The token's account must have approved rows in `ticket_faq_search_documents`,
// or the route works but returns no-match.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_Q = 256;
const UPSTREAM_TIMEOUT_MS = 8000;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// One item from the Atlas faq-deflection-search compact projection.
type AtlasFaqResult = {
  faq_id?: unknown;
  topic?: unknown;
  question?: unknown;
  answer_summary?: unknown;
  source_ids?: unknown;
  ticket_count?: unknown;
  score?: unknown;
};

/**
 * Adapts the Atlas `{ query, results:[…], count }` envelope to our wire contract.
 * Takes the top result. `score` is text-relevance (`ts_rank_cd * 1000`, unbounded),
 * so it's normalized within the returned set for the UI bar — never treated as a
 * percentage or an opportunity score. Validates every rendered field and throws
 * (→ 502 upstream) on a malformed result rather than rendering garbage.
 */
function mapAtlasMatch(raw: unknown): DeflectionSearchResponse {
  const results = (raw as { results?: unknown } | null)?.results;
  // A missing/renamed `results` is a contract break → surface it (502), not a
  // silent no-match. An empty array is a genuine no-match.
  if (!Array.isArray(results)) throw new Error('Atlas response missing results[]');
  if (results.length === 0) return { match: null, source: 'atlas' };

  const items = results as AtlasFaqResult[];
  const top = items[0];
  if (
    typeof top.faq_id !== 'string' ||
    typeof top.topic !== 'string' ||
    typeof top.question !== 'string' ||
    typeof top.answer_summary !== 'string' ||
    typeof top.ticket_count !== 'number' ||
    !Array.isArray(top.source_ids) ||
    top.source_ids.some((id) => typeof id !== 'string')
  ) {
    throw new Error('Atlas returned a malformed deflection result');
  }

  const scores = items.map((r) => (typeof r.score === 'number' ? r.score : 0));
  const maxScore = Math.max(...scores, 1);
  const topScore = typeof top.score === 'number' ? top.score : 0;
  const relevance = clamp(Math.round((topScore / maxScore) * 100), 0, 100);
  const summary = top.answer_summary.trim();

  const match: DeflectionIssue = {
    id: top.faq_id,
    intent: titleCase(top.topic),
    phrases: [],
    customerWording: top.question,
    documentationGap:
      'The compact search result identifies the repeat question and cited tickets; full wording-gap detail appears in the report.',
    sourceIds: top.source_ids,
    evidenceStatus: summary.length > 0 ? 'resolution_evidence' : 'draft_needs_review',
    ticketVolumeInSample: top.ticket_count,
    sourceCount: top.source_ids.length,
    improved: {
      title: top.question,
      body: summary,
      matchScore: relevance,
      matchLabel: relevance >= 80 ? 'Top relevance match' : 'Relevant match',
      format: 'Report FAQ answer',
      hasSolution: summary.length > 0,
      actions: ['View the full answer', 'Contact support'],
    },
  };
  return { match, source: 'atlas' };
}

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_Q);
    if (!q) return NextResponse.json({ match: null, source: 'local' });

    const baseUrl = process.env.DEFLECTION_SEARCH_ATLAS_BASE_URL?.trim();
    if (!baseUrl) {
      // No Atlas configured → local illustrative dataset.
      return NextResponse.json({ match: matchLocal(q), source: 'local' });
    }

    const token = process.env.DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN?.trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}?q=${encodeURIComponent(q)}&limit=5`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      console.error(`deflection-search: upstream returned ${res.status}`);
      return NextResponse.json(
        { match: null, error: 'Search is temporarily unavailable.' },
        { status: 502 },
      );
    }

    try {
      return NextResponse.json(mapAtlasMatch(await res.json()));
    } catch (err) {
      console.error('deflection-search: adapter rejected upstream payload:', err);
      return NextResponse.json(
        { match: null, error: 'Search returned an unexpected result.' },
        { status: 502 },
      );
    }
  } catch (error) {
    // Generic client messages only — the real cause is logged server-side so the
    // upstream host/details never leak into the response.
    if ((error as { name?: string } | null)?.name === 'AbortError') {
      console.error('deflection-search: upstream timed out');
      return NextResponse.json(
        { match: null, error: 'Search timed out. Please try again.' },
        { status: 504 },
      );
    }
    console.error('deflection-search: unexpected error:', error);
    return NextResponse.json(
      { match: null, error: 'Search failed. Please try again.' },
      { status: 500 },
    );
  }
}
