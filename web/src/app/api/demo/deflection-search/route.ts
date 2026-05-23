import { NextRequest, NextResponse } from 'next/server';
import { matchLocal, type DeflectionIssue, type DeflectionSearchResponse } from '@/lib/deflection-demo';

// Backend seam for the Support Ticket Deflection demo.
//
//   GET /api/demo/deflection-search?q=<query>  →  200 { match: DeflectionIssue | null }
//
// With no Atlas env configured this answers from the local illustrative dataset
// (`matchLocal`), so the demo works out of the box and exercises the same
// debounce / out-of-order-guard / error-recovery paths the production backend
// will. To proxy a live Atlas deflection-search endpoint instead, set:
//
//   DEFLECTION_SEARCH_ATLAS_BASE_URL    e.g. https://atlas.example/api/deflection-search
//   DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN  bearer token (optional)
//
// (Server-only env — never NEXT_PUBLIC — matching audit-intake.ts's Atlas vars.)
// Wiring the real backend is then a single edit: fill in `mapAtlasMatch` for
// Atlas's actual response shape. The client (`searchDeflection`) never changes.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Adapts the Atlas upstream payload to our wire contract, validating it so a
 * malformed upstream response yields a clean 502 rather than rendered garbage.
 *
 * TODO(2c-finalize): adapt to Atlas's real response shape once known. For now it
 * expects Atlas to already return the wire shape: `{ match: DeflectionIssue | null }`.
 */
function mapAtlasMatch(raw: unknown): DeflectionSearchResponse {
  const match = (raw as { match?: unknown } | null)?.match ?? null;
  if (match === null) return { match: null };
  const m = match as Partial<DeflectionIssue>;
  const valid =
    typeof m.intent === 'string' &&
    typeof m.ticketsPerMonth === 'number' &&
    m.traditional != null &&
    m.improved != null;
  if (!valid) throw new Error('Atlas returned a malformed deflection match');
  return { match: match as DeflectionIssue };
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) return NextResponse.json({ match: null });

    const baseUrl = process.env.DEFLECTION_SEARCH_ATLAS_BASE_URL?.trim();
    if (baseUrl) {
      const token = process.env.DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN?.trim();
      const res = await fetch(`${baseUrl}?q=${encodeURIComponent(q)}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        return NextResponse.json(
          { match: null, error: `Atlas search failed: ${res.status}` },
          { status: 502 },
        );
      }
      try {
        return NextResponse.json(mapAtlasMatch(await res.json()));
      } catch {
        return NextResponse.json(
          { match: null, error: 'Atlas returned a malformed deflection match' },
          { status: 502 },
        );
      }
    }

    // No Atlas configured → local illustrative dataset.
    return NextResponse.json({ match: matchLocal(q) });
  } catch (error) {
    return NextResponse.json(
      { match: null, error: error instanceof Error ? error.message : 'Deflection search failed.' },
      { status: 500 },
    );
  }
}
