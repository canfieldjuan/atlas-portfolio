'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

// Routes rendered WITHOUT the global menu/footer — focused landing pages where
// the only intended paths off the page are the page's own CTAs. Exact-match so
// every sub-route (/intake, /calculator, /partner, ...) keeps the normal chrome.
const BARE_ROUTES = new Set<string>(['/systems/support-ticket-deflection']);

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalized = (pathname ?? '/').replace(/(.)\/+$/, '$1');
  const bare = BARE_ROUTES.has(normalized);

  return (
    <>
      {!bare && <Navigation />}
      {children}
      {!bare && <Footer />}
    </>
  );
}
