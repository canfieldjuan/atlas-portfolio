import { NextResponse } from 'next/server';
import { fetchDeflectionStandardPricingTerms } from '@/lib/atlas-deflection-client';
import { formatDeflectionPriceLabel } from '@/lib/deflection-pricing';

export const runtime = 'nodejs';

export async function GET() {
  const result = await fetchDeflectionStandardPricingTerms();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'Price unavailable.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const { terms } = result;
  return NextResponse.json(
    {
      ok: true,
      variant: terms.variant,
      status: terms.status,
      amount_cents: terms.amountCents,
      currency: terms.currency,
      price_label: formatDeflectionPriceLabel(terms.amountCents, terms.currency),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
