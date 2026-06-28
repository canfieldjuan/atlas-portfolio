'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { structuredRuntimeError } from '@/lib/structured-runtime-log';

// Error boundary for the results route — renders the thrown "could not load
// your snapshot" path inside the brand chrome instead of Next's default error UI.
// The thrown message is already generic (no upstream host/token details).
export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    structuredRuntimeError('deflection.results_page_error_boundary', {
      error,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen pt-16 pb-20 px-6 relative z-10">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border border-border bg-surface p-8 md:p-10">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
            We couldn&apos;t load your snapshot right now.
          </h1>
          <p className="text-foreground/65 leading-relaxed mb-6">
            This is usually temporary. Give it another try — if it keeps happening,
            your snapshot may still be processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <RotateCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/systems/support-ticket-deflection"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Back to Support Ticket Deflection
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
