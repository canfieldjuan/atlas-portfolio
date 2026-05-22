import { SupportTicketCsvIntakePage } from '@/components/landing/SupportTicketCsvIntakePage';

export default function AiContentOpsIntakePage() {
  return (
    <SupportTicketCsvIntakePage
      copy={{
        backHref: '/systems/ai-content-ops',
        backLabel: 'Back to FAQ Report',
        sourcePage: '/systems/ai-content-ops',
        sourceOffer: 'gap-report-intake',
        snapshotName: 'FAQ Snapshot',
        sampleOutputLabel: 'one sample FAQ entry',
        submitLabel: 'Upload CSV — get your free FAQ Snapshot',
      }}
    />
  );
}
