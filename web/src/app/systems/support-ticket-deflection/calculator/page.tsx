import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SupportTaxCalculator } from '@/components/deflection-demo/SupportTaxCalculator';

export default function SupportTicketDeflectionCalculatorPage() {
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
            <span>SUPPORT TICKET DEFLECTION · CALCULATOR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            What are repeat tickets costing you?
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Two numbers you already know — your monthly ticket volume and your cost per ticket —
            turn into the annual cost of the repeat Tier-1 questions a self-service layer could
            deflect. Adjust the repeat-rate assumption to your own reality.
          </p>
        </div>

        <SupportTaxCalculator />
      </div>
    </main>
  );
}
