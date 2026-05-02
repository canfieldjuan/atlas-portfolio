'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GA_MEASUREMENT_ID, trackPageView } from '@/lib/analytics';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const skippedInitialPageView = useRef(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (!skippedInitialPageView.current) {
      skippedInitialPageView.current = true;
      return;
    }

    trackPageView(`${pathname}${window.location.search}`);
  }, [pathname]);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
            window.gtag('js', new Date());
            window.gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}
