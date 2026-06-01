// Routes that hide global Navigation + Footer chrome to keep the buyer on-page.
// Per the landing-page framework: dedicated conversion pages should not offer
// escape hatches. Per-route opt-in (not opt-out) so it's hard to accidentally
// strip chrome from a page that needs it.

export const NO_CHROME_ROUTES = [
  '/systems/ai-content-ops',
  '/systems/support-ticket-deflection',
  '/systems/support-ticket-deflection/demo',
  '/systems/support-ticket-deflection/calculator',
  '/systems/support-ticket-deflection/support-tax',
  '/systems/support-ticket-deflection/intake',
  '/systems/support-ticket-deflection/partner',
] as const;

const NO_CHROME_PREFIXES = ['/systems/support-ticket-deflection/results/'] as const;

type NoChromeRoute = (typeof NO_CHROME_ROUTES)[number];

export function shouldHideChrome(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/(.)\/+$/, '$1');
  return (
    (NO_CHROME_ROUTES as readonly string[]).includes(normalized) ||
    NO_CHROME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
}

// Convenience re-exports for components that need the typed list.
export type { NoChromeRoute };
