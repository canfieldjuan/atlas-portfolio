'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type {
  DeflectionSnapshot,
  DeflectionSnapshotAnswerPreview,
  DeflectionSnapshotFullAnswer,
  DeflectionSnapshotSourceWindow,
} from '@/lib/deflection-snapshot';
import {
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL,
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  DEFLECTION_DEFAULT_PRICE_VARIANT,
} from '@/lib/deflection-pricing';

const FINALIZING_ATTEMPTS = 10;
const FINALIZING_INTERVAL_MS = 1500;
const ASSISTED_CONTACT_COST_MIN = 5;
const ASSISTED_CONTACT_COST_MAX = 75;
const ASSISTED_CONTACT_COST_STEP = 0.5;
const FULL_REPORT_PRICE_LABEL = DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function usd(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function count(value: number) {
  return Math.round(value).toLocaleString();
}

function costLabel(value: number) {
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function formatSourceDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatSourceWindow(window: DeflectionSnapshotSourceWindow) {
  return `${formatSourceDate(window.source_date_start)} to ${formatSourceDate(window.source_date_end)} (${count(window.source_window_days)} days)`;
}

function ProjectionMetric({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        highlight
          ? 'border-primary/40 bg-primary/[0.03] shadow-[var(--primary-glow-tight)]'
          : 'border-border bg-surface shadow-[0_4px_20px_rgba(23,35,31,0.02)] hover:border-primary/20'
      }`}
    >
      <div
        className={`text-[10px] font-mono uppercase tracking-widest ${
          highlight ? 'font-semibold text-primary' : 'text-foreground/50'
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight md:text-3xl ${
          highlight ? 'text-primary-dark' : 'text-foreground'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-foreground/55">{sub}</div>
    </div>
  );
}

function SupportTaxProjection({
  repeatTicketCount,
  assistedContactCost,
  sourceWindow,
  onAssistedContactCostChange,
  onUnlock,
  unlockLabel,
  unlockDisabled,
  unlockBusy,
}: {
  repeatTicketCount: number;
  assistedContactCost: number;
  sourceWindow?: DeflectionSnapshotSourceWindow;
  onAssistedContactCostChange: (value: number) => void;
  onUnlock: () => void;
  unlockLabel: string;
  unlockDisabled: boolean;
  unlockBusy: boolean;
}) {
  const batchCost = repeatTicketCount * assistedContactCost;
  const normalizedWindow = sourceWindow
    ? {
        dailyCost: batchCost / sourceWindow.source_window_days,
        days: sourceWindow.source_window_days,
      }
    : null;
  const annualRunRate = normalizedWindow === null ? batchCost * 12 : normalizedWindow.dailyCost * 365;
  const threeYearRunRate = normalizedWindow === null ? batchCost * 36 : normalizedWindow.dailyCost * 365 * 3;
  const commitCost = (value: number) => {
    if (!Number.isFinite(value)) return;
    onAssistedContactCostChange(
      clamp(value, ASSISTED_CONTACT_COST_MIN, ASSISTED_CONTACT_COST_MAX),
    );
  };
  const windowLabel = sourceWindow ? formatSourceWindow(sourceWindow) : null;

  return (
    <section
      className="mb-10 rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 shadow-[var(--primary-glow)]"
      aria-labelledby="support-tax-heading"
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
            Support Tax projection
          </p>
          <h2 id="support-tax-heading" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Your uploaded repeat tickets size to {usd(batchCost)} of assisted-contact work.
          </h2>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/65">
        ATLAS counted <strong className="text-foreground">{count(repeatTicketCount)}</strong>{' '}
        repeat-ticket hits {windowLabel ? `from ${windowLabel}` : 'in this snapshot'}. The
        estimate below multiplies that measured count by a configurable assisted-contact
        benchmark, defaulting to Gartner&apos;s{' '}
        <strong className="text-foreground">
          {DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL}
        </strong>{' '}
        assisted-contact figure used elsewhere on this page.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <label htmlFor="assisted-contact-cost" className="text-sm font-medium text-foreground">
              Assisted-contact cost
            </label>
            <p className="mt-1 text-xs text-foreground/45">
              Adjust this if your loaded cost per repeat ticket is higher or lower.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-foreground/50">$</span>
            <input
              id="assisted-contact-cost"
              type="number"
              inputMode="decimal"
              min={ASSISTED_CONTACT_COST_MIN}
              max={ASSISTED_CONTACT_COST_MAX}
              step={ASSISTED_CONTACT_COST_STEP}
              value={assistedContactCost}
              onChange={(event) => commitCost(Number(event.target.value))}
              className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary/60"
            />
          </div>
        </div>
        <input
          type="range"
          min={ASSISTED_CONTACT_COST_MIN}
          max={ASSISTED_CONTACT_COST_MAX}
          step={ASSISTED_CONTACT_COST_STEP}
          value={assistedContactCost}
          onChange={(event) => commitCost(Number(event.target.value))}
          aria-label="Assisted-contact cost slider"
          style={{ accentColor: 'var(--primary)' }}
          className="w-full cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[10px] font-mono text-foreground/40">
          <span>${ASSISTED_CONTACT_COST_MIN}</span>
          <span>{costLabel(assistedContactCost)} / assisted contact</span>
          <span>${ASSISTED_CONTACT_COST_MAX}</span>
        </div>
      </div>

      <div className={sourceWindow ? 'mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4' : 'mt-5 grid gap-4 md:grid-cols-3'}>
        <ProjectionMetric
          label={sourceWindow ? 'Uploaded window' : 'Uploaded batch'}
          value={usd(batchCost)}
          sub={windowLabel ?? `${count(repeatTicketCount)} repeat tickets`}
        />
        {normalizedWindow !== null && (
          <ProjectionMetric
            label="30-day pace"
            value={usd(normalizedWindow.dailyCost * 30)}
            sub={`normalized from ${count(normalizedWindow.days)} source days`}
          />
        )}
        <ProjectionMetric
          label="12-month run-rate"
          value={usd(annualRunRate)}
          sub={normalizedWindow === null ? 'if this batch is monthly pace' : 'same measured daily pace'}
          highlight
        />
        <ProjectionMetric
          label="3-year run-rate"
          value={usd(threeYearRunRate)}
          sub="same pace, no reduction"
        />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={onUnlock}
          disabled={unlockDisabled}
          aria-busy={unlockBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white transition-all shadow-sm hover:bg-primary-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {unlockLabel}
          {!unlockBusy && !unlockDisabled && <ArrowRight className="h-4 w-4" />}
        </button>
        <span className="inline-flex items-center gap-2 text-xs text-foreground/50 sm:max-w-xs">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          Stripe checkout unlocks the full Backlog Report after payment confirmation.
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/45">
        {sourceWindow
          ? 'Estimate only. These run-rate rows normalize from the verified source window ATLAS returned; they are not savings guarantees.'
          : 'Estimate only. This sizes the repeat work visible in your uploaded data; it is not a savings guarantee and should be adjusted to your actual reporting window.'}
      </p>
    </section>
  );
}

function teaserAnswerLabel(answer: DeflectionSnapshotFullAnswer) {
  if (answer.rank === 1) {
    return 'Sample answer for your #1 most-asked question';
  }
  return `Sample answer for ranked question #${answer.rank}`;
}

function TeaserAnswer({ answer }: { answer: DeflectionSnapshotFullAnswer }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-primary/30 bg-surface shadow-[var(--primary-glow)]">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-foreground/[0.02] px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Draft ready for review
          </span>
        </div>
        <div className="text-[10px] font-mono text-foreground/45">
          Rank #{answer.rank} - {answer.source_count} source tickets
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
          {teaserAnswerLabel(answer)}
        </div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {answer.question}
        </h2>
        <div className="mt-4 p-4 rounded-xl border border-border/60 bg-background/50 text-base leading-relaxed text-foreground/80">
          {answer.answer}
        </div>
        {answer.steps.length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-foreground/50 mb-3">Resolution Steps:</h4>
            <ol className="space-y-3">
              {answer.steps.map((step, index) => (
                <li key={`${answer.rank}-${index}`} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-foreground/72">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 text-xs text-foreground/50">
          <span>
            This live draft was verified from your team&apos;s past resolved replies.
          </span>
          <span className="flex items-center gap-1 font-medium text-primary">
            <Lock className="h-3 w-3" /> Source tickets included in full report
          </span>
        </div>
      </div>
    </article>
  );
}

function TeaserPreviewCard({ preview }: { preview: DeflectionSnapshotAnswerPreview }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
        <span>Draft #{preview.rank}</span>
        <span>{preview.source_count} sources</span>
      </div>
      <h3 className="text-sm font-semibold leading-snug text-foreground">{preview.question}</h3>
      <div className="mt-4 space-y-2 blur-[2px]" aria-hidden="true">
        <div className="h-2.5 w-full rounded-full bg-foreground/14" />
        <div className="h-2.5 w-5/6 rounded-full bg-foreground/12" />
        <div className="h-2.5 w-2/3 rounded-full bg-foreground/10" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/55">
        <Lock className="h-3.5 w-3.5 text-foreground/40" />
        <span>
          {preview.step_count} drafted steps withheld in the full report
        </span>
      </div>
    </article>
  );
}

// Free-state results page. Renders ONLY the DeflectionSnapshot (summary + top
// questions + bounded teaser). Evidence/source IDs/Markdown and non-teaser
// answer bodies are never present in this payload — the full report is unlocked
// server-side by ATLAS after payment (gated slice).
export function DeflectionResultsPage({
  snapshot,
  requestId,
  companyName,
  checkoutStatus,
}: {
  snapshot: DeflectionSnapshot;
  requestId: string;
  companyName?: string;
  checkoutStatus?: 'success' | 'cancel';
}) {
  const { summary, top_questions, locked_questions, teaser } = snapshot;
  const [assistedContactCost, setAssistedContactCost] = useState(
    DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  );
  const maxTicketCount = top_questions.reduce((m, q) => Math.max(m, q.ticket_count), 0) || 1;
  const firstLockedRank = top_questions.length + 1;
  const lastLockedRank = locked_questions.at(-1)?.rank ?? summary.generated;
  const hasMoreQuestions = locked_questions.length > 0 || summary.generated > top_questions.length;
  const fullTeaser = teaser.full_answer;
  const teaserPreviews = teaser.previews;
  const sourceWindow =
    summary.source_date_start && summary.source_date_end && summary.source_window_days
      ? {
          source_date_start: summary.source_date_start,
          source_date_end: summary.source_date_end,
          source_window_days: summary.source_window_days,
        }
      : undefined;
  const remainingDraftCount = Math.max(
    summary.drafted_answer_count - (fullTeaser ? 1 : 0),
    0,
  );

  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(checkoutStatus === 'success');
  const [finalizingTimedOut, setFinalizingTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlockLabel = finalizing
    ? 'Finalizing report...'
    : finalizingTimedOut
      ? 'Payment received'
      : loading
        ? 'Starting checkout...'
        : `Unlock the full report - ${FULL_REPORT_PRICE_LABEL}`;
  const unlockDisabled = loading || finalizing || finalizingTimedOut;

  useEffect(() => {
    if (checkoutStatus !== 'success') return undefined;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function poll(attempt: number) {
      try {
        const res = await fetch(
          `/api/deflection-report-status?requestId=${encodeURIComponent(requestId)}`,
          { cache: 'no-store' },
        );
        const data = (await res.json()) as { status?: string };
        if (!cancelled && res.ok && data.status === 'unlocked') {
          window.location.replace(window.location.pathname);
          return;
        }
      } catch {
        // Keep polling inside the bounded success-return window.
      }

      if (cancelled) return;
      if (attempt >= FINALIZING_ATTEMPTS) {
        setFinalizing(false);
        setFinalizingTimedOut(true);
        setError('Payment received. Your report is finalizing. Refresh in a moment.');
        return;
      }
      timeout = setTimeout(() => void poll(attempt + 1), FINALIZING_INTERVAL_MS);
    }

    timeout = setTimeout(() => void poll(1), 500);
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [checkoutStatus, requestId]);

  // Ask our server to create a Stripe Checkout Session, then hand the browser to
  // Stripe's hosted page. ATLAS flips the paid flag from the webhook; on return
  // the results page re-probes GET /artifact and renders the full report once
  // unlocked. `alreadyPaid` means the webhook already landed — just reload.
  async function handleUnlock() {
    setLoading(true);
    setError(null);
    const attemptId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const res = await fetch('/api/deflection-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, attemptId }),
      });
      const data = (await res.json()) as {
        url?: string;
        alreadyPaid?: boolean;
        error?: string;
      };
      if (data.alreadyPaid) {
        window.location.reload();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? 'Could not start checkout. Please try again.');
      setLoading(false);
    } catch (err) {
      console.error(
        'deflection checkout failed',
        err instanceof Error ? err.message : err,
      );
      setError('Could not start checkout. Please try again.');
      setLoading(false);
    }
  }

  const totalQuestions = summary.drafted_answer_count + summary.no_proven_answer_count || 1;
  const draftedPercent = Math.round((summary.drafted_answer_count / totalQuestions) * 100);
  const unprovenPercent = 100 - draftedPercent;
  const annualSupportTaxEstimate =
    summary.repeat_ticket_count > 0
      ? sourceWindow
        ? (summary.repeat_ticket_count * assistedContactCost * 365) / sourceWindow.source_window_days
        : summary.repeat_ticket_count * assistedContactCost * 12
      : null;

  return (
    <main className="min-h-screen pt-16 pb-20 px-6 relative z-10">
      <div className="max-w-3xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
          <span>YOUR DEFLECTION SNAPSHOT{companyName ? ` · ${companyName}` : ''}</span>
        </div>

        {/* ── Hook ───────────────────────────────────────────────── */}
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
          We found{' '}
          <span className="text-primary">{summary.generated}</span> repeat
          questions hiding in your queue.
        </h1>
        <p className="text-lg text-foreground/65 leading-relaxed mb-6">
          <strong className="text-foreground">{summary.drafted_answer_count}</strong>{' '}
          of them already have a publishable answer drafted from your own team&apos;s
          resolved replies, nothing invented.{' '}
          <strong className="text-foreground">{summary.no_proven_answer_count}</strong>{' '}
          have no proven answer yet (the questions you have never cracked).
        </p>

        {/* Summary widget */}
        <div className="mb-10 rounded-2xl border border-border bg-surface p-5 shadow-[0_4px_20px_rgba(23,35,31,0.02)]">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs font-mono uppercase tracking-wider text-foreground/50">
            <span>Snapshot Composition</span>
            <span>{summary.generated} Total Recurring Questions</span>
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-border">
            {summary.drafted_answer_count > 0 && (
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                style={{ width: `${draftedPercent}%` }}
                title={`${summary.drafted_answer_count} questions with drafted answers`}
              >
                {draftedPercent > 10 && (
                  <span className="hidden sm:inline">{draftedPercent}% Drafted</span>
                )}
              </div>
            )}
            {summary.no_proven_answer_count > 0 && (
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                style={{ width: `${unprovenPercent}%` }}
                title={`${summary.no_proven_answer_count} unresolved questions`}
              >
                {unprovenPercent > 10 && (
                  <span className="hidden sm:inline">{unprovenPercent}% Unresolved</span>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-foreground/70">
                <strong className="text-foreground">{summary.drafted_answer_count}</strong>{' '}
                drafted and ready to review
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-foreground/70">
                <strong className="text-foreground">{summary.no_proven_answer_count}</strong>{' '}
                no proven answer yet
              </span>
            </div>
          </div>
        </div>

        {summary.repeat_ticket_count > 0 && (
          <SupportTaxProjection
            repeatTicketCount={summary.repeat_ticket_count}
            assistedContactCost={assistedContactCost}
            sourceWindow={sourceWindow}
            onAssistedContactCostChange={setAssistedContactCost}
            onUnlock={() => void handleUnlock()}
            unlockLabel={unlockLabel}
            unlockDisabled={unlockDisabled}
            unlockBusy={loading || finalizing}
          />
        )}

        <section className="mb-10" aria-labelledby="ranked-question-heading">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            <Search className="h-3.5 w-3.5" />
            <span>Help-desk SEO targeting list</span>
          </div>
          <h2 id="ranked-question-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Your top {top_questions.length} repeat questions, with help-desk target phrases.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">
            These visible rows are the ranking and the SEO targeting list:
            each card includes the exact phrase customers used in your tickets,
            so your team can write help-center titles and search wording around
            real demand. ATLAS does not claim keyword volume, search rank, or
            traffic.
          </p>
          <ol className="mt-5 space-y-3">
            {top_questions.map((q) => (
              <li
                key={q.rank}
                className="glass flex items-start gap-4 rounded-xl border border-border/80 p-4 shadow-[0_4px_20px_rgba(23,35,31,0.01)] transition-all duration-300 hover:border-primary/30"
              >
                <span className="font-mono text-sm text-primary font-bold mt-0.5 w-6 shrink-0 text-center">
                  #{q.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground font-semibold leading-snug">{q.question}</p>
                  <p className="text-xs text-foreground/50 mt-1">
                    target phrase from your tickets: &ldquo;{q.customer_wording}&rdquo;
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/50">
                    Hit your queue <strong className="text-foreground/70">{count(q.ticket_count)}</strong>{' '}
                    times in this upload, possibly costing{' '}
                    <strong className="text-foreground/70">
                      {usd(q.ticket_count * assistedContactCost)}
                    </strong>{' '}
                    at {costLabel(assistedContactCost)} per assisted contact.
                  </p>
                </div>
                <div className="flex h-full shrink-0 flex-col items-end justify-center text-right">
                  <span className="rounded bg-foreground/5 px-2 py-0.5 font-mono text-xs font-bold text-foreground/80">
                    {count(q.ticket_count)}x
                  </span>
                  <div className="mt-2 h-1.5 w-24 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
                      style={{ width: `${Math.round((q.ticket_count / maxTicketCount) * 100)}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {locked_questions.length > 0 && (
          <section className="mb-10" aria-labelledby="locked-question-heading">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
              <Lock className="h-3.5 w-3.5" />
              <span id="locked-question-heading">Locked recurring questions</span>
            </div>
            <div className="relative">
              <ol className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface p-3 pr-2
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-thumb]:bg-border/60
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {locked_questions.map((q) => (
                  <li
                    key={q.rank}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5 transition-colors hover:bg-background/60"
                  >
                    <span className="w-10 shrink-0 font-mono text-xs text-foreground/45 text-center">
                      #{q.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/60">
                        <Lock className="h-3.5 w-3.5 text-foreground/30" />
                        <span>Question text withheld</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-foreground/45">
                        <strong className="text-foreground/60">{count(q.ticket_count)}</strong>{' '}
                        repeat tickets -{' '}
                        <strong className="text-foreground/60">
                          {usd(q.ticket_count * assistedContactCost)}
                        </strong>{' '}
                        estimated cost
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none rounded-b-xl border-b border-border/10" />
            </div>
          </section>
        )}

        {fullTeaser && (
          <section className="mb-10" aria-labelledby="teaser-answer-heading">
            <p
              id="teaser-answer-heading"
              className="text-[10px] font-mono uppercase tracking-widest text-primary/80 mb-4"
            >
              One drafted answer you can inspect before paying
            </p>
            <TeaserAnswer answer={fullTeaser} />
            {teaserPreviews.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {teaserPreviews.map((preview) => (
                  <TeaserPreviewCard key={preview.rank} preview={preview} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Locked: the rest + the drafts ──────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-6 mb-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 mb-4">
            <Lock className="h-3.5 w-3.5" />
            In your full report
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-foreground/70">
            {hasMoreQuestions && (
              <li className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
                <span>
                  <strong className="text-foreground">
                    #{firstLockedRank}–#{lastLockedRank}
                  </strong>
                  {' '}complete ranked backlog, locked question text plus the
                  rest of your recurring questions, ordered by support volume.
                </span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                <strong className="text-foreground">
                  Complete customer-phrase list
                </strong>{' '}
                for help-center headings, internal-search synonyms, and FAQ wording.
                No bought keyword data, volume, rank, or traffic claims.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                <strong className="text-foreground">
                  {fullTeaser
                    ? `${remainingDraftCount} more drafted answers`
                    : `${summary.drafted_answer_count} drafted answers`}
                </strong>{' '}
                {fullTeaser
                  ? 'like the sample above'
                  : "built from your team's resolved tickets"}{' '}
                - ready for review and publishing.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                <strong className="text-foreground">
                  {summary.no_proven_answer_count} no-proven-answer questions
                </strong>{' '}
                separated from the drafts, so your team knows exactly what to
                resolve next before writing public guidance.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                Source ticket IDs and evidence behind every finding, so reviewers
                can trace each answer before it reaches the help center.
              </span>
            </li>
          </ul>
        </div>

        {/* ── Primary offer ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 shadow-[var(--primary-glow)] mb-8">
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                Unlock your full Backlog Report
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-foreground/65">
                It&apos;s already computed. The drafts behind this snapshot exist right now.
                Unlock the complete analysis to start deflecting repetitive customer tickets.
              </p>
              <ul className="space-y-2 text-xs text-foreground/75">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Complete ranked backlog</strong> of all {summary.generated} repeat questions.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>{summary.drafted_answer_count} drafted answers</strong> ready for review.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Customer-language phrase map</strong> for help-center titles and search wording.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Traceable ticket IDs</strong> and resolution evidence.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-center border-t border-primary/20 pt-6 md:col-span-2 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              {annualSupportTaxEstimate !== null && (
                <div className="mb-5 rounded-xl border border-primary/25 bg-background/50 p-5 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/45">
                    This backlog at current pace
                  </div>
                  <div className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                    {usd(annualSupportTaxEstimate)}
                    <span className="ml-1 text-base font-semibold text-foreground/45">/ year</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-foreground/55">
                    Estimated annual run-rate at {costLabel(assistedContactCost)} per assisted
                    contact. The one-time report price below is fixed; this estimate is not a
                    savings guarantee.
                  </p>
                </div>
              )}
              <div className="text-center mb-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/40">One-time report price</div>
                <div className="text-4xl font-extrabold text-foreground mt-1">
                  {FULL_REPORT_PRICE_LABEL}
                </div>
                <div className="text-xs text-foreground/50 mt-1">No monthly subscription. Yours to keep.</div>
              </div>

              <button
                type="button"
                onClick={handleUnlock}
                disabled={unlockDisabled}
                aria-busy={loading || finalizing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {unlockLabel}
                {!loading && !finalizing && !finalizingTimedOut && <ArrowRight className="h-4 w-4" />}
              </button>

              {error && (
                <p role="alert" className="text-sm text-red-500 mt-3 text-center">
                  {error}
                </p>
              )}
              {finalizingTimedOut && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 w-full inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/75 hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Refresh to check status
                </button>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-border/60 pt-4 text-[10px] text-foreground/45">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-primary/65" />
                  Secure Stripe checkout
                </span>
                <span className="h-1 w-1 rounded-full bg-foreground/25" aria-hidden="true" />
                <span>Payment-confirmed unlock</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Trust strip ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-5 mb-12">
          <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/70">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Every answer is your own team&apos;s proven resolution, verbatim from the
              ticket that solved it. Nothing invented.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              100% deterministic. No AI ever wrote these.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Your CSV is deleted after 30 days.
            </li>
          </ul>
        </div>

        {/* ── Secondary (soft) ───────────────────────────────────── */}
        <div className="text-center">
          <p className="text-sm text-foreground/55 leading-relaxed">
            After the backlog: keep it from coming back. We push your approved FAQs straight
            into your help desk as macros, for{' '}
            <strong className="text-foreground/75">$500/mo</strong>.
          </p>
        </div>
      </div>
    </main>
  );
}
