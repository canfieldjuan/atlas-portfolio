import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { DeflectionDemo } from '@/components/deflection-demo/DeflectionDemo';
import { HowItWorks } from '@/components/deflection-demo/HowItWorks';

export default function SupportTicketDeflectionDemoPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/systems/support-ticket-deflection"
          className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Support Ticket Deflection
        </Link>

        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <span>SUPPORT TICKET DEFLECTION · INTERACTIVE DEMO</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            If customers keep asking it, the answer isn&apos;t where they&apos;re looking.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Type a question your customers keep asking. You&apos;ll see the report finding your
            team would review beside the drafted FAQ fields it returns: how often it&apos;s asked,
            the wording gap, the source evidence, and the answer draft.
          </p>
          <p className="mt-4 text-xs text-foreground/45 leading-relaxed">
            The demand numbers are real, ticket and source counts from a labeled-synthetic B2B-SaaS
            sample. The card is shaped like the product report item: customer terms, documentation
            terms, evidence, and draft FAQ fields your team reviews before publishing.
          </p>
        </div>

        <DeflectionDemo />

        <div className="mt-16 space-y-16">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="max-w-2xl">
              <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-primary/80">
                Calculator
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Want to size the repeat-ticket cost?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                Use the full calculator when you need the budget case. This demo stays focused on
                the report fields your team would review.
              </p>
              <Link
                href="/systems/support-ticket-deflection/calculator"
                className="group mt-5 inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary/45 hover:text-primary"
              >
                Open the full calculator
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <HowItWorks />

          {/* Bottom CTA (kept), hoisted here so how-it-works reads before it. */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center shadow-[var(--primary-glow)]">
            <FileText className="w-7 h-7 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              See this run on your own tickets
            </h2>
            <p className="text-sm text-foreground/60 mb-6 max-w-xl mx-auto leading-relaxed">
              Upload a CSV of your last 3 months of closed tickets. We send back a free Deflection
              Snapshot: your top repeat questions, the wording customers use, and the paid report
              fields waiting behind the unlock.
            </p>
            <Link
              href="/systems/support-ticket-deflection/intake"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Upload your CSV, get a free Snapshot
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
