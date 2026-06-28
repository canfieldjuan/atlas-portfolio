import { NextResponse } from 'next/server';
import { fetchDeflectionPricingTerms } from '@/lib/atlas-deflection-client';
import { formatDeflectionPriceLabel, resolveDeflectionPriceVariant } from '@/lib/deflection-pricing';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ priceVariant: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { priceVariant: rawPriceVariant } = await context.params;
  const priceVariant = resolveDeflectionPriceVariant(rawPriceVariant);
  if (!priceVariant) {
    return NextResponse.json(
      { ok: false, error: 'Invalid price variant.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const result = await fetchDeflectionPricingTerms(priceVariant.id);
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
