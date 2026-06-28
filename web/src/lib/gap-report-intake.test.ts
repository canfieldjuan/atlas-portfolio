import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_DEFLECTION_SNAPSHOT } from '@/lib/deflection-snapshot';
import {
  deflectionResultsPath,
  parseGapReportMetadata,
  recordGapReportSubmission,
} from '@/lib/gap-report-intake';

const ENV_KEYS = [
  'GAP_REPORT_NOTIFICATION_RESEND_API_KEY',
  'GAP_REPORT_NOTIFICATION_FROM_EMAIL',
  'GAP_REPORT_NOTIFICATION_TO_EMAIL',
  'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN',
  'DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS',
  'GAP_REPORT_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

type ResendCall = {
  url: string;
  body: {
    subject?: string;
    text?: string;
    attachments?: Array<{ filename: string; content: string }>;
  };
};

let calls: ResendCall[] = [];

const baseInput = {
  name: 'Alex Lee',
  email: 'alex@example.com',
  companyName: 'Effingham Office Maids',
  supportPlatform: 'helpscout' as const,
  csvBlobUrl: 'https://blob.vercel-storage.com/gap-report-csvs/unit/tickets.csv',
  csvFilename: 'tickets.csv',
  csvSizeBytes: 4096,
  sourcePage: '/systems/support-ticket-deflection/intake',
  sourceOffer: 'support-ticket-deflection-intake',
};

function resetEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  process.env.GAP_REPORT_NOTIFICATION_RESEND_API_KEY = 'resend_unit';
  process.env.GAP_REPORT_NOTIFICATION_FROM_EMAIL = 'reports@example.com';
  process.env.GAP_REPORT_NOTIFICATION_TO_EMAIL = 'ops@example.com';
  process.env.DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN = 'partner_unit';
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) {
      process.env[key] = originalEnv[key];
    }
  }
}

function installFetchStub(
  responder: (callCount: number) => Response | Promise<Response> = () =>
    new Response(JSON.stringify({ id: 'email_unit' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body ?? '{}')),
    });
    return responder(calls.length);
  };
}

function sentText(index: number) {
  return calls[index]?.body?.text ?? '';
}

function pdfText(attachment: { content: string }) {
  return Buffer.from(attachment.content, 'base64').toString('ascii');
}

function expectPersistenceWarning(result: Awaited<ReturnType<typeof recordGapReportSubmission>>) {
  expect(result.status).toBe('submitted_with_warnings');
  expect(result.persisted).toBe(false);
  expect(result.warnings).toContain(
    'Gap Report database persistence not configured. CSV blob URL is saved in the notification email; configure GAP_REPORT_DATABASE_URL or POSTGRES_URL for durable storage.',
  );
}

beforeEach(() => {
  resetEnv();
  installFetchStub();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  restoreEnv();
});

