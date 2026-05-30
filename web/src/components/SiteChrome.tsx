'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

// Routes rendered WITHOUT the global menu/footer — focused landing/conversion
// pages where the only intended paths off the page are the page's own CTAs.
// Exact-match so unrelated sub-routes (/intake, /calculator, /partner, ...) keep
// the normal chrome.
const BARE_ROUTES = new Set<string>(['/systems/support-ticket-deflection']);

// Prefixes whose entire subtree is bare — the per-request results pages.
const BARE_PREFIXES = ['/systems/support-ticket-deflection/results/'];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalized = (pathname ?? '/').replace(/(.)\/+$/, '$1');
  const bare =
    BARE_ROUTES.has(normalized) ||
    BARE_PREFIXES.some((prefix) => normalized.startsWith(prefix));

  return (
    <>
      {!bare && <Navigation />}
      {children}
      {!bare && <Footer />}
    </>
  );
}
