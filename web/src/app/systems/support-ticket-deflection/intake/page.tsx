import { SupportTicketCsvIntakePage } from '@/components/landing/SupportTicketCsvIntakePage';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  resolveDeflectionPriceVariant,
} from '@/lib/deflection-pricing';
import {
  DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM,
  resolveIntakePriceVariantId,
} from '@/lib/deflection-partner-access';

type PageProps = {
  searchParams?: Promise<{ priceVariant?: string | string[]; partnerToken?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportTicketDeflectionIntakePage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  const partnerToken = firstParam(query?.[DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM]);
  const priceVariantId = resolveIntakePriceVariantId(
    firstParam(query?.priceVariant),
    partnerToken,
  );
  const priceVariant =
    resolveDeflectionPriceVariant(priceVariantId) ||
    DEFLECTION_DEFAULT_PRICE_VARIANT;
  const isPartner = priceVariant.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID;

  return (
    <SupportTicketCsvIntakePage
      copy={{
        backHref: isPartner
          ? '/systems/support-ticket-deflection/partner'
          : '/systems/support-ticket-deflection/snapshot',
        backLabel: isPartner ? 'Back to Deflection Report' : 'Back to Deflection Snapshot',
        sourcePage: isPartner
          ? '/systems/support-ticket-deflection/partner'
          : '/systems/support-ticket-deflection/snapshot',
        sourceOffer: 'support-ticket-deflection-intake',
        snapshotName: 'Deflection Snapshot',
        submitLabel: 'Upload my CSV, get my free Deflection Snapshot',
        priceVariantId: priceVariant.id,
        partnerAccessToken: isPartner ? partnerToken : undefined,
      }}
    />
  );
}
