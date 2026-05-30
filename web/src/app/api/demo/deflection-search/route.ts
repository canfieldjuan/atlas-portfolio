import { NextRequest, NextResponse } from 'next/server';
import { matchLocal, type DeflectionSearchResponse } from '@/lib/deflection-demo';

// Backend seam for the Support Ticket Deflection demo.
//
//   GET /api/demo/deflection-search?q=<query>
//   -> 200 { match: TicketFAQItem | null, source: 'local' }
//
// The canonical ATLAS report contract is
// docs/frontend/content_ops_faq_report_contract.md in canfieldjuan/ATLAS.
// Compact search rows are only previews and do not include term_mappings,
// evidence, steps, or the top-level artifact markdown, so this endpoint does
// not adapt compact search into a fake full report item. Wire live hydration to
// the full FAQDeflectionReportArtifact / TicketFAQItem source in a later slice.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_Q = 256;

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_Q);
    const response: DeflectionSearchResponse = {
      match: q ? matchLocal(q) : null,
      source: 'local',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('deflection-search: unexpected error:', error);
    return NextResponse.json(
      { match: null, error: 'Search failed. Please try again.' },
      { status: 500 },
    );
  }
}
