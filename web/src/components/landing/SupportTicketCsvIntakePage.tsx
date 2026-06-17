'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { DeflectionPriceVariantId } from '@/lib/deflection-pricing';
import { SupportTicketCsvIntakeForm } from './SupportTicketCsvIntakeForm';

export type SupportTicketCsvIntakeCopy = {
  backHref: string;
  backLabel: string;
  sourcePage: string;
  sourceOffer: string;
  snapshotName: string;
  submitLabel: string;
  priceVariantId?: DeflectionPriceVariantId;
  partnerAccessToken?: string;
};

export function SupportTicketCsvIntakePage({ copy }: { copy: SupportTicketCsvIntakeCopy }) {
  return (
    <main className="min-h-screen pt-20 pb-20 px-6 relative z-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href={copy.backHref}
          className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          {copy.backLabel}
        </Link>

        <div className="mb-8">
          <SupportTicketCsvIntakeForm copy={copy} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/60" />
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            OPTIONAL ADD-ON
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
            Close the loop: Push answers back to your support tool.
          </h2>
          <p className="text-foreground/70 leading-relaxed mb-4">
            Right now, your pipeline runs one direction: we pull your tickets, cluster them, and generate verified FAQ answers for your public help center.
          </p>
          <p className="text-foreground/70 leading-relaxed mb-8">
            <strong>Macro-writeback closes that loop.</strong> We take each verified question and answer pair that your team approves, and publish it directly back into your support tool. The question becomes the title, and the verified resolution becomes the body, ready for your agents to drop into tickets instantly. Same deterministic process, no auto-send.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-6">
            <div className="flex-1 w-full flex items-baseline gap-2">
              <span className="text-xl font-semibold text-foreground">$499</span>
              <span className="text-sm text-foreground/50">one-time setup</span>
            </div>
            <a
              href={`mailto:juan@juancanfield.com?subject=Macro-Writeback%20Add-on`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Add Macro-Writeback
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
