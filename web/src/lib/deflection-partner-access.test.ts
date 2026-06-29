import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as recordRoutePOST } from '@/app/api/gap-report-intake/record/route';
import {
  DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV,
  DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM,
  DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV as PARTNER_ACCESS_SIGNING_SECRETS_ENV,
  hasDeflectionPartnerPriceAccessToken,
  resolveIntakePriceVariantId,
} from '@/lib/deflection-partner-access';
import {
  DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV as PARTNER_TOKEN_ACCESS_TOKEN_ENV,
  DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV,
  DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX,
  createDeflectionPartnerSignedAccessToken,
  hasDeflectionPartnerAccessToken,
} from '@/lib/deflection-partner-token';
import * as pricingCatalog from '@/lib/deflection-pricing-catalog';

type FetchResponse =
  | { status: number; body?: unknown; after?: () => void }
  | { reject: string; after?: () => void };
type QueryCall = { sql: string; params: unknown[] };

const blobState = vi.hoisted(() => ({
  get: vi.fn(),
  head: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  duplicate: null as null | {
    request_id: string;
    report_request_id: string;
    submitted_at: string;
  },
  insertThrows: false,
  queries: [] as QueryCall[],
  neon: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({
  get: blobState.get,
  head: blobState.head,
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: dbState.neon,
}));

const ACCESS_ENV_KEY = 'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const SIGNING_ENV_KEY = 'DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS';
const ENV_KEYS = [
  ACCESS_ENV_KEY,
  SIGNING_ENV_KEY,
  'ATLAS_API_BASE_URL',
  'ATLAS_B2B_SERVICE_TOKEN',
  'BLOB_READ_WRITE_TOKEN',
  'ticke_deflection_blob_READ_WRITE_TOKEN',
  'GAP_REPORT_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
  'GAP_REPORT_NOTIFICATION_RESEND_API_KEY',
  'AUDIT_NOTIFICATION_RESEND_API_KEY',
  'ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY',
  'GAP_REPORT_NOTIFICATION_FROM_EMAIL',
  'AUDIT_NOTIFICATION_FROM_EMAIL',
  'ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL',
  'ATLAS_EMAIL_DEFAULT_FROM',
  'GAP_REPORT_NOTIFICATION_TO_EMAIL',
  'AUDIT_NOTIFICATION_TO_EMAIL',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const webRoot = process.cwd();
const atlasBaseUrl = 'https://atlas.example.test';
const atlasToken = ['service', 'token', 'unit'].join('_');
let fetchQueue: FetchResponse[] = [];
let fetchCalls: Array<{ url: string; init: RequestInit }> = [];

async function query(sql: string, params: unknown[]) {
  dbState.queries.push({ sql, params });
  if (/^\s*SELECT/i.test(sql)) {
    return dbState.duplicate ? [dbState.duplicate] : [];
  }
  if (/^\s*INSERT/i.test(sql)) {
    if (dbState.insertThrows) throw new Error('persist failed');
    return [];
  }
  throw new Error(`Unexpected SQL: ${sql}`);
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

function resetTokens({ access, signing }: { access?: string; signing?: string } = {}) {
  delete process.env[ACCESS_ENV_KEY];
  delete process.env[SIGNING_ENV_KEY];
  if (access !== undefined) process.env[ACCESS_ENV_KEY] = access;
  if (signing !== undefined) process.env[SIGNING_ENV_KEY] = signing;
}

function resetDatabase() {
  dbState.duplicate = null;
  dbState.insertThrows = false;
  dbState.queries = [];
  dbState.neon.mockClear();
}

function resetBlob() {
  blobState.head.mockReset();
  blobState.get.mockReset();
  blobState.head.mockResolvedValue({ url: 'https://blob.example/gap-report-csvs/unit.csv' });
  blobState.get.mockImplementation(async () => ({
    statusCode: 200,
    stream: new Blob(['ticket_id,message\n1,How do I export reports?\n'], {
      type: 'text/csv',
    }).stream(),
    blob: { contentType: 'text/csv' },
  }));
}

function queueFetch(responses: FetchResponse[]) {
  fetchCalls = [];
  fetchQueue = [...responses];
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    fetchCalls.push({ url, init });
    const response = fetchQueue.shift();
    if (!response) throw new Error(`Unexpected fetch: ${url}`);
    try {
      if ('reject' in response) throw new Error(response.reject);
      if (response.body === undefined) return new Response(null, { status: response.status });
      return Response.json(response.body, { status: response.status });
    } finally {
      response.after?.();
    }
  });
}

function resetRateLimitStore() {
  globalThis.__atlasDeflectionRateLimitStore = undefined;
}

function configureDeflectionEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  resetEnv({
    ATLAS_API_BASE_URL: atlasBaseUrl,
    ATLAS_B2B_SERVICE_TOKEN: atlasToken,
    BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_unit',
    ...values,
  });
}

function minimalSnapshot() {
  return {
    title: 'Resolution Snapshot',
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      support_ticket_resolution_evidence_present: true,
      support_ticket_resolution_evidence_count: 1,
      repeat_ticket_count: 3,
      non_repeat_ticket_count: 0,
    },
    top_questions: [],
    locked_questions: [],
    top_blind_spots: [],
    teaser: { full_answer: null, previews: [] },
  };
}

