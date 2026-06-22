import { ArrowLeft, ArrowRight, Check, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { PLAYBOOK_ENTRIES } from '@/lib/deflection-playbook';

export default function SupportTicketDeflectionPlaybookPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/systems/support-ticket-deflection"
          className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Support Ticket Deflection
        </Link>

        {/* Hook, self-contained for a cold visitor who never saw the wedge. */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <span>SUPPORT TICKET DEFLECTION · PLAYBOOK</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            Your users can Google it. So why are they opening a ticket?
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Ten questions every SaaS support team gets, the docs-y article that quietly creates a
            ticket, and the rewrite that deflects it. Google reads what a customer <em>meant</em> and
            hands them the next action; most help centers are organized by your taxonomy, in your
            jargon. The gap between those two is your ticket volume. Here&apos;s where it leaks, and
            the fix for each.
          </p>
        </header>

        <ol className="space-y-10">
          {PLAYBOOK_ENTRIES.map((entry, i) => (
            <li key={entry.question} className="glass rounded-2xl border border-border p-6 sm:p-7">
              <div className="flex items-baseline gap-3 mb-5">
                <span className="font-mono text-sm text-primary/70 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xl font-semibold text-foreground leading-snug">
                  &ldquo;{entry.question}&rdquo;
                </h2>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40 mb-1.5">
                  <X className="w-3 h-3" /> What most help centers serve
                </div>
                <p className="text-sm text-foreground/55 leading-relaxed">
                  <span className="text-foreground/70">{entry.servedToday}</span>, {entry.whyItFails}
                </p>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                  <Check className="w-3 h-3" /> The rewrite that deflects
                </div>
                <h3 className="text-base font-semibold text-foreground mb-3 leading-snug">
                  {entry.rewrite.title}
                </h3>
                <ol className="space-y-1.5">
                  {entry.rewrite.steps.map((step, s) => (
                    <li key={s} className="flex gap-2 text-sm text-foreground/70 leading-relaxed">
                      <span className="font-mono text-xs text-primary/70 mt-0.5">{s + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
                <span className="font-semibold text-foreground">The move:</span> {entry.move}
              </p>
            </li>
          ))}
        </ol>

        {/* Bridge to the live demo (link, not embed). */}
        <div className="mt-12 text-center">
          <Link
            href="/systems/support-ticket-deflection/demo"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See it on a real question, try the live demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Snapshot CTA, the money step. */}
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center shadow-[var(--primary-glow)]">
          <FileText className="w-7 h-7 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Run this on your own help center
          </h2>
          <p className="text-sm text-foreground/60 mb-6 max-w-xl mx-auto leading-relaxed">
            Upload a CSV of your last 30 days of closed tickets. We send back a Resolution Audit
            Snapshot: your top repeat questions, the wording customers use, and one review-ready answer when your tickets contain resolution evidence.
          </p>
          <Link
            href="/systems/support-ticket-deflection/intake"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
          >
            Start Your Forensic Audit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </main>
  );
}
