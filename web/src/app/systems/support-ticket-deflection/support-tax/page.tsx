import { Suspense } from 'react';
import { ThirtySecondCalculator } from '@/components/deflection-demo/ThirtySecondCalculator';

export default function SupportTaxCalculatorPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <span>SUPPORT TICKET DEFLECTION · 30-SECOND CALCULATOR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            What your repeat tickets cost, in 30 seconds.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Two numbers in, the monthly cost and agent hours spent re-answering repeat Tier-1
            questions out. Every assumption is visible and adjustable, and the math travels in
            the URL so you can share your result.
          </p>
        </div>

        <Suspense
          fallback={
            <div
              className="glass min-h-[32rem] rounded-2xl border border-border p-5 sm:p-7"
              aria-hidden
            />
          }
        >
          <ThirtySecondCalculator />
        </Suspense>
      </div>
    </main>
  );
}
