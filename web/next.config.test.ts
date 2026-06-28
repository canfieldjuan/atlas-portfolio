import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

describe('legacy deflection results redirects', () => {
  it('keeps the retired FAQ-deflection result route pointed at the canonical result route', async () => {
    expect(typeof nextConfig.redirects).toBe('function');

    const redirects = await nextConfig.redirects();
    expect(Array.isArray(redirects)).toBe(true);

    const legacyResultsRedirect = redirects.find(
      (redirect) => redirect.source === '/services/faq-deflection/results/:requestId',
    );
    expect(legacyResultsRedirect).toEqual({
      source: '/services/faq-deflection/results/:requestId',
      destination: '/systems/support-ticket-deflection/results/:requestId',
      permanent: true,
    });

    const duplicateLegacyResultsRedirects = redirects.filter(
      (redirect) => redirect.source === '/services/faq-deflection/results/:requestId',
    );
    expect(duplicateLegacyResultsRedirects).toHaveLength(1);

    expect(
      redirects.some(
        (redirect) =>
          redirect.destination === '/systems/support-ticket-deflection/results/:requestId' &&
          redirect.source !== '/services/faq-deflection/results/:requestId',
      ),
    ).toBe(false);
  });
});