function successFetches() {
  return [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { status: 200, body: minimalSnapshot() },
  ] satisfies FetchResponse[];
}

function recordRequest({
  email = 'alex@example.com',
  ip = '203.0.113.10',
  partnerToken,
  priceVariant = 'standard',
}: {
  email?: string;
  ip?: string;
  partnerToken?: string;
  priceVariant?: string;
} = {}) {
  return new Request('https://unit.test/api/gap-report-intake/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({
      name: 'Alex Lee',
      email,
      companyName: 'Effingham Office Maids',
      supportPlatform: 'helpscout',
      csvFilename: 'tickets.csv',
      sourcePage: '/systems/support-ticket-deflection/intake',
      sourceOffer: 'support-ticket-deflection-intake',
      priceVariant,
      ...(partnerToken ? { partnerToken } : {}),
      blobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
    }),
  });
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  restoreEnv();
  resetEnv();
  resetDatabase();
  resetBlob();
  resetRateLimitStore();
  queueFetch([]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    Reflect.deleteProperty(globalThis, 'fetch');
  }
  restoreEnv();
  resetRateLimitStore();
  vi.restoreAllMocks();
});

describe('partner price access helpers', () => {
  it('accepts configured direct tokens and resolves partner intake only with access', () => {
    expect(DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_ENV).toBe(ACCESS_ENV_KEY);
    expect(DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM).toBe('partnerToken');
    expect(PARTNER_TOKEN_ACCESS_TOKEN_ENV).toBe(ACCESS_ENV_KEY);
    expect(PARTNER_ACCESS_SIGNING_SECRETS_ENV).toBe(SIGNING_ENV_KEY);
    expect(DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV).toBe(SIGNING_ENV_KEY);
    expect(pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_DEFAULT).toBe(150_000);
    expect(pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_DEFAULT).toBe(100_000);
    expect(pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV).toBe(
      'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS',
    );
    expect(pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV).toBe(
      'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS',
    );
    expect(pricingCatalog.configuredDeflectionPriceAmounts({
      [pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV]: '180000',
      [pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV]: '120000',
    })).toMatchObject({
      ok: true,
      amounts: { standard: 180_000, partner: 120_000 },
      sources: { standard: 'env', partner: 'env' },
    });
    expect(pricingCatalog.resolveDeflectionPriceVariant('partner')?.id).toBe('partner');

    resetTokens({ access: 'signed-partner-token' });
    expect(hasDeflectionPartnerPriceAccessToken('signed-partner-token')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken(' signed-partner-token ')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('wrong-token')).toBe(false);
    expect(resolveIntakePriceVariantId('partner', 'signed-partner-token')).toBe('partner');
    expect(resolveIntakePriceVariantId('partner', 'wrong-token')).toBe('standard');
    expect(resolveIntakePriceVariantId('standard', 'signed-partner-token')).toBe('standard');
    expect(resolveIntakePriceVariantId('unknown', 'signed-partner-token')).toBe('standard');

    resetTokens({ access: 'old-partner-token, signed-partner-token , next-partner-token' });
    expect(hasDeflectionPartnerPriceAccessToken('old-partner-token')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('signed-partner-token')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('next-partner-token')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('wrong-token')).toBe(false);
    expect(resolveIntakePriceVariantId('partner', 'next-partner-token')).toBe('partner');

    resetTokens({ access: ' , signed-partner-token ,, ' });
    expect(hasDeflectionPartnerPriceAccessToken('signed-partner-token')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('')).toBe(false);

    resetTokens({ access: ' , ,, ' });
    expect(hasDeflectionPartnerPriceAccessToken('signed-partner-token')).toBe(false);
    expect(resolveIntakePriceVariantId('partner', 'signed-partner-token')).toBe('standard');

    resetTokens();
    expect(hasDeflectionPartnerPriceAccessToken('signed-partner-token')).toBe(false);
    expect(resolveIntakePriceVariantId('partner', 'signed-partner-token')).toBe('standard');
  });

  it('accepts signed tokens with secret rotation without accepting raw signing secrets', () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const signedToken = createDeflectionPartnerSignedAccessToken({
      secret: 'signed-secret',
      partner: 'acme',
      expiresAt,
    });

    expect(signedToken.startsWith(`${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.`)).toBe(true);
    resetTokens({ signing: 'signed-secret' });
    expect(hasDeflectionPartnerPriceAccessToken(signedToken)).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('signed-secret')).toBe(false);
    expect(resolveIntakePriceVariantId('partner', signedToken)).toBe('partner');
    expect(hasDeflectionPartnerAccessToken(signedToken, ['signed-secret'])).toBe(false);
    expect(hasDeflectionPartnerPriceAccessToken(`${signedToken.slice(0, -1)}x`)).toBe(false);
    expect(
      hasDeflectionPartnerAccessToken(signedToken, ['signed-secret'], {
        nowSeconds: expiresAt + 1,
      }),
    ).toBe(false);
    expect(hasDeflectionPartnerAccessToken('partner_v1.not-json.signature', ['signed-secret']))
      .toBe(false);

    resetTokens({ signing: 'old-signing-secret,current-signing-secret' });
    const oldSignedToken = createDeflectionPartnerSignedAccessToken({
      secret: 'old-signing-secret',
      partner: 'acme',
      expiresAt,
    });
    const currentSignedToken = createDeflectionPartnerSignedAccessToken({
      secret: 'current-signing-secret',
      partner: 'acme',
      expiresAt,
    });
    expect(hasDeflectionPartnerPriceAccessToken(oldSignedToken)).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken(currentSignedToken)).toBe(true);

    resetTokens({ access: 'old-signing-secret', signing: 'current-signing-secret' });
    expect(hasDeflectionPartnerPriceAccessToken(oldSignedToken)).toBe(false);
    expect(hasDeflectionPartnerPriceAccessToken(currentSignedToken)).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('old-signing-secret')).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('current-signing-secret')).toBe(false);

    resetTokens({ access: 'legacy-signing-secret' });
    const legacyFallbackSignedToken = createDeflectionPartnerSignedAccessToken({
      secret: 'legacy-signing-secret',
      partner: 'acme',
      expiresAt,
    });
    expect(hasDeflectionPartnerPriceAccessToken(legacyFallbackSignedToken)).toBe(true);
  });

  it('generates signed CLI tokens only when signing secrets are configured', () => {
    const cliPath = join(webRoot, 'scripts/create-deflection-partner-token.mjs');
    const directOnlyCliRun = spawnSync(
      process.execPath,
      [cliPath, '--partner', 'acme', '--ttl-days', '7', '--no-local-env'],
      {
        cwd: webRoot,
        env: { ...process.env, [ACCESS_ENV_KEY]: 'direct-cli-token' },
        encoding: 'utf8',
      },
    );

    expect(directOnlyCliRun.status).toBe(1);
    expect(directOnlyCliRun.stdout).toBe('');
    expect(directOnlyCliRun.stderr).toContain(`Missing ${SIGNING_ENV_KEY}`);

    const cliRun = spawnSync(
      process.execPath,
      [cliPath, '--partner', 'acme', '--ttl-days', '7', '--no-local-env'],
      {
        cwd: webRoot,
        env: {
          ...process.env,
          [ACCESS_ENV_KEY]: 'direct-cli-token',
          [SIGNING_ENV_KEY]: 'old-cli-secret,cli-signing-secret',
        },
        encoding: 'utf8',
      },
    );

    expect(cliRun.status).toBe(0);
    const cliToken = cliRun.stdout.trim();
    expect(cliToken.startsWith(`${DEFLECTION_PARTNER_SIGNED_TOKEN_PREFIX}.`)).toBe(true);
    expect(cliToken).not.toContain('cli-signing-secret');
    resetTokens({ access: 'direct-cli-token' });
    expect(hasDeflectionPartnerPriceAccessToken(cliToken)).toBe(false);
    resetTokens({ signing: 'cli-signing-secret' });
    expect(hasDeflectionPartnerPriceAccessToken(cliToken)).toBe(true);
    expect(hasDeflectionPartnerPriceAccessToken('cli-signing-secret')).toBe(false);
  });
});

