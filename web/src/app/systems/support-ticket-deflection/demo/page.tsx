import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DeflectionDemo } from '@/components/deflection-demo/DeflectionDemo';

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
            Type a question your customers keep asking. You&apos;ll see the jargon-y article most
            help centers return today, beside the actionable, customer-language answer the Support
            Ticket Deflection Report would have your team publish — the gap that turns a repeat
            question into a repeat ticket.
          </p>
        </div>

        <DeflectionDemo />
      </div>
    </main>
  );
}
