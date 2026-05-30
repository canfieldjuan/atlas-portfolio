'use client';

import { ArrowRight, Lock, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { DeflectionSnapshot } from '@/lib/deflection-snapshot';

const CALCULATOR_HREF = '/systems/support-ticket-deflection/calculator';

// Free-state results page. Renders ONLY the DeflectionSnapshot (summary + top
// questions). Drafts/evidence/source IDs are never present in this payload —
// the full report is unlocked server-side by ATLAS after payment (gated slice).
export function DeflectionResultsPage({
  snapshot,
  companyName,
}: {
  snapshot: DeflectionSnapshot;
  companyName?: string;
}) {
  const { summary, top_questions } = snapshot;
  const maxFreq = top_questions.reduce((m, q) => Math.max(m, q.weighted_frequency), 0) || 1;

  function handleUnlock() {
    // TODO(gated slice): create a server-side Stripe Checkout Session with
    // metadata { source: 'content_ops_deflection_report', account_id, request_id },
    // mode: 'payment', amount_total >= 150000, currency: 'usd', then redirect.
    // Stripe's checkout.session.completed webhook -> ATLAS flips the paid flag;
    // on return we probe GET /artifact (200 unlock / 403 keep CTA).
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
        <Link
          href={CALCULATOR_HREF}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors mb-12"
        >
          See what this volume is costing you
          <ArrowRight className="h-4 w-4" />
        </Link>

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

        {/* ── Locked: the rest + the drafts ──────────────────────── */}
        <div className="rounded-xl border border-border bg-surface p-6 mb-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/55 mb-4">
            <Lock className="h-3.5 w-3.5" />
            In your full report
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-foreground/70">
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                <strong className="text-foreground">#6–#{summary.generated}</strong>, ranked
                the same way — every recurring question in your tickets.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                A publishable answer is{' '}
                <strong className="text-foreground">already drafted</strong> for every one
                your tickets have solved before —{' '}
                <strong className="text-foreground">{summary.drafted_answer_count} drafts</strong>{' '}
                ready, built from your own resolutions.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>
                The{' '}
                <strong className="text-foreground">
                  &ldquo;no proven answer yet&rdquo;
                </strong>{' '}
                list — the {summary.no_proven_answer_count} frequent questions you have
                never cracked, so you know where to write next.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <span>Source ticket IDs behind every finding.</span>
            </li>
          </ul>
        </div>

        {/* ── Primary offer ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 shadow-[var(--primary-glow)] mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
            Unlock your full Backlog Report
          </h2>
          <p className="text-foreground/65 leading-relaxed mb-6">
            It&apos;s already computed — the drafts above this line exist right now.
            Delivered the moment you pay. One-time, yours to keep.
          </p>
          <button
            type="button"
            onClick={handleUnlock}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Unlock the full report — $1,500
            <ArrowRight className="h-4 w-4" />
          </button>
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