describe('partner access page wiring', () => {
  it('keeps partner intake and landing copy gated by the real access helper', async () => {
    const [intakePage, partnerPage, partnerClient] = await Promise.all([
      readFile(join(webRoot, 'src/app/systems/support-ticket-deflection/intake/page.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/app/systems/support-ticket-deflection/partner/page.tsx'), 'utf8'),
      readFile(
        join(
          webRoot,
          'src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx',
        ),
        'utf8',
      ),
    ]);

    expect(intakePage).toContain('resolveIntakePriceVariantId');
    expect(intakePage).toContain('DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM');
    expect(partnerPage).toContain('hasDeflectionPartnerPriceAccessToken');
    expect(partnerPage).toContain('hasPartnerAccess ? token : undefined');
    expect(partnerClient).not.toContain('DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel');
    expect(partnerClient).toContain("href: '/systems/support-ticket-deflection/intake'");
    expect(partnerClient).toContain('standardPriceSource: undefined');
    expect(partnerClient).toContain('priceVariant: DEFLECTION_PARTNER_PRICE_VARIANT.id');
    expect(partnerClient).toContain('DESIGN PARTNER ACCESS');
    expect(partnerClient).toContain(
      'See whether your repeat tickets justify a full Deflection Report.',
    );
    expect(partnerClient).toContain(
      'one review-ready answer when your tickets contain resolution evidence',
    );
    expect(partnerClient).toContain(
      'It does not promise guaranteed savings; it promises a usable audit trail.',
    );
    expect(partnerClient).not.toContain('one self-service answer');
    expect(partnerClient).not.toContain('1 sample self-service answer');
  });
});

