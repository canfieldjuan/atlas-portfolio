// Routes that hide global Navigation + Footer chrome to keep the buyer on-page.
// Per the landing-page framework: dedicated conversion pages should not offer
// escape hatches. Per-route opt-in (not opt-out) so it's hard to accidentally
// strip chrome from a page that needs it.

export const NO_CHROME_ROUTES = [
  '/systems/ai-content-ops',
] as const;

type NoChromeRoute = (typeof NO_CHROME_ROUTES)[number];

export function shouldHideChrome(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (NO_CHROME_ROUTES as readonly string[]).includes(pathname);
}

// Convenience re-exports for components that need the typed list.
export type { NoChromeRoute };
