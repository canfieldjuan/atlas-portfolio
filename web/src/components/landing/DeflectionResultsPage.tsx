'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { DeflectionSnapshot } from '@/lib/deflection-snapshot';
import {
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  type DeflectionPriceVariant,
} from '@/lib/deflection-pricing';
import {
  trackFaqReportResultsViewed,
  trackFaqReportUnlockClicked,
  type FaqReportResultsAnalyticsContext,
} from '@/lib/analytics';
import {
  DeflectionBlindSpotRows,
  DeflectionLockedQuestionRows,
  DeflectionTopQuestionRows,
} from './DeflectionSnapshotRows';
import {
  DeflectionTeaserAnswer,
  DeflectionTeaserPreviewCard,
} from './DeflectionSnapshotTeaser';
import { DeflectionSupportTaxProjection } from './DeflectionSupportTaxProjection';

const FINALIZING_ATTEMPTS = 10;
const FINALIZING_INTERVAL_MS = 1500;

function usd(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function costLabel(value: number) {
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
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
  priceVariant = DEFLECTION_DEFAULT_PRICE_VARIANT,
  analyticsContext,
}: {
  snapshot: DeflectionSnapshot;
  requestId: string;
  companyName?: string;
  checkoutStatus?: 'success' | 'cancel';
  priceVariant?: DeflectionPriceVariant;
  analyticsContext?: FaqReportResultsAnalyticsContext;
}) {
  const { summary, top_questions, locked_questions, teaser, top_blind_spots = [] } = snapshot;
  const fullReportPriceLabel = priceVariant.priceLabel;
  const [assistedContactCost, setAssistedContactCost] = useState(
    DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  );
  const lockedRanks = locked_questions.map((question) => question.rank);
  const firstLockedRank =
    lockedRanks.length > 0
      ? Math.min(...lockedRanks)
      : Math.max(0, ...top_questions.map((question) => question.rank)) + 1;
  const lastLockedRank =
    lockedRanks.length > 0 ? Math.max(...lockedRanks) : summary.generated;
  // Guard the sparse fallback: with no locked rows and non-contiguous visible
  // ranks, firstLockedRank (max visible rank + 1) can exceed lastLockedRank
  // (summary.generated), which would otherwise render a backwards range.
  const showLockedRankRange = firstLockedRank <= lastLockedRank;
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
  const resultsViewTracked = useRef(false);
  const unlockLabel = finalizing
    ? 'Finalizing report...'
    : finalizingTimedOut
      ? 'Payment received'
      : loading
        ? 'Starting checkout...'
        : `Unlock the full report - ${fullReportPriceLabel}`;
  const unlockDisabled = loading || finalizing || finalizingTimedOut;

  const trackedResultsContext = useMemo(
    () =>
      ({
        submissionAgeBucket: analyticsContext?.submissionAgeBucket,
        priceVariant: priceVariant.id,
        checkoutStatus: checkoutStatus ?? 'none',
        generatedQuestionCount: summary.generated,
        draftedAnswerCount: summary.drafted_answer_count,
        lockedQuestionCount: locked_questions.length,
      }) satisfies FaqReportResultsAnalyticsContext,
    [
      analyticsContext?.submissionAgeBucket,
      checkoutStatus,
      locked_questions.length,
      priceVariant.id,
      summary.drafted_answer_count,
      summary.generated,
    ],
  );

  useEffect(() => {
    if (resultsViewTracked.current) return;
    resultsViewTracked.current = true;
    trackFaqReportResultsViewed(trackedResultsContext);
  }, [trackedResultsContext]);

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
    trackFaqReportUnlockClicked(trackedResultsContext);
    const attemptId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const res = await fetch('/api/deflection-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, attemptId, priceVariant: priceVariant.id }),
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
          <DeflectionSupportTaxProjection
            repeatTicketCount={summary.repeat_ticket_count}
            assistedContactCost={assistedContactCost}
            sourceWindow={sourceWindow}
            onAssistedContactCostChange={setAssistedContactCost}
            className="mb-10"
            action={{
              kind: 'button',
              label: unlockLabel,
              onClick: () => void handleUnlock(),
              disabled: unlockDisabled,
              busy: loading || finalizing,
              helper:
                'Stripe checkout unlocks the full Backlog Report after payment confirmation.',
            }}
          />
        )}

        <section className="mb-10" aria-labelledby="ranked-question-heading">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            <Search className="h-3.5 w-3.5" />
            <span>Help-desk SEO targeting list</span>
          </div>
          <h2 id="ranked-question-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Your top {top_questions.length} repeat questions from the uploaded queue.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">
            These visible rows are the ranking list. When the upload includes
            a separate customer phrase, the row shows that wording so your team
            can shape help-center titles and search language around real demand.
            We make no claims about keyword volume, search rank, or traffic.
          </p>
          <DeflectionTopQuestionRows
            questions={top_questions}
            assistedContactCost={assistedContactCost}
          />
        </section>

        {locked_questions.length > 0 && (
          <section className="mb-10" aria-labelledby="locked-question-heading">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
              <Lock className="h-3.5 w-3.5" />
              <span id="locked-question-heading">Locked recurring questions</span>
            </div>
            <DeflectionLockedQuestionRows
              questions={locked_questions}
              assistedContactCost={assistedContactCost}
              showFade
            />
          </section>
        )}

        {top_blind_spots.length > 0 && (
          <section className="mb-10" aria-labelledby="blind-spot-heading">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-700/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>No-proven-answer gaps</span>
            </div>
            <h2 id="blind-spot-heading" className="text-2xl font-semibold tracking-tight text-foreground">
              Top blind spots your team still has to resolve.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">
              These rows appear only when ATLAS can identify repeated questions
              with no proven resolved-answer evidence. They are not drafted
              recommendations; they are the support gaps to close next.
            </p>
            <DeflectionBlindSpotRows
              blindSpots={top_blind_spots}
              assistedContactCost={assistedContactCost}
            />
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
            <DeflectionTeaserAnswer answer={fullTeaser} />
            {teaserPreviews.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {teaserPreviews.map((preview) => (
                  <DeflectionTeaserPreviewCard key={preview.rank} preview={preview} />
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
                  {showLockedRankRange && (
                    <strong className="text-foreground">
                      #{firstLockedRank}–#{lastLockedRank}{' '}
                    </strong>
                  )}
                  {showLockedRankRange ? 'complete' : 'Complete'} ranked backlog,
                  locked question text plus the rest of your recurring questions,
                  ordered by support volume.
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
                  {fullReportPriceLabel}
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
