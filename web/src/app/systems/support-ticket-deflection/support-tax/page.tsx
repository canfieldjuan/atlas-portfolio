import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ThirtySecondCalculator } from '@/components/deflection-demo/ThirtySecondCalculator';
import { generatePageMetadata, SITE_URL } from '@/lib/seo';
import { buildSupportTaxShareCardUrl } from '@/lib/support-tax-share-state';

const SUPPORT_TAX_METADATA = {
  title: 'Support Tax Calculator: the cost of repeat support tickets',
  description:
    'A 30-second estimate of the monthly cost and agent hours your team spends re-answering repeat Tier-1 support questions. Every assumption is visible and adjustable, and results are shareable by link.',
  path: '/systems/support-ticket-deflection/support-tax',
  keywords: [
    'support tax calculator',
    'cost of repeat support tickets',
    'support agent time calculator',
    'tier-1 ticket cost',
    'support cost estimate',
  ],
};

// Personalize the OG/Twitter card per shared link: a `?v=&c=&r=&t=` link
// unfurls with the sharer's numbers instead of the default card. searchParams
// is only available on page segments, so this cannot live on the layout.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const key of ['v', 'c', 'r', 't'] as const) {
    const value = resolved[key];
    if (typeof value === 'string') params.set(key, value);
    else if (Array.isArray(value) && typeof value[0] === 'string') params.set(key, value[0]);
  }
  const ogImage = `${SITE_URL}${buildSupportTaxShareCardUrl(params)}`;
  return generatePageMetadata({ ...SUPPORT_TAX_METADATA, ogImage });
}

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
