import { hasDeflectionPartnerPriceAccessToken } from '@/lib/deflection-partner-access';
import { PartnerDeflectionLandingClient } from './PartnerDeflectionLandingClient';

type PageProps = {
  searchParams?: Promise<{ partnerToken?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportTicketDeflectionPartnerPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  const token = firstParam(query?.partnerToken);
  const hasPartnerAccess = hasDeflectionPartnerPriceAccessToken(token);
  return (
    <PartnerDeflectionLandingClient
      hasPartnerAccess={hasPartnerAccess}
      partnerToken={hasPartnerAccess ? token : undefined}
    />
  );
}
