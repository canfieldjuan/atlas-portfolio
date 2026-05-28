'use client';

import { DeflectionLandingPage } from '@/components/landing/DeflectionLandingPage';
import { landingPageConfigV2 } from './landingConfig-v2';

export default function SupportTicketDeflectionPage() {
  return <DeflectionLandingPage config={landingPageConfigV2} bare />;
}
