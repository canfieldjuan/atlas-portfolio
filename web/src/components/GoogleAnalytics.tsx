'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID, trackPageView } from '@/lib/analytics';
import { stripSupportTaxShareParams } from '@/lib/support-tax-share-state';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pagePath = useMemo(() => {
    if (!pathname) {
      return '';
    }

    // Calculator share-state params are UI state, not navigation: stripping
    // them keeps slider movement from registering page views while utm_*
    // params stay in the tracked path.
    const query = stripSupportTaxShareParams(pathname, searchParams.toString());
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!pagePath) {
      return;
    }

    trackPageView(pagePath);
  }, [pagePath]);

  if (!GA_MEASUREMENT_ID && !GOOGLE_ADS_ID) {
    return null;
  }

  // gtag.js is one library; loading it with any product ID lets us add
  // additional gtag('config', ...) calls for other product IDs (Ads, etc.).
  const gtagLoaderId = GA_MEASUREMENT_ID || GOOGLE_ADS_ID;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagLoaderId}`}
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
            ${GA_MEASUREMENT_ID ? `window.gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });` : ''}
            ${GOOGLE_ADS_ID ? `window.gtag('config', '${GOOGLE_ADS_ID}', { send_page_view: false });` : ''}
          `,
        }}
      />
    </>
  );
}
