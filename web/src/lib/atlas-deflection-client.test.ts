import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authorizeDeflectionCheckout,
  fetchDeflectionPricingTerms,
  fetchDeflectionStandardPricingTerms,
} from '@/lib/atlas-deflection-client';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  DEFLECTION_PARTNER_PRICE_VARIANT,
  DEFLECTION_PRICE_UNAVAILABLE_LABEL,
  withDeflectionPriceDisplayTerms,
  withDeflectionStandardPriceDisplayTerms,
} from '@/lib/deflection-pricing';

const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

type FetchCall = {
  url: string;
  method?: string;
  headers: HeadersInit;
};

let fetchCalls: FetchCall[] = [];
let fetchStatus = 200;
let fetchPayload: unknown = {
  variant: 'standard',
  status: 'configured',
  amount_cents: 180000,
  currency: 'USD',
};

function resetEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function resetFetch(values: { status?: number; payload?: unknown } = {}) {
  fetchCalls = [];
  fetchStatus = values.status ?? 200;
  fetchPayload =
    values.payload ?? {
      variant: 'standard',
      status: 'configured',
      amount_cents: 180000,
      currency: 'USD',
    };
}

function fetchHeader(call: FetchCall, name: string) {
  return (call.headers as Record<string, string>)[name];
}

beforeEach(() => {
  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.test/',
    ATLAS_B2B_SERVICE_TOKEN: 'atlas_unit_token',
  });
  resetFetch();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  globalThis.fetch = vi.fn(async (url, init) => {
    fetchCalls.push({
      url: String(url),
      method: init?.method,
      headers: init?.headers ?? {},
    });
    return Response.json(fetchPayload, { status: fetchStatus });
  });
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  restoreEnv();
});

describe('ATLAS deflection pricing terms and checkout authorization', () => {
  it('fetches standard pricing terms from ATLAS with service auth', async () => {
    await expect(fetchDeflectionStandardPricingTerms()).resolves.toEqual({
      ok: true,
      terms: {
        variant: 'standard',
        status: 'configured',
        amountCents: 180000,
        currency: 'usd',
      },
    });

    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/pricing/standard',
    );
    expect(fetchCalls[0].method).toBe('GET');
    expect(fetchHeader(fetchCalls[0], 'Authorization')).toBe('Bearer atlas_unit_token');
  });

  it('fetches partner pricing terms from the variant endpoint', async () => {
    resetFetch({
      payload: {
        variant: 'partner',
        status: 'configured',
        amount_cents: 120000,
        currency: 'USD',
      },
    });

    await expect(fetchDeflectionPricingTerms('partner')).resolves.toEqual({
      ok: true,
      terms: {
        variant: 'partner',
        status: 'configured',
        amountCents: 120000,
        currency: 'usd',
      },
    });
    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/pricing/partner',
    );
  });

  it('rejects pricing terms when ATLAS returns the wrong variant or bad amounts', async () => {
    resetFetch({
      payload: {
        variant: 'standard',
        status: 'configured',
        amount_cents: 120000,
        currency: 'USD',
      },
    });
    await expect(fetchDeflectionPricingTerms('partner')).resolves.toEqual({
      ok: false,
      reason: 'error',
    });

    resetFetch({
      payload: {
        variant: 'standard',
        status: 'configured',
        amount_cents: 0,
        currency: 'usd',
      },
    });
    await expect(fetchDeflectionStandardPricingTerms()).resolves.toEqual({
      ok: false,
      reason: 'error',
    });
  });

  it('authorizes checkout with default, standard, and partner request URLs', async () => {
    resetFetch({
      payload: {
        status: 'authorized',
        checkout: {
          amount_cents: 180000,
          currency: 'USD',
          price_id: 'price_atlas_standard123',
        },
      },
    });

    await expect(authorizeDeflectionCheckout('request-123')).resolves.toEqual({
      ok: true,
      checkout: {
        amountCents: 180000,
        currency: 'usd',
        priceId: 'price_atlas_standard123',
      },
    });
    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/request-123/checkout-authorization',
    );

    resetFetch({
      payload: {
        status: 'authorized',
        checkout: {
          amount_cents: 180000,
          currency: 'USD',
          price_id: 'price_atlas_standard123',
        },
      },
    });
    await expect(authorizeDeflectionCheckout('request-123', 'standard')).resolves.toEqual({
      ok: true,
      checkout: {
        amountCents: 180000,
        currency: 'usd',
        priceId: 'price_atlas_standard123',
      },
    });
    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/request-123/checkout-authorization?price_variant=standard',
    );

    resetFetch({
      payload: {
        status: 'authorized',
        checkout: {
          amount_cents: 100000,
          currency: 'USD',
          price_id: 'price_atlas_partner123',
        },
      },
    });
    await expect(authorizeDeflectionCheckout('request-123', 'partner')).resolves.toEqual({
      ok: true,
      checkout: {
        amountCents: 100000,
        currency: 'usd',
        priceId: 'price_atlas_partner123',
      },
    });
    expect(fetchCalls[0].url).toBe(
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/request-123/checkout-authorization?price_variant=partner',
    );
  });

  it('does not call ATLAS when service env is missing and maps 503 to not configured', async () => {
    resetFetch({ status: 503 });
    await expect(fetchDeflectionStandardPricingTerms()).resolves.toEqual({
      ok: false,
      reason: 'not_configured',
    });

    resetEnv();
    resetFetch();
    await expect(fetchDeflectionStandardPricingTerms()).resolves.toEqual({
      ok: false,
      reason: 'not_configured',
    });
    expect(fetchCalls).toHaveLength(0);
  });
});

