import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SupportTaxCalculator } from '@/components/deflection-demo/SupportTaxCalculator';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const LANDING_HREF = '/systems/support-ticket-deflection';

type PageProps = {
  searchParams?: Promise<{ requestId?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resultsHref(requestId: string | undefined) {
  if (!requestId || !REQUEST_ID_RE.test(requestId)) return null;
  return `/systems/support-ticket-deflection/results/${encodeURIComponent(requestId)}`;
}

export default async function SupportTicketDeflectionCalculatorPage({
  searchParams,
}: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  const reportHref = resultsHref(firstParam(query?.requestId));
  const backHref = reportHref ?? LANDING_HREF;

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {reportHref ? 'Back to your snapshot' : 'Back to Support Ticket Deflection'}
        </Link>

        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <span>SUPPORT TICKET DEFLECTION · CALCULATOR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            Your repeat tickets are a leaky bucket.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Estimate the annual budget leaking through repeated questions, context gathering,
            agent churn, and low self-service resolution. Then use your ticket history to find
            the customer wording and FAQ drafts worth fixing first.
          </p>
        </div>

        <SupportTaxCalculator
          ctaHref={reportHref ?? '/systems/support-ticket-deflection/intake'}
          ctaLabel={reportHref ? 'Return to your snapshot and unlock the report' : undefined}
        />
      </div>
    </main>
  );
}
