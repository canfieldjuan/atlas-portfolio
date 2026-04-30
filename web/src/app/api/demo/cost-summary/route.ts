import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Range = '24h' | '7d' | '30d';
type View = 'model' | 'feature' | 'tenant';

type Row = {
  key: string;
  label: string;
  spend: number;
  share: number;
  meta?: string;
  alert?: 'high' | 'medium';
};

type CostSummary = {
  range: Range;
  view: View;
  totalSpend: number;
  delta: number;
  rows: Row[];
  alerts: { title: string; detail: string; severity: 'high' | 'medium' }[];
  generatedAt: string;
  note: string;
};

const RANGE_TOTALS: Record<Range, { total: number; delta: number }> = {
  '24h': { total: 612.4, delta: 0.08 },
  '7d': { total: 4287.43, delta: 0.12 },
  '30d': { total: 18420.55, delta: -0.04 },
};

const MODEL_DIST: Omit<Row, 'spend'>[] = [
  { key: 'gpt-4o', label: 'gpt-4o', share: 0.49, meta: '18.4K calls · 12.4M tokens' },
  { key: 'sonnet-4', label: 'claude-sonnet-4', share: 0.31, meta: '8.2K calls · 9.1M tokens' },
  { key: 'mini', label: 'gpt-4o-mini', share: 0.10, meta: '41.2K calls · 28.3M tokens' },
  { key: 'embed', label: 'text-embedding-3', share: 0.10, meta: '92.1K calls · 41.0M tokens' },
];

const FEATURE_DIST: Omit<Row, 'spend'>[] = [
  { key: 'support-agent', label: 'Customer support agent', share: 0.425, meta: 'Tier-1 deflection workflow' },
  { key: 'doc-classify', label: 'Document classification', share: 0.282, meta: 'Inbound doc routing' },
  { key: 'reports', label: 'Report generation', share: 0.168, meta: 'Weekly exec briefings' },
  { key: 'rag', label: 'Search & RAG', share: 0.125, meta: 'Internal knowledge base' },
];

const TENANT_DIST: Omit<Row, 'spend'>[] = [
  { key: 'globex', label: 'Globex', share: 0.215, meta: 'Enterprise · 84 seats', alert: 'high' },
  { key: 'acme', label: 'Acme Co', share: 0.173, meta: 'Enterprise · 51 seats', alert: 'medium' },
  { key: 'initech', label: 'Initech', share: 0.119, meta: 'Growth · 22 seats' },
  { key: 'umbrella', label: 'Umbrella', share: 0.089, meta: 'Growth · 18 seats' },
  { key: 'other', label: 'Other tenants (28)', share: 0.404, meta: 'Pro & Starter plans' },
];

function pickDist(view: View): Omit<Row, 'spend'>[] {
  if (view === 'model') return MODEL_DIST;
  if (view === 'feature') return FEATURE_DIST;
  return TENANT_DIST;
}

function buildAlerts(view: View): CostSummary['alerts'] {
  if (view === 'tenant') {
    return [
      {
        title: 'Globex spend up 340% vs 7-day average',
        detail: 'Likely runaway loop in support agent. Circuit breaker armed; awaiting operator confirm.',
        severity: 'high',
      },
      {
        title: 'Acme Co at 82% of monthly budget',
        detail: '8 days remaining in cycle. Recommend bumping cap or routing to gpt-4o-mini for low-stakes calls.',
        severity: 'medium',
      },
    ];
  }
  if (view === 'feature') {
    return [
      {
        title: 'Support agent: cost-per-resolution up 22%',
        detail: 'Average tokens per ticket grew from 4.1K → 5.0K. Likely a context leak in the prompt.',
        severity: 'medium',
      },
    ];
  }
  return [
    {
      title: 'gpt-4o handling cheap traffic',
      detail: '38% of gpt-4o calls have <500 tokens. Eligible for routing to gpt-4o-mini at ~6% the cost.',
      severity: 'medium',
    },
  ];
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const range = (url.searchParams.get('range') as Range) || '7d';
  const view = (url.searchParams.get('view') as View) || 'model';

  if (!['24h', '7d', '30d'].includes(range)) {
    return NextResponse.json({ ok: false, error: 'Invalid range.' }, { status: 400 });
  }
  if (!['model', 'feature', 'tenant'].includes(view)) {
    return NextResponse.json({ ok: false, error: 'Invalid view.' }, { status: 400 });
  }

  const { total, delta } = RANGE_TOTALS[range];
  const rows: Row[] = pickDist(view).map((row) => ({
    ...row,
    spend: Math.round(total * row.share * 100) / 100,
  }));

  const summary: CostSummary = {
    range,
    view,
    totalSpend: total,
    delta,
    rows,
    alerts: buildAlerts(view),
    generatedAt: new Date().toISOString(),
    note: 'Demo data. A production deploy aggregates from provider APIs and an internal usage table on each request.',
  };

  return NextResponse.json({ ok: true, summary });
}