describe('deflection price display helpers', () => {
  it('projects standard and partner ATLAS terms into display variants', () => {
    const atlasPriced = withDeflectionStandardPriceDisplayTerms(
      DEFLECTION_DEFAULT_PRICE_VARIANT,
      { amountCents: 180000, currency: 'usd' },
    );
    expect(atlasPriced.priceLabel).toBe('$1,800');
    expect(atlasPriced.amountCents).toBe(180000);
    expect(atlasPriced.priceUnavailable).toBe(false);

    const partnerAtlasPriced = withDeflectionPriceDisplayTerms(
      DEFLECTION_PARTNER_PRICE_VARIANT,
      { variant: 'partner', amountCents: 120000, currency: 'usd' },
    );
    expect(partnerAtlasPriced.priceLabel).toBe('$1,200');
    expect(partnerAtlasPriced.amountCents).toBe(120000);
    expect(partnerAtlasPriced.priceUnavailable).toBe(false);
  });

  it('marks missing or mismatched display terms unavailable without changing partner standard fallback', () => {
    const unavailable = withDeflectionStandardPriceDisplayTerms(
      DEFLECTION_DEFAULT_PRICE_VARIANT,
      null,
    );
    expect(unavailable.priceLabel).toBe(DEFLECTION_PRICE_UNAVAILABLE_LABEL);
    expect(unavailable.amountCents).toBe(0);
    expect(unavailable.priceUnavailable).toBe(true);

    const partnerUnavailable = withDeflectionPriceDisplayTerms(
      DEFLECTION_PARTNER_PRICE_VARIANT,
      null,
    );
    expect(partnerUnavailable.priceLabel).toBe(DEFLECTION_PRICE_UNAVAILABLE_LABEL);
    expect(partnerUnavailable.amountCents).toBe(0);
    expect(partnerUnavailable.priceUnavailable).toBe(true);

    expect(
      withDeflectionStandardPriceDisplayTerms(DEFLECTION_PARTNER_PRICE_VARIANT, null)
        .priceLabel,
    ).toBe(DEFLECTION_PARTNER_PRICE_VARIANT.priceLabel);
  });
});
