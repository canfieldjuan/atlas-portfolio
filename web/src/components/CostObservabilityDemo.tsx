'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';

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

type Summary = {
  range: Range;
  view: View;
  totalSpend: number;
  delta: number;
  rows: Row[];
  alerts: { title: string; detail: string; severity: 'high' | 'medium' }[];
  generatedAt: string;
  note: string;
};

const RANGES: { id: Range; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
];

const VIEWS: { id: View; label: string }[] = [
  { id: 'model', label: 'By model' },
  { id: 'feature', label: 'By feature' },
  { id: 'tenant', label: 'By tenant' },
];

function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CostObservabilityDemo() {
  const [range, setRange] = useState<Range>('7d');
  const [view, setView] = useState<View>('model');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/demo/cost-summary?range=${range}&view=${view}`,
          { cache: 'no-store' }
        );
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || 'Unable to load cost summary.');
        }
        setSummary(data.summary as Summary);
      } catch (err) {
        if (cancelled) return;
        setSummary(null);
        setError(err instanceof Error ? err.message : 'Unable to load cost summary.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [range, view]);

  const maxShare = summary ? Math.max(...summary.rows.map((row) => row.share)) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
            ADMIN COST CONSOLE
          </div>
          <h3 className="text-xl font-semibold text-white">AI spend by {view}</h3>
          <p className="text-xs text-foreground/50 mt-1">
            Server-backed demo route: <code className="text-foreground/70">/api/demo/cost-summary</code>. Filters re-fetch deterministic cost summaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              aria-pressed={range === r.id}
              className={`px-3 py-1.5 rounded-md border text-xs font-mono tracking-widest transition-colors ${
                range === r.id
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/[0.02] text-foreground/60 hover:border-white/20'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 md:col-span-1">
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">TOTAL SPEND</div>
          <div className="text-3xl font-semibold text-white">
            {summary ? formatUsd(summary.totalSpend) : '--'}
          </div>
          {summary && (
            <div
              className={`mt-2 inline-flex items-center gap-1 text-xs font-mono ${
                summary.delta >= 0 ? 'text-yellow-300/80' : 'text-emerald-300/80'
              }`}
            >
              {summary.delta >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {(summary.delta * 100).toFixed(1)}% vs prior period
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 md:col-span-2">
          <div className="flex flex-wrap gap-2 mb-3">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                  view === v.id
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-white/10 bg-white/[0.02] text-foreground/60 hover:border-white/20'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-foreground/50 leading-relaxed">
            Switch between model, feature, and tenant breakdowns. Each view recalculates on the
            server and returns a fresh row set with its own alert profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-4">
            BREAKDOWN
          </div>
          {error && (
            <div className="text-sm text-red-300/80">{error}</div>
          )}
          {!error && !summary && (
            <div className="flex items-center gap-2 text-sm text-foreground/50">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
          {summary && (
            <div className="space-y-4" aria-busy={isLoading}>
              {summary.rows.map((row) => {
                const widthPct = maxShare > 0 ? (row.share / maxShare) * 100 : 0;
                return (
                  <div key={row.key}>
                    <div className="flex items-baseline justify-between mb-1.5 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-white truncate">{row.label}</span>
                        {row.alert === 'high' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-red-400/40 bg-red-500/10 text-red-300/90">
                            ALERT
                          </span>
                        )}
                        {row.alert === 'medium' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-yellow-400/30 bg-yellow-500/10 text-yellow-200/90">
                            WATCH
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-mono text-foreground/80 shrink-0">
                        {formatUsd(row.spend)}
                        <span className="text-foreground/40 ml-2">{(row.share * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          row.alert === 'high'
                            ? 'bg-red-400/70'
                            : row.alert === 'medium'
                            ? 'bg-yellow-300/70'
                            : 'bg-primary/70'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    {row.meta && (
                      <div className="text-[11px] font-mono text-foreground/40 mt-1.5">{row.meta}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-4">
            ACTIVE ALERTS
          </div>
          {summary && summary.alerts.length === 0 && (
            <div className="text-sm text-foreground/50">No alerts in this view.</div>
          )}
          {summary && (
            <div className="space-y-3">
              {summary.alerts.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-md border p-3 ${
                    alert.severity === 'high'
                      ? 'border-red-400/30 bg-red-500/5'
                      : 'border-yellow-300/20 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        alert.severity === 'high' ? 'text-red-300' : 'text-yellow-300/90'
                      }`}
                    />
                    <div className="text-sm text-white leading-snug">{alert.title}</div>
                  </div>
                  <div className="text-xs text-foreground/55 leading-relaxed pl-5">{alert.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {summary && (
        <p className="text-[11px] font-mono text-foreground/35 mt-4 leading-relaxed">
          {summary.note} | Generated {new Date(summary.generatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
