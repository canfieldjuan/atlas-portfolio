import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  GAP_REPORT_EMAIL_RE,
  SUPPORT_PLATFORM_LABEL,
  isSupportPlatform,
} from './gap-report-intake.ts';
import { runDeflectionPublicReachabilitySmoke } from '../../scripts/smoke-deflection-public-reachability.mjs';

const LANDING_URL = 'https://portfolio.example.com/systems/support-ticket-deflection';
const INTAKE_URL = `${LANDING_URL}/intake`;
const GOOD_LANDING = [
  '<span data-smoke="productEyebrow">Any product</span>',
  '<a data-smoke="snapshotCta" href="/systems/support-ticket-deflection/intake">Any CTA</a>',
  '<section data-smoke="pricing">Any pricing</section>',
].join('');
const GOOD_INTAKE = [
  '<section data-smoke="inlineForm uploadEyebrow">',
  '<h2 data-smoke="headline">Any headline</h2>',
  '<input data-smoke="workEmail" />',
  '<p data-smoke="deterministicBadge">Any trust badge</p>',
  '<button data-smoke="submitCta resolutionReportCta">Any submit</button>',
  '</section>',
].join('');

function routes({ landing = {}, intake = {} } = {}) {
  return new Map([
    [LANDING_URL, { status: landing.status ?? 200, body: landing.body ?? GOOD_LANDING, reject: landing.reject }],
    [INTAKE_URL, { status: intake.status ?? 200, body: intake.body ?? GOOD_INTAKE, reject: intake.reject }],
  ]);
}

async function run({ baseUrl = 'https://portfolio.example.com/', responses = routes() } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const key = String(url);
    calls.push({ url: key, init });
    const response = responses.get(key);
    if (!response) throw new Error(`Unexpected fetch: ${key}`);
    if (response.reject) throw new Error(response.reject);
    return new Response(response.body ?? '', { status: response.status });
  };
  const result = await runDeflectionPublicReachabilitySmoke(
    { baseUrl },
    { fetchImpl, now: () => '2026-06-01T16:00:00.000Z' },
  );
  return { calls, result };
}

