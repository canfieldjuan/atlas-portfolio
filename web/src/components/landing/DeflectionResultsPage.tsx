'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Lock, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import type {
  DeflectionSnapshot,
  DeflectionSnapshotAnswerPreview,
  DeflectionSnapshotFullAnswer,
} from '@/lib/deflection-snapshot';
import {
  buildDeflectionCheckoutDiagnostic,
  recordDeflectionCheckoutDiagnostic,
} from '@/lib/deflection-checkout-diagnostics';

const FINALIZING_ATTEMPTS = 10;
const FINALIZING_INTERVAL_MS = 1500;

function TeaserAnswer({ answer }: { answer: DeflectionSnapshotFullAnswer }) {
  return (
    <article className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 shadow-[var(--primary-glow)]">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
        <span>Sample drafted answer</span>
        <span className="rounded-full border border-primary/25 px-2 py-0.5">
          #{answer.rank}
        </span>
        <span className="rounded-full border border-primary/25 px-2 py-0.5">
          {answer.source_count} source tickets
        </span>
      </div>
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
        {answer.question}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-foreground/76">{answer.answer}</p>
      {answer.steps.length > 0 && (
        <ol className="mt-5 space-y-3">
          {answer.steps.map((step, index) => (
            <li key={`${answer.rank}-${index}`} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 text-xs font-mono text-primary">
                {index + 1}
              </span>
              <span className="text-foreground/72">{step}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-5 text-xs leading-relaxed text-foreground/50">
        This is the one free drafted answer ATLAS exposed after verifying scoped
        resolution evidence. The rest stays locked until purchase.
      </p>
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
  const { summary, top_questions, teaser } = snapshot;
  const maxFreq = top_questions.reduce((m, q) => Math.max(m, q.weighted_frequency), 0) || 1;
  const firstLockedRank = top_questions.length + 1;
  const hasMoreQuestions = summary.generated > top_questions.length;
  const fullTeaser = teaser.full_answer;
  const teaserPreviews = teaser.previews;
  const remainingDraftCount = Math.max(
    summary.drafted_answer_count - (fullTeaser ? 1 : 0),
    0,
  );

  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(checkoutStatus === 'success');
  const [finalizingTimedOut, setFinalizingTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const startedAt = Date.now();
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
      recordDeflectionCheckoutDiagnostic(
        buildDeflectionCheckoutDiagnostic({
          phase: 'checkout_response',
          requestId,
          attemptId,
          elapsedMs: Date.now() - startedAt,
          responseOk: res.ok,
          responseStatus: res.status,
          alreadyPaid: data.alreadyPaid,
          error: data.error,
          url: data.url,
        }),
      );
      if (data.alreadyPaid) {
        window.location.reload();
        return;
      }
      if (data.url) {
        recordDeflectionCheckoutDiagnostic(
          buildDeflectionCheckoutDiagnostic({
            phase: 'checkout_redirect',
            requestId,
            attemptId,
            elapsedMs: Date.now() - startedAt,
            responseOk: res.ok,
            responseStatus: res.status,
            url: data.url,
          }),
        );
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? 'Could not start checkout. Please try again.');
      setLoading(false);
    } catch (err) {
      recordDeflectionCheckoutDiagnostic(
        buildDeflectionCheckoutDiagnostic({
          phase: 'checkout_response',
          requestId,
          attemptId,
          elapsedMs: Date.now() - startedAt,
          responseOk: false,
          error: err instanceof Error ? err.message : 'checkout fetch failed',
        }),
      );
      setError('Could not start checkout. Please try again.');
      setLoading(false);
    }
  }

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
        <p className="text-lg text-foreground/65 leading-relaxed mb-3">
          <strong className="text-foreground">{summary.drafted_answer_count}</strong> of
          them already have a publishable answer drafted — from your own team&apos;s
          resolved replies, nothing invented.{' '}
          <strong className="text-foreground">{summary.no_proven_answer_count}</strong> have
          no proven answer yet (the questions you have never cracked).
        </p>

        {/* ── Free: top questions, ranked ────────────────────────── */}
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary/80 mb-4">
          Your top {top_questions.length}, ranked by how often they hit support
        </p>
        <ol className="space-y-3 mb-10">
          {top_questions.map((q) => (
            <li
              key={q.rank}
              className="glass rounded-xl border border-border p-4 flex items-start gap-4"
            >
              <span className="font-mono text-sm text-foreground/45 mt-0.5 w-6 shrink-0">
                #{q.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-medium leading-snug">{q.question}</p>
                <p className="text-sm text-foreground/55 mt-1">
                  in their words: &ldquo;{q.customer_wording}&rdquo;
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono text-sm text-foreground/70">
                  {q.weighted_frequency}×
                </span>
                <div className="mt-1.5 h-1.5 w-24 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.round((q.weighted_frequency / maxFreq) * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>

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
                    #{firstLockedRank}–#{summary.generated}
                  </strong>
                  {' '}ranked the same way — the rest of your recurring question
                  backlog, ordered by support volume.
                </span>
              </li>
            )}
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
                - ready for review.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                <strong className="text-foreground">
                  {summary.no_proven_answer_count} no-proven-answer questions
                </strong>{' '}
                separated from the drafts, so your team knows exactly what still
                needs a real support resolution before publishing.
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
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
            Unlock your full Backlog Report
          </h2>
          <p className="text-foreground/65 leading-relaxed mb-6">
            It&apos;s already computed — the drafts behind this snapshot exist right now.
            Delivered the moment you pay. One-time, yours to keep.
          </p>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={loading || finalizing || finalizingTimedOut}
            aria-busy={loading || finalizing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {finalizing
              ? 'Finalizing report…'
              : finalizingTimedOut
                ? 'Payment received'
              : loading
                ? 'Starting checkout…'
                : 'Unlock the full report — $1,500'}
            {!loading && !finalizing && !finalizingTimedOut && <ArrowRight className="h-4 w-4" />}
          </button>
          {error && (
            <p role="alert" className="text-sm text-red-500 mt-3">
              {error}
            </p>
          )}
          {finalizingTimedOut && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/75 hover:border-primary/50 hover:text-primary transition-colors"
            >
              Refresh to check status
            </button>
          )}
          <p className="text-xs text-foreground/45 mt-3">
            One-time. No subscription. <FileText className="inline h-3 w-3" /> Full report
            delivered instantly.
          </p>
        </div>

        {/* ── Trust strip ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-5 mb-12">
          <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/70">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Every answer is your own team&apos;s proven resolution — verbatim from the
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
