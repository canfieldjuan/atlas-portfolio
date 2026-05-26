'use client';

import { DiagnosticReportLandingPage } from '@/components/landing/DiagnosticReportLandingPage';
import { landingPageConfig } from './landingConfig';

export default function AiContentOpsPage() {
  return <DiagnosticReportLandingPage config={landingPageConfig} />;
}
