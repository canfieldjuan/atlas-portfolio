'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { shouldHideChrome } from '@/lib/no-chrome-routes';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = shouldHideChrome(pathname);

  return (
    <>
      {!bare && <Navigation />}
      {children}
      {!bare && <Footer />}
    </>
  );
}
