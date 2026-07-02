import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

type GtagCall = ['config' | 'event' | 'set', string, Record<string, unknown>?];

const webRoot = process.cwd();
const originalGoogleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

async function importAnalytics() {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_ID', 'AW-1234567890');
  return import('@/lib/analytics');
}

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalGoogleAdsId === undefined) {
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  } else {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = originalGoogleAdsId;
  }
  vi.unstubAllGlobals();
});

describe('deflection analytics path redaction', () => {
  it('redacts request IDs from analytics paths', async () => {
    const { redactAnalyticsPath } = await importAnalytics();

    expect(
      redactAnalyticsPath('/systems/support-ticket-deflection/results/content-ops-unit-123'),
    ).toBe('/systems/support-ticket-deflection/results/[requestId]');
    expect(
      redactAnalyticsPath(
        '/systems/support-ticket-deflection/results/content-ops-unit-123?checkout=success&priceVariant=partner',
      ),
    ).toBe(
      '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
    );
    expect(
      redactAnalyticsPath('/admin/intake/gap-report/11111111-1111-4111-8111-111111111111/csv'),
    ).toBe('/admin/intake/gap-report/[requestId]/csv');
    expect(redactAnalyticsPath('/resources/support-ticket-deflection-guide')).toBe(
      '/resources/support-ticket-deflection-guide',
    );
    expect(redactAnalyticsPath('')).toBe('/');
  });

  it('sends redacted page views to GA and Google Ads', async () => {
    const analytics = await importAnalytics();
    const calls: GtagCall[] = [];
    vi.stubGlobal('window', {
      location: {
        origin: 'https://portfolio.example.com',
        pathname: '/systems/support-ticket-deflection/results/content-ops-unit-123',
        search: '?checkout=success&priceVariant=partner',
      },
      gtag: (...args: GtagCall) => calls.push(args),
    });
    vi.stubGlobal('document', { title: 'Support Ticket Deflection Results' });

    analytics.trackPageView(
      '/systems/support-ticket-deflection/results/content-ops-unit-123?checkout=success&priceVariant=partner',
    );

    const pageViews = calls.filter((call) => call[0] === 'config');
    expect(pageViews).toHaveLength(2);
    expect(pageViews[0][1]).toBe(analytics.GA_MEASUREMENT_ID);
    expect(pageViews[1][1]).toBe('AW-1234567890');
    for (const pageView of pageViews) {
      expect(pageView[2]?.page_path).toBe(
        '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
      );
      expect(pageView[2]?.page_location).toBe(
        'https://portfolio.example.com/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
      );
      expect(JSON.stringify(pageView)).not.toContain('content-ops-unit-123');
    }
  });

  it('overrides caller event paths with the current redacted page context', async () => {
    const analytics = await importAnalytics();
    const calls: GtagCall[] = [];
    vi.stubGlobal('window', {
      location: {
        origin: 'https://portfolio.example.com',
        pathname: '/systems/support-ticket-deflection/results/content-ops-unit-123',
        search: '?checkout=success&priceVariant=partner',
      },
      gtag: (...args: GtagCall) => calls.push(args),
    });
    vi.stubGlobal('document', { title: 'Support Ticket Deflection Results' });

    analytics.trackEvent('faq_report_results_viewed', {
      generated_questions: 18,
      page_path: '/systems/support-ticket-deflection/results/raw-id-from-caller',
      page_location: 'https://portfolio.example.com/systems/support-ticket-deflection/results/raw-id-from-caller',
    });

    const event = calls.at(-1);
    expect(event?.[0]).toBe('event');
    expect(event?.[1]).toBe('faq_report_results_viewed');
    expect(event?.[2]?.generated_questions).toBe(18);
    expect(event?.[2]?.page_path).toBe(
      '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
    );
    expect(event?.[2]?.page_location).toBe(
      'https://portfolio.example.com/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=partner',
    );
    for (const forbidden of ['content-ops-unit-123', 'raw-id-from-caller']) {
      expect(JSON.stringify(event)).not.toContain(forbidden);
    }
  });

  it('fires calculator engagement once per session with src attribution', async () => {
    const analytics = await importAnalytics();
    const calls: GtagCall[] = [];
    const storage = new Map<string, string>();
    vi.stubGlobal('window', {
      location: {
        origin: 'https://portfolio.example.com',
        pathname: '/systems/support-ticket-deflection/support-tax',
        search: '?src=reddit&v=3000',
      },
      gtag: (...args: GtagCall) => calls.push(args),
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });

    analytics.trackCalculatorEngaged({ calculator: 'thirty_second' });
    analytics.trackCalculatorEngaged({ calculator: 'thirty_second' });

    const events = calls.filter((call) => call[0] === 'event');
    expect(events).toHaveLength(1);
    expect(events[0][1]).toBe('calculator_engaged');
    expect(events[0][2]?.calculator).toBe('thirty_second');
    expect(events[0][2]?.traffic_source).toBe('reddit');

    // A different calculator in the same session tracks independently.
    analytics.trackCalculatorEngaged({ calculator: 'leaky_bucket' });
    expect(calls.filter((call) => call[0] === 'event')).toHaveLength(2);
  });

  it('falls back to utm_source and then none for traffic attribution', async () => {
    const analytics = await importAnalytics();
    const calls: GtagCall[] = [];
    vi.stubGlobal('window', {
      location: {
        origin: 'https://portfolio.example.com',
        pathname: '/systems/support-ticket-deflection/calculator',
        search: '?utm_source=linkedin&utm_campaign=leaky',
      },
      gtag: (...args: GtagCall) => calls.push(args),
    });

    analytics.trackCalculatorCtaClicked({ calculator: 'leaky_bucket', cta: 'intake' });
    expect(calls.at(-1)?.[2]?.traffic_source).toBe('linkedin');

    (window as unknown as { location: { search: string } }).location.search = '';
    analytics.trackCalculatorCtaClicked({ calculator: 'leaky_bucket', cta: 'email_breakdown' });
    const last = calls.at(-1);
    expect(last?.[1]).toBe('calculator_cta_clicked');
    expect(last?.[2]?.cta).toBe('email_breakdown');
    expect(last?.[2]?.traffic_source).toBe('none');
  });

  it('strips calculator share-state params from event page paths', async () => {
    const analytics = await importAnalytics();
    const calls: GtagCall[] = [];
    vi.stubGlobal('window', {
      location: {
        origin: 'https://portfolio.example.com',
        pathname: '/systems/support-ticket-deflection/support-tax',
        search: '?v=3000&r=55&utm_source=reddit',
      },
      gtag: (...args: GtagCall) => calls.push(args),
    });

    analytics.trackCalculatorCtaClicked({ calculator: 'thirty_second', cta: 'intake' });

    const event = calls.at(-1);
    expect(event?.[2]?.page_path).toBe(
      '/systems/support-ticket-deflection/support-tax?utm_source=reddit',
    );
    expect(event?.[2]?.page_location).toBe(
      'https://portfolio.example.com/systems/support-ticket-deflection/support-tax?utm_source=reddit',
    );
    expect(JSON.stringify(event)).not.toContain('v=3000');
    expect(event?.[2]?.traffic_source).toBe('reddit');
  });

  it('still tracks engagement when sessionStorage is unavailable', async () => {
    const analytics = await importAnalytics();
    const calls: GtagCall[] = [];
    vi.stubGlobal('window', {
      location: {
        origin: 'https://portfolio.example.com',
        pathname: '/systems/support-ticket-deflection/support-tax',
        search: '',
      },
      gtag: (...args: GtagCall) => calls.push(args),
      sessionStorage: {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
      },
    });

    analytics.trackCalculatorEngaged({ calculator: 'thirty_second' });
    const events = calls.filter((call) => call[0] === 'event');
    expect(events).toHaveLength(1);
    expect(events[0][2]?.traffic_source).toBe('none');
  });

  it('keeps static redaction and enrollment guards wired', async () => {
    const [analyticsSource, googleAnalyticsSource, prePushWorkflow] = await Promise.all([
      readFile(join(webRoot, 'src/lib/analytics.ts'), 'utf8'),
      readFile(join(webRoot, 'src/components/GoogleAnalytics.tsx'), 'utf8'),
      readFile(join(webRoot, '..', '.github/workflows/pre_push_audit.yml'), 'utf8'),
    ]);

    expect(analyticsSource).toContain(
      "replacement: '/systems/support-ticket-deflection/results/[requestId]'",
    );
    expect(analyticsSource).toContain("replacement: '/admin/intake/gap-report/[requestId]'");
    expect(analyticsSource).toContain('...currentAnalyticsPageParams()');
    expect(googleAnalyticsSource).toContain(
      "window.gtag('config', '${GOOGLE_ADS_ID}', { send_page_view: false });",
    );
    expect(googleAnalyticsSource).not.toContain("window.gtag('config', '${GOOGLE_ADS_ID}');");
    expect(prePushWorkflow).toContain('npm --prefix web run test:deflection-ga-path-redaction');
  });
});
