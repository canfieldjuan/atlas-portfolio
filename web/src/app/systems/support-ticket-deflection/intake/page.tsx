import { SupportTicketCsvIntakePage } from '@/components/landing/SupportTicketCsvIntakePage';

export default function SupportTicketDeflectionIntakePage() {
  return (
    <SupportTicketCsvIntakePage
      copy={{
        backHref: '/systems/support-ticket-deflection',
        backLabel: 'Back to Deflection Report',
        sourcePage: '/systems/support-ticket-deflection',
        sourceOffer: 'support-ticket-deflection-intake',
        snapshotName: 'Deflection Snapshot',
        sampleOutputLabel: 'one sample self-service answer',
        submitLabel: 'Upload CSV — get your free Deflection Snapshot',
      }}
    />
  );
}
