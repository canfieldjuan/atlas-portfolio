import { describe, expect, it, vi } from 'vitest';
import { runDeflectionStandardPricePreflight } from '../../scripts/smoke-deflection-standard-price-preflight.mjs';

const ALLOWED_AMOUNT_ENV = 'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';

function env(allowedAmounts) {
  return { [ALLOWED_AMOUNT_ENV]: allowedAmounts };
}

function pricingTerms(overrides = {}) {
  return {
    ok: true,
    variant: 'standard',
    status: 'configured',
    amount_cents: 180000,
    currency: 'usd',
    price_label: '$1,800',
    ...overrides,
  };
}

function fetchJson(status, body) {
  return vi.fn(async () =>
    Response.json(body, {
      status,
    }),
  );
}

describe('deflection standard price preflight', () => {
  it('passes when hosted standard terms amount is in the portfolio allowlist', async () => {
    const fetchImpl = fetchJson(200, pricingTerms());

    const result = await runDeflectionStandardPricePreflight({
      baseUrl: 'https://portfolio.example.com',
      env: env('100000,180000'),
      fetchImpl,
    });

    expect(result).toMatchObject({
      ok: true,
      checkedUrl: 'https://portfolio.example.com/api/deflection-pricing/standard',
      variant: 'standard',
      status: 'configured',
      amountCents: 180000,
      currency: 'usd',
      priceLabel: '$1,800',
      allowedAmountsCents: [100000, 180000],
      allowedAmountMatched: true,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://portfolio.example.com/api/deflection-pricing/standard',
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );
  });

  it('fails closed when hosted standard terms are unavailable', async () => {
    const result = await runDeflectionStandardPricePreflight({
      baseUrl: 'https://portfolio.example.com',
      env: env('180000'),
      fetchImpl: fetchJson(503, { ok: false, error: 'Price unavailable.' }),
    });

    expect(result).toMatchObject({
      ok: false,
      checkedUrl: 'https://portfolio.example.com/api/deflection-pricing/standard',
      error: 'Standard pricing terms failed with HTTP 503.',
      httpStatus: 503,
    });
  });

  it('fails before fetch when the portfolio allowlist is missing', async () => {
    const fetchImpl = fetchJson(200, pricingTerms());

    const result = await runDeflectionStandardPricePreflight({
      baseUrl: 'https://portfolio.example.com',
      env: {},
      fetchImpl,
    });

    expect(result).toEqual({
      ok: false,
      error: `${ALLOWED_AMOUNT_ENV} must be set for the standard price preflight.`,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails before fetch when the portfolio allowlist is malformed', async () => {
    const fetchImpl = fetchJson(200, pricingTerms());

    const result = await runDeflectionStandardPricePreflight({
      baseUrl: 'https://portfolio.example.com',
      env: env('180000,bad'),
      fetchImpl,
    });

    expect(result).toEqual({
      ok: false,
      error: `${ALLOWED_AMOUNT_ENV} must contain comma-separated positive integer cents.`,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails when hosted standard amount is absent from the portfolio allowlist', async () => {
    const result = await runDeflectionStandardPricePreflight({
      baseUrl: 'https://portfolio.example.com',
      env: env('150000'),
      fetchImpl: fetchJson(200, pricingTerms()),
    });

    expect(result).toMatchObject({
      ok: false,
      amountCents: 180000,
      allowedAmountsCents: [150000],
      allowedAmountMatched: false,
      error: `Hosted standard amount 180000 is not present in ${ALLOWED_AMOUNT_ENV}.`,
    });
  });

  it('rejects invalid hosted standard terms envelopes', async () => {
    const result = await runDeflectionStandardPricePreflight({
      baseUrl: 'https://portfolio.example.com',
      env: env('180000'),
      fetchImpl: fetchJson(200, pricingTerms({ amount_cents: '180000' })),
    });

    expect(result).toMatchObject({
      ok: false,
      error: 'Standard pricing terms returned an invalid envelope.',
      httpStatus: 200,
    });
  });
});
