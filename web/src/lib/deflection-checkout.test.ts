import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as checkoutRoutePOST } from '@/app/api/deflection-checkout/route';
import { createDeflectionCheckoutSession } from '@/lib/deflection-checkout';
import {
  DEFLECTION_FULL_REPORT_PRICE_CENTS,
  DEFLECTION_PARTNER_PRICE_VARIANT,
} from '@/lib/deflection-pricing';

type FetchResponse = { status: number; body: unknown };
type FetchCall = { url: string; init: RequestInit };

const dbState = vi.hoisted(() => ({
  rows: [] as Array<{ price_variant: string | null }>,
  shouldThrow: false,
  queries: [] as Array<{ sql: string; params: unknown[] }>,
  neon: vi.fn(),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: dbState.neon,
}));

const ENV_KEYS = [
  'ATLAS_SAAS_STRIPE_RAK',
  'ATLAS_SAAS_STRIPE_SECRET_KEY',
  'ATLAS_ACCOUNT_ID',
  'ATLAS_API_BASE_URL',
  'ATLAS_B2B_SERVICE_TOKEN',
  'GAP_REPORT_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID',
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS',
  'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS',
  'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS',
  'VERCEL_ENV',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const stripeSessionUrl = 'https://checkout.stripe.test/session';
const atlasBaseUrl = 'https://atlas.example.test';
const atlasToken = ['service', 'token', 'unit'].join('_');
const standardCheckout = {
  amountCents: DEFLECTION_FULL_REPORT_PRICE_CENTS,
  currency: 'usd',
  priceId: 'price_atlas_standard123',
};
const partnerCheckout = {
  amountCents: DEFLECTION_PARTNER_PRICE_VARIANT.amountCents,
  currency: 'usd',
  priceId: 'price_atlas_partner123',
};

let fetchCalls: FetchCall[] = [];
let fetchQueue: FetchResponse[] = [];

function key(prefix: 'rk' | 'sk', mode: 'test' | 'live' = 'test') {
  return [prefix, mode, 'unit'].join('_');
}

async function query(sql: string, params: unknown[]) {
  dbState.queries.push({ sql, params });
  if (dbState.shouldThrow) throw new Error('lookup failed');
  return dbState.rows;
}

dbState.neon.mockImplementation(() => ({ query }));

function restoreEnv() {
  for (const envKey of ENV_KEYS) {
    delete process.env[envKey];
    if (originalEnv[envKey] !== undefined) process.env[envKey] = originalEnv[envKey];
  }
}

function resetEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const envKey of ENV_KEYS) delete process.env[envKey];
  Object.assign(process.env, values);
}

function resetDatabase(rows: Array<{ price_variant: string | null }> = []) {
  dbState.rows = rows;
  dbState.shouldThrow = false;
  dbState.queries = [];
  dbState.neon.mockClear();
}

function resetRateLimitStore() {
  globalThis.__atlasDeflectionRateLimitStore = undefined;
}

function queueFetch(responses: FetchResponse[]) {
  fetchCalls = [];
  fetchQueue = [...responses];
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    fetchCalls.push({ url, init });
    const response = fetchQueue.shift();
    if (!response) throw new Error(`Unexpected fetch: ${url}`);
    return Response.json(response.body, { status: response.status });
  });
}

function stripeSession(
  values: Partial<{ url: string; amount_total: number; currency: string }> = {},
) {
  return {
    url: stripeSessionUrl,
    amount_total: DEFLECTION_FULL_REPORT_PRICE_CENTS,
    currency: 'usd',
    ...values,
  };
}

function atlasAuthorization(checkout = standardCheckout) {
  return {
    status: 'authorized',
    checkout: {
      amount_cents: checkout.amountCents,
      currency: checkout.currency,
      price_id: checkout.priceId,
    },
  };
}

function body(call: FetchCall) {
  return new URLSearchParams(String(call.init.body ?? ''));
}

function headers(call: FetchCall) {
  return new Headers(call.init.headers);
}

function configureStandardEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  resetEnv({
    ATLAS_SAAS_STRIPE_RAK: key('rk'),
    ATLAS_ACCOUNT_ID: 'acct_unit',
    ATLAS_API_BASE_URL: atlasBaseUrl,
    ATLAS_B2B_SERVICE_TOKEN: atlasToken,
    STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'price_standard123',
    STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_legacy123',
    ...values,
  });
}

function checkoutRequest(bodyValue: unknown) {
  return new Request('https://unit.test/api/deflection-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
    body: JSON.stringify(bodyValue),
  });
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