async function readSource(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

describe('deflection public reachability smoke guard', () => {
  it('verifies the public landing and intake markers while ignoring dormant not-found payloads', async () => {
    const { calls, result } = await run({
      responses: routes({
        landing: { body: `${GOOD_LANDING}<template>This page could not be found</template>` },
        intake: { body: `${GOOD_INTAKE}<template>This page could not be found</template>` },
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      baseUrl: 'https://portfolio.example.com',
      landingUrl: LANDING_URL,
      intakeUrl: INTAKE_URL,
    });
    expect(result.landingMarkers).toEqual({
      productEyebrow: true,
      snapshotCta: true,
      pricing: true,
      intakeHref: true,
    });
    expect(result.intakeMarkers).toEqual({
      uploadEyebrow: true,
      headline: true,
      workEmail: true,
      deterministicBadge: true,
      submitCta: true,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].init.cache).toBe('no-store');
    expect(calls[1].init.cache).toBe('no-store');
  });

  it.each([
    {
      name: 'invalid base',
      baseUrl: 'http://evil.example.com',
      error: 'Deflection public reachability smoke base URL is invalid.',
      calls: 0,
    },
    {
      name: 'landing HTTP failure',
      responses: routes({ landing: { status: 404, body: 'not found' } }),
      stage: 'landing',
      error: 'Deflection public landing page failed with HTTP 404.',
      calls: 1,
    },
    {
      name: 'landing network failure',
      responses: routes({ landing: { reject: 'network reset' } }),
      stage: 'landing',
      error: 'Deflection public landing page fetch failed before an HTTP response.',
      calls: 1,
    },
    {
      name: 'landing visible not-found error',
      responses: routes({ landing: { body: 'This page could not be found' } }),
      stage: 'landing',
      error: 'Deflection public landing page rendered an error marker: This page could not be found.',
      missing: ['productEyebrow', 'snapshotCta', 'pricing'],
      calls: 1,
    },
    {
      name: 'landing marker missing',
      responses: routes({ landing: { body: GOOD_LANDING.replace('data-smoke="pricing"', '') } }),
      stage: 'landing',
      error: 'Deflection public landing page is missing required render markers.',
      missing: ['pricing'],
      calls: 1,
    },
    {
      name: 'landing marker requires exact token',
      responses: routes({
        landing: {
          body: GOOD_LANDING.replace('data-smoke="pricing"', 'data-smoke="x-pricing"'),
        },
      }),
      stage: 'landing',
      error: 'Deflection public landing page is missing required render markers.',
      missing: ['pricing'],
      calls: 1,
    },
    {
      name: 'landing marker missing with dormant not-found payload',
      responses: routes({
        landing: {
          body: [
            GOOD_LANDING.replace('data-smoke="pricing"', ''),
            '<script>self.__next_f.push(["This page could not be found"])</script>',
            '<template>This page could not be found</template>',
          ].join(''),
        },
      }),
      stage: 'landing',
      error: 'Deflection public landing page is missing required render markers.',
      missing: ['pricing'],
      calls: 1,
    },
    {
      name: 'landing intake href missing',
      responses: routes({
        landing: { body: GOOD_LANDING.replace('href="/systems/support-ticket-deflection/intake"', '') },
      }),
      stage: 'landing',
      error: 'Deflection public landing page is missing the CSV intake CTA href.',
      missing: ['intakeHref'],
      calls: 1,
    },
    {
      name: 'intake HTTP failure',
      responses: routes({ intake: { status: 500, body: 'server error' } }),
      stage: 'intake',
      error: 'Deflection public intake page failed with HTTP 500.',
      calls: 2,
    },
    {
      name: 'intake marker missing',
      responses: routes({ intake: { body: GOOD_INTAKE.replace('data-smoke="workEmail"', '') } }),
      stage: 'intake',
      error: 'Deflection public intake page is missing required render markers.',
      missing: ['workEmail'],
      calls: 2,
    },
    {
      name: 'intake rendered error',
      responses: routes({ intake: { body: 'Application error' } }),
      stage: 'intake',
      error: 'Deflection public intake page rendered an error marker: Application error.',
      missing: ['uploadEyebrow', 'headline', 'workEmail', 'deterministicBadge', 'submitCta'],
      calls: 2,
    },
  ])('fails with the expected shape for $name', async (testCase) => {
    const { calls, result } = await run(testCase);

    expect(result.ok).toBe(false);
    expect(result.apiCalls).toBe(testCase.calls > 0);
    expect(result.stage).toBe(testCase.stage);
    expect(result.error).toBe(testCase.error);
    expect(result.missing).toEqual(testCase.missing);
    expect(calls).toHaveLength(testCase.calls);
  });

  it('pins intake copy and route metadata to the Resolution Audit offer', async () => {
    const intakePageSource = await readSource('../components/landing/SupportTicketCsvIntakePage.tsx');
    const intakeFormSource = await readSource('../components/landing/SupportTicketCsvIntakeForm.tsx');
    const intakeClientSource = `${intakePageSource}\n${intakeFormSource}`;
    const intakeRouteSource = await readSource('../app/systems/support-ticket-deflection/intake/page.tsx');
    const intakeLayoutSource = await readSource('../app/systems/support-ticket-deflection/intake/layout.tsx');
    const snapshotRouteSource = await readSource('../app/systems/support-ticket-deflection/snapshot/page.tsx');

    expect(intakeClientSource).toContain('Identify the cost exposure behind your unresolved questions.');
    expect(intakeClientSource).toContain('Upload your 30-day ticket export.');
    expect(intakeClientSource).toContain('high-volume repeat');
    expect(intakeClientSource).toContain('where documentation alone cannot carry the load.');
    expect(intakeClientSource).not.toContain('Upload your support-ticket export. The audit ranks repeated questions');
    expect(intakeClientSource).not.toContain('prepares one review-ready drafted answer');
    expect(intakeClientSource).toContain('No LLM or Generative models.');
    expect(intakeClientSource).toContain('We use deterministic clustering to sort repeated questions.');
    expect(intakeClientSource).not.toContain('exact mathematical clustering');
    expect(intakeClientSource).not.toContain('24 hours');
    expect(intakeLayoutSource).not.toContain('24 hours');
    expect(intakeRouteSource).toContain("'/systems/support-ticket-deflection/snapshot'");
    expect(intakeRouteSource).toContain("'Back to Resolution Audit'");
    expect(intakeRouteSource).toContain("snapshotName: isPartner ? 'Deflection Report' : 'Resolution Audit'");
    expect(intakeRouteSource).toContain(
      "submitLabel: isPartner ? 'Upload my CSV for my partner audit' : 'Start Your Forensic Audit'",
    );
    expect(intakeRouteSource).not.toContain('Upload my CSV, get my free Deflection Snapshot');
    expect(intakeLayoutSource).toContain('Resolution Audit Intake');
    expect(intakeLayoutSource).toContain('deterministic Resolution Audit intake');
    expect(snapshotRouteSource).toContain('The Resolution Audit: Find Support Ticket Cost Exposure');
    expect(snapshotRouteSource).toContain('forensic Snapshot of repeat contacts');
    expect(snapshotRouteSource).not.toContain('Free Deflection Snapshot');
    expect(snapshotRouteSource).not.toContain('Upload 30 days of closed tickets');
  });

  it('pins public metadata to Resolution Audit wording', async () => {
    const publicMetadataSources = [
      [
        'support-ticket-deflection layout metadata',
        await readSource('../app/systems/support-ticket-deflection/layout.tsx'),
      ],
      [
        'support-ticket-deflection demo metadata',
        await readSource('../app/systems/support-ticket-deflection/demo/layout.tsx'),
      ],
      ['AI Content Ops metadata', await readSource('../app/systems/ai-content-ops/layout.tsx')],
    ];
    const combinedPublicMetadataSource = publicMetadataSources
      .map(([label, source]) => `\n--- ${label} ---\n${source}`)
      .join('');

    expect(combinedPublicMetadataSource).toContain(
      'Resolution Audit: Find Repeat Support Ticket Cost Exposure',
    );
    expect(combinedPublicMetadataSource).toContain('Start with the Resolution Audit, then expand.');
    expect(combinedPublicMetadataSource).toContain('a Resolution Audit would surface for review.');
    expect(combinedPublicMetadataSource).not.toContain('Support Ticket Deflection Report');
  });

  it('keeps non-partner entry surfaces on Resolution Audit copy', async () => {
    const nonPartnerEntrySources = [
      ['systems support-ops card', await readSource('../app/systems/page.tsx')],
      ['AI Content Ops cross-sell', await readSource('../app/systems/ai-content-ops/page.tsx')],
      [
        'public landing pricing config',
        await readSource('../app/systems/support-ticket-deflection/landingConfig.tsx'),
      ],
      [
        'public landing v2 config',
        await readSource('../app/systems/support-ticket-deflection/landingConfig-v2.tsx'),
      ],
      ['demo page CTA', await readSource('../app/systems/support-ticket-deflection/demo/page.tsx')],
      ['playbook CTA', await readSource('../app/systems/support-ticket-deflection/playbook/page.tsx')],
      ['thirty-second calculator CTA', await readSource('../components/deflection-demo/ThirtySecondCalculator.tsx')],
      ['support-tax calculator CTA', await readSource('../components/deflection-demo/SupportTaxCalculator.tsx')],
      ['support-tax mini calculator CTA', await readSource('../components/deflection-demo/SupportTaxMiniCalculator.tsx')],
    ];
    const combinedNonPartnerEntrySource = nonPartnerEntrySources
      .map(([label, source]) => `\n--- ${label} ---\n${source}`)
      .join('');

    expect(combinedNonPartnerEntrySource).toContain('Resolution Audit Snapshot');
    expect(combinedNonPartnerEntrySource).toContain('Full Resolution Audit');
    expect(combinedNonPartnerEntrySource).toContain('Start Your Forensic Audit');
    expect(combinedNonPartnerEntrySource).toContain(
      'Best after the first full audit proves the work is useful.',
    );
    expect(combinedNonPartnerEntrySource).toContain(
      'one review-ready answer when your tickets contain resolution evidence.',
    );
    expect(combinedNonPartnerEntrySource).toContain('Free Snapshot to full audit');
    expect(combinedNonPartnerEntrySource).not.toContain('DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL');

    for (const oldLabel of [
      'Deflection Snapshot',
      'free Deflection Snapshot',
      'Support Ticket Deflection Report',
      'Full Deflection Report',
      'Get the free Snapshot first',
      'Upload your CSV, get a free Snapshot',
      'Upload tickets, get a free Deflection Snapshot',
      'Stop the leak: get a free Deflection Snapshot',
      'Get a free Deflection Snapshot',
    ]) {
      expect(combinedNonPartnerEntrySource, `old wording should be gone: ${oldLabel}`).not.toContain(oldLabel);
    }
  });

  it('keeps partner pages scoped to Deflection Snapshot copy', async () => {
    const partnerClientSource = await readSource(
      '../app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx',
    );
    const intakeRouteSource = await readSource('../app/systems/support-ticket-deflection/intake/page.tsx');

    expect(partnerClientSource).toContain("title: 'Deflection Snapshot'");
    expect(partnerClientSource).toContain("title: 'Full Deflection Report'");
    expect(partnerClientSource).toContain(
      "title: 'Start with the snapshot. Upgrade when the repeat pattern is clear.'",
    );
    expect(partnerClientSource).toContain(
      "note: 'Best after the first full Deflection Report proves the work is useful.'",
    );
    expect(partnerClientSource).toContain('free Deflection Snapshot');
    expect(partnerClientSource).toContain('What do I get in the full Deflection Report?');
    expect(partnerClientSource).toContain('structuredData: generateFaqJsonLd(');
    expect(partnerClientSource).toContain('items: partnerFaqItems');
    expect(intakeRouteSource).toContain("'/systems/support-ticket-deflection/partner'");
  });

  it('keeps stale 24-hour delivery language out of delivery surfaces', async () => {
    const staleDeliverySources = [
      ['long-form landing config', await readSource('../app/systems/support-ticket-deflection/landingConfig-v2.tsx')],
      ['shared pricing config', await readSource('../app/systems/support-ticket-deflection/landingConfig.tsx')],
      ['partner metadata', await readSource('../app/systems/support-ticket-deflection/partner/layout.tsx')],
      ['confirmation email fallback', await readSource('./gap-report-intake.ts')],
    ];

    for (const [label, source] of staleDeliverySources) {
      expect(source, `${label} should not retain stale 24-hour deflection delivery copy`).not.toContain('24 hours');
    }
  });

  it('keeps the intake helper exports live through real module imports', () => {
    expect(GAP_REPORT_EMAIL_RE.test('ops@example.com')).toBe(true);
    expect(GAP_REPORT_EMAIL_RE.test('not-an-email')).toBe(false);
    expect(isSupportPlatform('helpscout')).toBe(true);
    expect(isSupportPlatform('not-a-platform')).toBe(false);
    expect(SUPPORT_PLATFORM_LABEL).toMatchObject({
      freshdesk: 'Freshdesk',
      helpscout: 'HelpScout',
      intercom: 'Intercom',
      other: 'Other',
      zendesk: 'Zendesk',
    });
  });
});
