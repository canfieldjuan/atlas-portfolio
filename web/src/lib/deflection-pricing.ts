import * as pricingCatalog from './deflection-pricing-catalog';

export const DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD = 13.5;
export const DEFLECTION_SELF_SERVICE_BENCHMARK_USD = 1.84;
export const DEFLECTION_ASSISTED_CONTACT_DELTA_USD =
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD - DEFLECTION_SELF_SERVICE_BENCHMARK_USD;
export const DEFLECTION_DEFAULT_PRICE_VARIANT_ID =
  pricingCatalog.DEFLECTION_DEFAULT_PRICE_VARIANT_ID as 'standard';
export const DEFLECTION_PARTNER_PRICE_VARIANT_ID =
  pricingCatalog.DEFLECTION_PARTNER_PRICE_VARIANT_ID as 'partner';

export type DeflectionPriceVariantId =
  | typeof DEFLECTION_DEFAULT_PRICE_VARIANT_ID
  | typeof DEFLECTION_PARTNER_PRICE_VARIANT_ID;

export type DeflectionPriceVariant = {
  id: DeflectionPriceVariantId;
  metadataValue: string;
  title: string;
  stripeProductName: string;
  stripePriceIdEnvKey: string;
  legacyStripePriceIdEnvKey?: string;
  amountUsd: number;
  amountCents: number;
  priceLabel: string;
};

const wholeUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const benchmarkUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDeflectionWholeUsd(value: number) {
  return wholeUsdFormatter.format(value);
}

export function formatDeflectionBenchmarkUsd(value: number) {
  return benchmarkUsdFormatter.format(value);
}

export const DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL =
  formatDeflectionBenchmarkUsd(DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD);
export const DEFLECTION_SELF_SERVICE_BENCHMARK_LABEL =
  formatDeflectionBenchmarkUsd(DEFLECTION_SELF_SERVICE_BENCHMARK_USD);
export const DEFLECTION_ASSISTED_CONTACT_DELTA_LABEL =
  formatDeflectionBenchmarkUsd(DEFLECTION_ASSISTED_CONTACT_DELTA_USD);

const DEFLECTION_PUBLIC_PRICE_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS:
    process.env.NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS,
  NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS:
    process.env.NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS,
};

export const DEFLECTION_PRICE_VARIANTS =
  pricingCatalog.buildDeflectionPriceVariants(
    DEFLECTION_PUBLIC_PRICE_ENV,
  ) as readonly DeflectionPriceVariant[];

export const DEFLECTION_DEFAULT_PRICE_VARIANT = DEFLECTION_PRICE_VARIANTS[0];
export const DEFLECTION_PARTNER_PRICE_VARIANT = DEFLECTION_PRICE_VARIANTS[1];
export const DEFLECTION_FULL_REPORT_PRICE_USD =
  DEFLECTION_DEFAULT_PRICE_VARIANT.amountUsd;
export const DEFLECTION_FULL_REPORT_PRICE_CENTS =
  DEFLECTION_DEFAULT_PRICE_VARIANT.amountCents;

export function resolveDeflectionPriceVariant(value: unknown): DeflectionPriceVariant | null {
  if (value === undefined || value === null) return DEFLECTION_DEFAULT_PRICE_VARIANT;
  if (typeof value !== 'string') return null;
  const id = value.trim();
  if (!id) return null;
  return DEFLECTION_PRICE_VARIANTS.find((variant) => variant.id === id) ?? null;
}

export const DEFLECTION_FULL_REPORT_PRICE_LABEL =
  DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel;
export const DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL = `Free snapshot · ${DEFLECTION_FULL_REPORT_PRICE_LABEL} full report`;
