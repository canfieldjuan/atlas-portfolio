import { SupportTicketCsvIntakePage } from '@/components/landing/SupportTicketCsvIntakePage';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  resolveDeflectionPriceVariant,
} from '@/lib/deflection-pricing';

type PageProps = {
  searchParams?: Promise<{ priceVariant?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportTicketDeflectionIntakePage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  const priceVariant =
    resolveDeflectionPriceVariant(firstParam(query?.priceVariant)) ||
    DEFLECTION_DEFAULT_PRICE_VARIANT;
  const isPartner = priceVariant.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID;

  return (
    <SupportTicketCsvIntakePage
      copy={{
        backHref: isPartner
          ? '/systems/support-ticket-deflection/partner'
          : '/systems/support-ticket-deflection',
        backLabel: 'Back to Deflection Report',
        sourcePage: isPartner
          ? '/systems/support-ticket-deflection/partner'
          : '/systems/support-ticket-deflection',
        sourceOffer: 'support-ticket-deflection-intake',
        snapshotName: 'Deflection Snapshot',
        submitLabel: 'Upload CSV, get your free Deflection Snapshot',
        priceVariantId: priceVariant.id,
      }}
    />
  );
}
