import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react';
import Link from 'next/link';

export function DeflectionResultsUnavailablePage() {
  return (
    <main className="min-h-screen pt-16 pb-20 px-6 relative z-10">
      <div className="max-w-xl mx-auto">
        <div className="rounded-xl border border-border bg-surface p-8 md:p-10">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            SNAPSHOT TEMPORARILY UNAVAILABLE
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
            We couldn&apos;t load your snapshot right now.
          </h1>
          <p className="text-foreground/65 leading-relaxed mb-6">
            Your upload may still be processing, or the report service may be
            temporarily unavailable. Try again in a moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="?retry=1"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-black hover:bg-primary/90 transition-colors"
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </Link>
            <Link
              href="/systems/support-ticket-deflection"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Support Ticket Deflection
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
