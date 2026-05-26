import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { DeflectionDemo } from '@/components/deflection-demo/DeflectionDemo';
import { SupportTaxCalculator } from '@/components/deflection-demo/SupportTaxCalculator';
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
            Type a question your customers keep asking. You&apos;ll see the actionable answer the
            Support Ticket Deflection Report would have your team publish — beside the real demand
            behind it: how often it&apos;s asked, the risk it carries, and what customers actually say.
          </p>
          <p className="mt-4 text-xs text-foreground/45 leading-relaxed">
            Illustrative sample of repeat-question clusters, modeled on public consumer-complaint
            data — the real Report ranks your own ticket export by volume.
          </p>
        </div>

        <DeflectionDemo />

        <div className="mt-16 space-y-16">
          <SupportTaxCalculator />
          <HowItWorks />

          {/* Bottom CTA (kept) — hoisted here so how-it-works reads before it. */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center shadow-[var(--primary-glow)]">
            <FileText className="w-7 h-7 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              See this run on your own tickets
            </h2>
            <p className="text-sm text-foreground/60 mb-6 max-w-xl mx-auto leading-relaxed">
              Upload a CSV of your last 3–6 months of closed tickets. We send back a free Deflection
              Snapshot: your top repeat questions, the wording customers use, and a sample answer.
            </p>
            <Link
              href="/systems/support-ticket-deflection/intake"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Upload your CSV — get a free Snapshot
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