describe('deflection intake email results links', () => {
  it('builds partner result paths and validates partner metadata without leaking the token', () => {
    expect(deflectionResultsPath('content-ops-unit-123', 'partner')).toBe(
      '/systems/support-ticket-deflection/results/content-ops-unit-123?priceVariant=partner',
    );

    expect(parseGapReportMetadata({ ...baseInput, priceVariant: 'partner' })).toEqual({
      ok: false,
      error: 'Invalid partner price access token.',
    });

    const parsed = parseGapReportMetadata({
      ...baseInput,
      priceVariant: 'partner',
      partnerToken: 'partner_unit',
    });
    expect(parsed).toMatchObject({ ok: true, value: { priceVariant: 'partner' } });
    expect(JSON.stringify(parsed)).not.toContain('partner_unit');

    expect(parseGapReportMetadata({ ...baseInput, priceVariant: 'unknown' })).toEqual({
      ok: false,
      error: 'Invalid price variant.',
    });
  });

  it('sends default Resolution Audit results links with a real PDF attachment', async () => {
    const result = await recordGapReportSubmission(
      {
        ...baseInput,
        reportRequestId: 'content-ops-unit-123',
      },
      { snapshot: DEMO_DEFLECTION_SNAPSHOT },
    );

    expectPersistenceWarning(result);
    expect(calls).toHaveLength(2);
    expect(calls[0].body.subject).toMatch(/New Resolution Audit CSV/);
    expect(calls[1].body.subject).toBe('We received your Resolution Audit CSV');
    expect(sentText(0)).toMatch(/Report request ID: content-ops-unit-123/);
    expect(sentText(0)).toMatch(
      /Results: https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123/,
    );
    expect(sentText(1)).toMatch(/Your free Resolution Audit Snapshot is ready:/);
    expect(sentText(1)).toMatch(
      /https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123/,
    );
    expect(sentText(1)).toMatch(/save this email or bookmark your results link/);
    expect(sentText(1)).toMatch(
      /upgrade to the full Resolution Audit during that window without re-uploading/,
    );
    expect(sentText(1)).not.toMatch(/within 24 hours/);

    const attachments = calls[1].body.attachments ?? [];
    expect(attachments.map((attachment) => attachment.filename)).toEqual([
      'resolution-audit-snapshot-effingham-office-maids.pdf',
    ]);
    expect(pdfText(attachments[0])).toMatch(/^%PDF-1\.4/);
    expect(pdfText(attachments[0])).toMatch(/Resolution Audit Snapshot/);
    expect(pdfText(attachments[0])).toMatch(/Effingham Office Maids/);
  });

  it('sends partner Deflection Snapshot copy and results links', async () => {
    const result = await recordGapReportSubmission(
      {
        ...baseInput,
        priceVariant: 'partner',
        reportRequestId: 'content-ops-unit-123',
      },
      { snapshot: DEMO_DEFLECTION_SNAPSHOT },
    );

    expectPersistenceWarning(result);
    expect(calls).toHaveLength(2);
    expect(calls[0].body.subject).toMatch(/New Deflection Report CSV/);
    expect(calls[1].body.subject).toBe('We received your Deflection Report CSV');
    expect(sentText(0)).toMatch(
      /Results: https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123\?priceVariant=partner/,
    );
    expect(sentText(1)).toMatch(
      /https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123\?priceVariant=partner/,
    );
    expect(sentText(1)).toMatch(/Your free Deflection Snapshot is ready:/);
    expect(sentText(1)).toMatch(/upgrade to the full report during that window without re-uploading/);
    expect(sentText(1)).not.toMatch(/Resolution Audit/);
    expect(sentText(1)).toMatch(/save this email or bookmark your results link/);

    const attachments = calls[1].body.attachments ?? [];
    expect(attachments.map((attachment) => attachment.filename)).toEqual([
      'deflection-snapshot-effingham-office-maids.pdf',
    ]);
    expect(pdfText(attachments[0])).toMatch(/Deflection Snapshot/);
    expect(pdfText(attachments[0])).not.toMatch(/audit/i);
  });

  it('omits ready-link copy and attachments before a report request ID exists', async () => {
    const result = await recordGapReportSubmission(baseInput);

    expectPersistenceWarning(result);
    expect(calls).toHaveLength(2);
    expect(sentText(0)).not.toMatch(/Report request ID:/);
    expect(sentText(0)).not.toMatch(/\/systems\/support-ticket-deflection\/results\//);
    expect(sentText(1)).not.toMatch(/Your free Resolution Audit Snapshot is ready:/);
    expect(sentText(1)).not.toMatch(/Your free Deflection Snapshot is ready:/);
    expect(sentText(1)).not.toMatch(/bookmark your results link/);
    expect(sentText(1)).toMatch(/as soon as processing finishes/);
    expect(sentText(1)).not.toMatch(/within 24 hours/);
    expect(calls[1].body.attachments).toBeUndefined();
  });

  it('suppresses unsafe report request IDs in outgoing email text', async () => {
    await recordGapReportSubmission({
      ...baseInput,
      reportRequestId: 'https://evil.example/report',
    });

    expect(sentText(0)).not.toMatch(/https:\/\/evil\.example/);
    expect(sentText(1)).not.toMatch(/https:\/\/evil\.example/);
  });

  it('returns a snapshot email warning when the customer email fails', async () => {
    installFetchStub((callCount) =>
      callCount === 2
        ? new Response('snapshot email rejected', { status: 503 })
        : new Response(JSON.stringify({ id: 'email_unit' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
    );

    const result = await recordGapReportSubmission({
      ...baseInput,
      reportRequestId: 'content-ops-unit-456',
    });

    expect(result.status).toBe('submitted_with_warnings');
    expect(result.warnings).toContain('Gap Report snapshot email failed.');
    expect(result.warnings).toContain(
      'Gap Report database persistence not configured. CSV blob URL is saved in the notification email; configure GAP_REPORT_DATABASE_URL or POSTGRES_URL for durable storage.',
    );
  });
});