async function createSession(
  checkout = standardCheckout,
  priceVariantId?: 'standard' | 'partner' | 'unknown',
) {
  return createDeflectionCheckoutSession(
    'request-123',
    'attempt-12345678',
    checkout,
    priceVariantId as never,
  );
}

beforeEach(() => {
  restoreEnv();
  resetEnv();
  resetDatabase();
  resetRateLimitStore();
  queueFetch([]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('deflection checkout session helper', () => {
  it('creates a standard Stripe Checkout session using canonical ATLAS terms', async () => {
    configureStandardEnv();
    queueFetch([{ status: 200, body: stripeSession() }]);

    await expect(createSession()).resolves.toEqual({ ok: true, url: stripeSessionUrl });

    expect(fetchCalls).toHaveLength(1);
    expect(headers(fetchCalls[0]).get('authorization')).toBe(`Bearer ${key('rk')}`);
    expect(headers(fetchCalls[0]).get('stripe-version')).toBe('2026-05-27.dahlia');
    expect(body(fetchCalls[0]).get('line_items[0][price]')).toBe('price_atlas_standard123');
    expect(body(fetchCalls[0]).has('line_items[0][price_data][unit_amount]')).toBe(false);
    expect(body(fetchCalls[0]).get('metadata[account_id]')).toBe('acct_unit');
    expect(body(fetchCalls[0]).get('metadata[request_id]')).toBe('request-123');
    expect(body(fetchCalls[0]).get('metadata[price_variant]')).toBe('standard');
    expect(body(fetchCalls[0]).get('metadata[price_id]')).toBe('price_atlas_standard123');
    expect(body(fetchCalls[0]).get('metadata[price_amount_cents]')).toBe(
      String(DEFLECTION_FULL_REPORT_PRICE_CENTS),
    );
    expect(body(fetchCalls[0]).get('metadata[price_currency]')).toBe('usd');
    expect(body(fetchCalls[0]).get('success_url')).toBe(
      'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=success',
    );
    expect(body(fetchCalls[0]).get('cancel_url')).toBe(
      'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=cancel',
    );
  });

  it('enforces allowed amounts, Stripe-returned amount/currency, and selected variant config', async () => {
    const variantAmountCents = DEFLECTION_FULL_REPORT_PRICE_CENTS + 30_000;

    configureStandardEnv();
    queueFetch([]);
    await expect(createSession({ ...standardCheckout, amountCents: variantAmountCents }))
      .resolves.toEqual({ ok: false, reason: 'not_configured' });
    expect(fetchCalls).toHaveLength(0);

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${DEFLECTION_PARTNER_PRICE_VARIANT.amountCents}`,
    });
    queueFetch([{ status: 200, body: stripeSession({
      amount_total: DEFLECTION_PARTNER_PRICE_VARIANT.amountCents,
    }) }]);
    await expect(createSession(partnerCheckout, 'partner')).resolves.toEqual({
      ok: true,
      url: stripeSessionUrl,
    });
    expect(body(fetchCalls[0]).get('line_items[0][price]')).toBe('price_atlas_partner123');
    expect(body(fetchCalls[0]).get('metadata[price_variant]')).toBe('partner');
    expect(body(fetchCalls[0]).get('success_url')).toBe(
      'https://juancanfield.com/systems/support-ticket-deflection/results/request-123?checkout=success&priceVariant=partner',
    );

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${DEFLECTION_PARTNER_PRICE_VARIANT.amountCents}`,
    });
    queueFetch([{ status: 200, body: stripeSession() }]);
    await expect(createSession(partnerCheckout, 'partner')).resolves.toEqual({
      ok: false,
      reason: 'error',
    });

    configureStandardEnv({ STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123' });
    queueFetch([]);
    await expect(createSession(partnerCheckout, 'partner')).resolves.toEqual({
      ok: false,
      reason: 'not_configured',
    });

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        String(variantAmountCents),
    });
    queueFetch([{ status: 200, body: stripeSession({ amount_total: variantAmountCents }) }]);
    await expect(createSession({
      ...standardCheckout,
      amountCents: variantAmountCents,
      priceId: 'price_atlas_newstandard123',
    })).resolves.toEqual({ ok: true, url: stripeSessionUrl });
    expect(body(fetchCalls[0]).get('line_items[0][price]')).toBe('price_atlas_newstandard123');

    configureStandardEnv({ STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678' });
    queueFetch([{ status: 200, body: stripeSession({ amount_total: variantAmountCents }) }]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'error' });

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${variantAmountCents}`,
    });
    queueFetch([{ status: 200, body: stripeSession({ amount_total: variantAmountCents }) }]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'error' });

    configureStandardEnv({ STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678' });
    queueFetch([{ status: 200, body: stripeSession({ currency: 'eur' }) }]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'error' });

    configureStandardEnv({ STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678' });
    queueFetch([{ status: 200, body: { url: stripeSessionUrl, currency: 'usd' } }]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'error' });

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        `${DEFLECTION_FULL_REPORT_PRICE_CENTS},,${variantAmountCents}`,
    });
    queueFetch([]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'not_configured' });
  });

  it('accepts runtime price ids from ATLAS and rejects invalid variant requests', async () => {
    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD: 'not_a_price',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_legacy123',
    });
    queueFetch([{ status: 200, body: stripeSession() }]);
    await expect(createSession()).resolves.toEqual({ ok: true, url: stripeSessionUrl });
    expect(body(fetchCalls[0]).get('line_items[0][price]')).toBe('price_atlas_standard123');

    configureStandardEnv({ STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678' });
    queueFetch([]);
    await expect(createSession(standardCheckout, 'unknown')).resolves.toEqual({
      ok: false,
      reason: 'invalid_request',
    });
  });

  it('enforces checkout key mode by deployment environment', async () => {
    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS: '1500.00',
    });
    queueFetch([{ status: 200, body: stripeSession() }]);
    await expect(createSession()).resolves.toEqual({ ok: true, url: stripeSessionUrl });

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      VERCEL_ENV: 'production',
    });
    queueFetch([]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'not_configured' });

    configureStandardEnv({
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      VERCEL_ENV: 'preview',
    });
    queueFetch([{ status: 200, body: stripeSession() }]);
    await expect(createSession()).resolves.toEqual({ ok: true, url: stripeSessionUrl });
    expect(headers(fetchCalls[0]).get('authorization')).toBe(`Bearer ${key('rk')}`);

    configureStandardEnv({
      ATLAS_SAAS_STRIPE_RAK: key('rk', 'live'),
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      VERCEL_ENV: 'production',
    });
    queueFetch([{ status: 200, body: stripeSession() }]);
    await expect(createSession()).resolves.toEqual({ ok: true, url: stripeSessionUrl });
    expect(headers(fetchCalls[0]).get('authorization')).toBe(`Bearer ${key('rk', 'live')}`);

    configureStandardEnv({
      ATLAS_SAAS_STRIPE_RAK: key('rk', 'live'),
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
      VERCEL_ENV: 'preview',
    });
    queueFetch([]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'not_configured' });

    resetEnv({
      ATLAS_SAAS_STRIPE_SECRET_KEY: key('sk'),
      ATLAS_ACCOUNT_ID: 'acct_unit',
      ATLAS_API_BASE_URL: atlasBaseUrl,
      ATLAS_B2B_SERVICE_TOKEN: atlasToken,
      VERCEL_ENV: 'preview',
    });
    queueFetch([{ status: 200, body: stripeSession() }]);
    await expect(createSession()).resolves.toEqual({ ok: true, url: stripeSessionUrl });
    expect(headers(fetchCalls[0]).get('authorization')).toBe(`Bearer ${key('sk')}`);
    expect(body(fetchCalls[0]).get('line_items[0][price]')).toBe('price_atlas_standard123');

    resetEnv({
      ATLAS_SAAS_STRIPE_SECRET_KEY: key('sk'),
      ATLAS_ACCOUNT_ID: 'acct_unit',
      ATLAS_API_BASE_URL: atlasBaseUrl,
      ATLAS_B2B_SERVICE_TOKEN: atlasToken,
      VERCEL_ENV: 'preview',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        String(DEFLECTION_FULL_REPORT_PRICE_CENTS + 30_000),
    });
    queueFetch([]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'not_configured' });

    resetEnv({
      ATLAS_SAAS_STRIPE_SECRET_KEY: key('sk'),
      ATLAS_ACCOUNT_ID: 'acct_unit',
      ATLAS_API_BASE_URL: atlasBaseUrl,
      ATLAS_B2B_SERVICE_TOKEN: atlasToken,
      VERCEL_ENV: 'production',
    });
    queueFetch([]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'not_configured' });

    resetEnv({
      ATLAS_SAAS_STRIPE_SECRET_KEY: key('sk', 'live'),
      ATLAS_ACCOUNT_ID: 'acct_unit',
      ATLAS_API_BASE_URL: atlasBaseUrl,
      ATLAS_B2B_SERVICE_TOKEN: atlasToken,
      STRIPE_DEFLECTION_REPORT_PRICE_ID: 'price_12345678',
    });
    queueFetch([]);
    await expect(createSession()).resolves.toEqual({ ok: false, reason: 'not_configured' });
  });
});

describe('deflection checkout route', () => {
  it('authorizes with ATLAS then creates checkout through the real session helper', async () => {
    configureStandardEnv();
    queueFetch([
      { status: 200, body: atlasAuthorization() },
      { status: 200, body: stripeSession() },
    ]);

    const response = await checkoutRoutePOST(checkoutRequest({
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'standard',
    }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ url: stripeSessionUrl });
    expect(fetchCalls[0].url).toBe(
      `${atlasBaseUrl}/api/v1/content-ops/deflection-reports/request-123/checkout-authorization?price_variant=standard`,
    );
    expect(headers(fetchCalls[0]).get('authorization')).toBe(`Bearer ${atlasToken}`);
    expect(fetchCalls[1].url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(body(fetchCalls[1]).get('metadata[price_id]')).toBe('price_atlas_standard123');
  });

  it('requires server-bound partner pricing before requesting ATLAS authorization', async () => {
    configureStandardEnv();
    queueFetch([]);

    const response = await checkoutRoutePOST(checkoutRequest({
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'partner',
    }));

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: 'Could not start checkout. Please try again.',
    });
    expect(fetchCalls).toHaveLength(0);
  });

  it('fails closed when the saved price variant lookup fails', async () => {
    configureStandardEnv({ GAP_REPORT_DATABASE_URL: 'postgres://gap-report-unit' });
    dbState.shouldThrow = true;

    const response = await checkoutRoutePOST(checkoutRequest({
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'standard',
    }));

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: 'Could not start checkout. Please try again.',
    });
    expect(fetchCalls).toHaveLength(0);
  });

  it('allows a saved partner variant to flow through ATLAS and Stripe', async () => {
    configureStandardEnv({
      GAP_REPORT_DATABASE_URL: 'postgres://gap-report-unit',
      STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER: 'price_partner123',
      ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS:
        `${DEFLECTION_FULL_REPORT_PRICE_CENTS}, ${DEFLECTION_PARTNER_PRICE_VARIANT.amountCents}`,
    });
    resetDatabase([{ price_variant: 'partner' }]);
    queueFetch([
      { status: 200, body: atlasAuthorization(partnerCheckout) },
      { status: 200, body: stripeSession({
        amount_total: DEFLECTION_PARTNER_PRICE_VARIANT.amountCents,
      }) },
    ]);

    const response = await checkoutRoutePOST(checkoutRequest({
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'partner',
    }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ url: stripeSessionUrl });
    expect(fetchCalls[0].url).toBe(
      `${atlasBaseUrl}/api/v1/content-ops/deflection-reports/request-123/checkout-authorization?price_variant=partner`,
    );
    expect(body(fetchCalls[1]).get('metadata[price_variant]')).toBe('partner');
  });

  it('maps ATLAS authorization not-found and already-paid outcomes without creating Stripe sessions', async () => {
    configureStandardEnv();
    queueFetch([{ status: 404, body: { detail: 'missing' } }]);

    const missing = await checkoutRoutePOST(checkoutRequest({
      requestId: 'missing-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'standard',
    }));

    expect(missing.status).toBe(404);
    expect(await readJson(missing)).toEqual({ error: 'Report not found.' });
    expect(fetchCalls).toHaveLength(1);

    queueFetch([{ status: 409, body: { detail: 'already paid' } }]);
    const alreadyPaid = await checkoutRoutePOST(checkoutRequest({
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'standard',
    }));

    expect(alreadyPaid.status).toBe(200);
    expect(await readJson(alreadyPaid)).toEqual({ alreadyPaid: true });
    expect(fetchCalls).toHaveLength(1);
  });

  it('rejects invalid checkout requests before external calls', async () => {
    configureStandardEnv();
    queueFetch([]);

    const response = await checkoutRoutePOST(checkoutRequest({
      requestId: 'request-123',
      attemptId: 'attempt-12345678',
      priceVariant: 'unknown',
    }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: 'Invalid request.' });
    expect(fetchCalls).toHaveLength(0);
  });
});