describe('partner access record route behavior', () => {
  it('rejects forged partner price submissions before Blob or ATLAS work', async () => {
    configureDeflectionEnv();
    resetTokens({ access: 'signed-partner-token' });

    const response = await recordRoutePOST(recordRequest({ priceVariant: 'partner' }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: 'Invalid partner price access token.',
    });
    expect(blobState.head).not.toHaveBeenCalled();
    expect(fetchCalls).toHaveLength(0);
  });

  it('returns recent duplicate submissions without submitting or persisting again', async () => {
    configureDeflectionEnv({ GAP_REPORT_DATABASE_URL: 'postgres://gap-report-unit' });
    dbState.duplicate = {
      request_id: '22222222-2222-4222-8222-222222222222',
      report_request_id: 'content-ops-existing-456',
      submitted_at: '2026-06-08T19:40:00.000Z',
    };

    const response = await recordRoutePOST(recordRequest({ ip: '203.0.113.21' }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      ok: true,
      requestId: '22222222-2222-4222-8222-222222222222',
      reportRequestId: 'content-ops-existing-456',
      status: 'already_submitted',
      warnings: [],
      estimatedResponseHours: 24,
    });
    expect(dbState.queries[0].params[0]).toBe('alex@example.com');
    expect(dbState.queries[0].params[1]).toBe('https://blob.example/gap-report-csvs/unit.csv');
    expect(fetchCalls).toHaveLength(0);
    expect(dbState.queries.some((call) => /^\s*INSERT/i.test(call.sql))).toBe(false);
  });

  it('does not spend the email bucket on failed ownership checks', async () => {
    configureDeflectionEnv();
    blobState.head.mockRejectedValue(new Error('not found'));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const forgedBlob = await recordRoutePOST(
        recordRequest({ ip: `198.51.100.${attempt + 10}`, email: 'victim@example.com' }),
      );
      expect(forgedBlob.status).toBe(400);
      expect(await readJson(forgedBlob)).toEqual({ ok: false, error: 'Upload not found.' });
    }

    blobState.head.mockResolvedValue({ url: 'https://blob.example/gap-report-csvs/unit.csv' });
    queueFetch(successFetches());
    const validVictimRecord = await recordRoutePOST(
      recordRequest({ ip: '198.51.100.50', email: 'victim@example.com' }),
    );

    expect(validVictimRecord.status).toBe(200);
    expect((await readJson(validVictimRecord)).reportRequestId).toBe('content-ops-unit-123');
  });

  it('rate-limits repeated support-deflection record submissions before Blob and ATLAS work', async () => {
    configureDeflectionEnv();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      queueFetch(successFetches());
      const accepted = await recordRoutePOST(
        recordRequest({ ip: '203.0.113.77', email: 'rate-limited@example.com' }),
      );
      expect(accepted.status).toBe(200);
    }

    const headCallsBefore = blobState.head.mock.calls.length;
    const fetchCallsBefore = fetchCalls.length;
    const rateLimitedRecord = await recordRoutePOST(
      recordRequest({ ip: '203.0.113.77', email: 'rate-limited@example.com' }),
    );

    expect(rateLimitedRecord.status).toBe(429);
    expect(Number(rateLimitedRecord.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await readJson(rateLimitedRecord)).toEqual({
      ok: false,
      error: 'Too many submission attempts. Please try again later.',
    });
    expect(blobState.head.mock.calls).toHaveLength(headCallsBefore);
    expect(fetchCalls).toHaveLength(fetchCallsBefore);
  });

  it('maps ATLAS submit failures without persisting a successful local row', async () => {
    const fixtures = [
      {
        env: {},
        fetches: [] as FetchResponse[],
        getReturns: undefined,
        status: 503,
        reason: 'not_configured',
        error:
          'Resolution Audit generation is temporarily unavailable. Please try again in a moment or email us directly.',
      },
      {
        env: { ATLAS_API_BASE_URL: atlasBaseUrl, ATLAS_B2B_SERVICE_TOKEN: atlasToken },
        fetches: [] as FetchResponse[],
        getReturns: null,
        status: 400,
        reason: 'blob_not_found',
        error: 'We could not read the uploaded CSV. Please retry the upload.',
      },
      {
        env: { ATLAS_API_BASE_URL: atlasBaseUrl, ATLAS_B2B_SERVICE_TOKEN: atlasToken },
        fetches: [{ status: 200, body: { request_id: '../../bad' } }] as FetchResponse[],
        getReturns: undefined,
        status: 502,
        reason: 'invalid_response',
        error:
          'Resolution Audit generation returned an unexpected response. Please try again or email us directly.',
      },
      {
        env: { ATLAS_API_BASE_URL: atlasBaseUrl, ATLAS_B2B_SERVICE_TOKEN: atlasToken },
        fetches: [{ status: 400, body: { detail: 'rejected' } }] as FetchResponse[],
        getReturns: undefined,
        status: 502,
        reason: 'rejected',
        error:
          'Resolution Audit generation rejected this CSV. Please check the export and try again, or email us directly.',
      },
      {
        env: { ATLAS_API_BASE_URL: atlasBaseUrl, ATLAS_B2B_SERVICE_TOKEN: atlasToken },
        fetches: [{ reject: 'network down' }] as FetchResponse[],
        getReturns: undefined,
        status: 503,
        reason: 'error',
        error:
          'Resolution Audit generation failed. Please try again in a moment or email us directly.',
      },
    ];

    for (const fixture of fixtures) {
      resetRateLimitStore();
      resetDatabase();
      if (fixture.reason === 'not_configured') {
        resetEnv({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_unit' });
      } else {
        configureDeflectionEnv(fixture.env);
      }
      if (fixture.getReturns === null) blobState.get.mockResolvedValueOnce(null);
      queueFetch(fixture.fetches);

      const response = await recordRoutePOST(recordRequest());

      expect(response.status).toBe(fixture.status);
      expect(await readJson(response)).toEqual({
        ok: false,
        status: 'failed_to_submit',
        reason: fixture.reason,
        error: fixture.error,
      });
      expect(dbState.queries.some((call) => /^\s*INSERT/i.test(call.sql))).toBe(false);
    }
  });

  it('keeps partner ATLAS submit failures on Deflection Report copy', async () => {
    resetTokens({ access: 'signed-partner-token' });
    configureDeflectionEnv({
      ATLAS_API_BASE_URL: atlasBaseUrl,
      ATLAS_B2B_SERVICE_TOKEN: atlasToken,
      DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN: 'signed-partner-token',
    });
    queueFetch([{ status: 400, body: { detail: 'rejected' } }]);

    const response = await recordRoutePOST(
      recordRequest({
        priceVariant: 'partner',
        partnerToken: 'signed-partner-token',
      }),
    );

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      ok: false,
      status: 'failed_to_submit',
      reason: 'rejected',
      error:
        'Deflection Report generation rejected this CSV. Please check the export and try again, or email us directly.',
    });
    expect(dbState.queries.some((call) => /^\s*INSERT/i.test(call.sql))).toBe(false);
  });

  it('fails closed before customer email when the Snapshot attachment cannot be fetched', async () => {
    const fixtures = [
      {
        submitAfter: () => {
          delete process.env.ATLAS_API_BASE_URL;
          delete process.env.ATLAS_B2B_SERVICE_TOKEN;
        },
        snapshotFetch: null,
        reason: 'not_configured',
        status: 503,
        error:
          'Resolution Audit Snapshot delivery is temporarily unavailable. Please try again in a moment or email us directly.',
      },
      {
        snapshotFetch: { status: 404, body: { detail: 'missing snapshot' } },
        reason: 'not_found',
        status: 502,
        error:
          'Resolution Audit generation finished, but the Snapshot was not available yet. Please try again in a moment or email us directly.',
      },
      {
        snapshotFetch: { status: 500, body: { detail: 'snapshot unavailable' } },
        reason: 'error',
        status: 502,
        error:
          'Resolution Audit Snapshot delivery failed. Please try again in a moment or email us directly.',
      },
    ] satisfies Array<{
      submitAfter?: () => void;
      snapshotFetch: FetchResponse | null;
      reason: string;
      status: number;
      error: string;
    }>;

    for (const fixture of fixtures) {
      resetRateLimitStore();
      resetDatabase();
      configureDeflectionEnv({
        GAP_REPORT_NOTIFICATION_RESEND_API_KEY: 'resend_unit',
        GAP_REPORT_NOTIFICATION_FROM_EMAIL: 'reports@example.com',
        GAP_REPORT_NOTIFICATION_TO_EMAIL: 'ops@example.com',
      });
      queueFetch([
        { status: 200, body: { request_id: 'content-ops-unit-123' }, after: fixture.submitAfter },
        ...(fixture.snapshotFetch ? [fixture.snapshotFetch] : []),
        { status: 204 },
      ]);

      const response = await recordRoutePOST(
        recordRequest({ ip: `203.0.113.${fixture.reason === 'not_found' ? '41' : '42'}` }),
      );

      expect(response.status).toBe(fixture.status);
      expect(await readJson(response)).toEqual({
        ok: false,
        status: 'failed_to_fetch_snapshot',
        reason: fixture.reason,
        error: fixture.error,
      });
      expect(fetchCalls).toHaveLength(fixture.snapshotFetch ? 3 : 1);
      expect(fetchCalls[0].url).toContain('/api/v1/content-ops/deflection-reports');
      if (fixture.snapshotFetch) {
        expect(fetchCalls[1].url).toContain(
          '/api/v1/content-ops/deflection-reports/content-ops-unit-123/snapshot',
        );
        expect(fetchCalls[2]).toMatchObject({
          url: `${atlasBaseUrl}/api/v1/content-ops/deflection-reports/content-ops-unit-123`,
          init: expect.objectContaining({ method: 'DELETE' }),
        });
      }
      expect(dbState.queries.some((call) => /^\s*INSERT/i.test(call.sql))).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('deflection.record.snapshot_pdf_attachment_skipped'),
      );
    }
  });

  it('requires durable persistence for validated partner uploads but lets standard uploads warn', async () => {
    resetTokens({ access: 'signed-partner-token' });
    configureDeflectionEnv({
      GAP_REPORT_DATABASE_URL: 'postgres://gap-report-unit',
      DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN: 'signed-partner-token',
    });
    dbState.insertThrows = true;
    queueFetch(successFetches());

    const partnerResponse = await recordRoutePOST(
      recordRequest({
        priceVariant: 'partner',
        partnerToken: 'signed-partner-token',
      }),
    );

    expect(partnerResponse.status).toBe(503);
    expect(await readJson(partnerResponse)).toEqual({
      ok: false,
      error: 'Partner price could not be saved. Please retry your upload.',
    });

    resetRateLimitStore();
    resetDatabase();
    configureDeflectionEnv();
    queueFetch(successFetches());
    const standardResponse = await recordRoutePOST(recordRequest({ priceVariant: 'standard' }));

    expect(standardResponse.status).toBe(200);
    const standardPayload = await readJson(standardResponse);
    expect(standardPayload.ok).toBe(true);
    expect(standardPayload.reportRequestId).toBe('content-ops-unit-123');
    expect(standardPayload.status).toBe('submitted_with_warnings');
    expect(String((standardPayload.warnings as string[]).join('\n'))).toContain(
      'Gap Report database persistence not configured',
    );
  });
});
