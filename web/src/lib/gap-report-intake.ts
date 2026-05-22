import { persistGapReportSubmission } from './gap-report-intake-database';

const SUPPORT_PLATFORMS = [
  'zendesk',
  'intercom',
  'freshdesk',
  'helpscout',
  'other',
] as const;

export type SupportPlatform = (typeof SUPPORT_PLATFORMS)[number];

export function isSupportPlatform(value: unknown): value is SupportPlatform {
  return typeof value === 'string' && (SUPPORT_PLATFORMS as readonly string[]).includes(value);
}

export const SUPPORT_PLATFORM_LABEL: Record<SupportPlatform, string> = {
  zendesk: 'Zendesk',
  intercom: 'Intercom',
  freshdesk: 'Freshdesk',
  helpscout: 'HelpScout',
  other: 'Other',
};

export const SUPPORT_PLATFORM_OPTIONS: { value: SupportPlatform; label: string }[] = [
  { value: 'zendesk', label: SUPPORT_PLATFORM_LABEL.zendesk },
  { value: 'intercom', label: SUPPORT_PLATFORM_LABEL.intercom },
  { value: 'freshdesk', label: SUPPORT_PLATFORM_LABEL.freshdesk },
  { value: 'helpscout', label: SUPPORT_PLATFORM_LABEL.helpscout },
  { value: 'other', label: SUPPORT_PLATFORM_LABEL.other },
];

export type GapReportSubmissionInput = {
  name?: string;
  email: string;
  companyName: string;
  supportPlatform?: SupportPlatform;
  csvBlobUrl: string;
  csvFilename: string;
  csvSizeBytes?: number;
  sourcePage?: string;
  sourceOffer?: string;
};

export type GapReportSubmissionRecord = GapReportSubmissionInput & {
  requestId: string;
  submittedAt: string;
  notificationStatus: 'pending' | 'sent' | 'failed';
  notificationError?: string;
  confirmationStatus?: 'pending' | 'sent' | 'failed';
  confirmationError?: string;
};

export type GapReportSubmissionResult = {
  requestId: string;
  status: 'submitted' | 'submitted_with_warnings';
  warnings: string[];
};

type IntakeOfferCopy = {
  notificationHeading: string;
  notificationFooter: string;
  notificationSubjectPrefix: string;
  customerSubject: string;
  snapshotName: string;
};

const FAQ_REPORT_OFFER_COPY: IntakeOfferCopy = {
  notificationHeading: 'New FAQ Report CSV submission',
  notificationFooter: '— Atlas Portfolio (FAQ Report intake)',
  notificationSubjectPrefix: 'New FAQ Report CSV',
  customerSubject: 'We received your FAQ Report CSV',
  snapshotName: 'FAQ Snapshot',
};

const SUPPORT_DEFLECTION_OFFER_COPY: IntakeOfferCopy = {
  notificationHeading: 'New Support Ticket Deflection Report CSV submission',
  notificationFooter: '— Atlas Portfolio (Support Ticket Deflection Report intake)',
  notificationSubjectPrefix: 'New Deflection Report CSV',
  customerSubject: 'We received your Deflection Report CSV',
  snapshotName: 'Deflection Snapshot',
};

function intakeOfferCopy(sourceOffer: string | undefined): IntakeOfferCopy {
  if (sourceOffer === 'support-ticket-deflection-intake') {
    return SUPPORT_DEFLECTION_OFFER_COPY;
  }

  return FAQ_REPORT_OFFER_COPY;
}

function parseRecipientList(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatBytes(bytes: number | undefined) {
  if (!bytes || bytes <= 0) return 'unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildNotificationText(record: GapReportSubmissionRecord) {
  const offer = intakeOfferCopy(record.sourceOffer);

  return [
    offer.notificationHeading,
    '',
    `Request ID: ${record.requestId}`,
    `Submitted: ${record.submittedAt}`,
    '',
    `Name: ${record.name || 'Not provided'}`,
    `Company: ${record.companyName}`,
    `Email: ${record.email}`,
    `Support platform: ${record.supportPlatform ? SUPPORT_PLATFORM_LABEL[record.supportPlatform] : 'Not specified'}`,
    `Source: ${record.sourcePage || 'direct'} (offer: ${record.sourceOffer || 'none'})`,
    '',
    'CSV',
    `Filename: ${record.csvFilename}`,
    `Size: ${formatBytes(record.csvSizeBytes)}`,
    `Download: ${record.csvBlobUrl}`,
    '',
    offer.notificationFooter,
  ].join('\n');
}

function buildCustomerConfirmationText(record: GapReportSubmissionRecord) {
  const firstName = record.name?.trim().split(/\s+/)[0] || '';
  const offer = intakeOfferCopy(record.sourceOffer);

  return [
    firstName ? `Hi ${firstName},` : 'Hi,',
    '',
    `We received your CSV for ${record.companyName}.`,
    '',
    'What happens next:',
    '1. We review the support tickets you uploaded.',
    '2. We look for repeat questions and the words customers use when they get stuck.',
    `3. We send your free ${offer.snapshotName} to this email within 24 hours.`,
    '',
    'No next step is needed from you right now.',
    '',
    `Reference ID: ${record.requestId}`,
    '',
    'Privacy: we delete the uploaded CSV and submission record after 30 days. No model training, no third-party sharing, no fine-tuning.',
    '',
    '— Atlas Portfolio',
  ].join('\n');
}

function emailConfig() {
  const resendApiKey =
    process.env.GAP_REPORT_NOTIFICATION_RESEND_API_KEY?.trim() ||
    process.env.AUDIT_NOTIFICATION_RESEND_API_KEY?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.GAP_REPORT_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.AUDIT_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL?.trim() ||
    process.env.ATLAS_EMAIL_DEFAULT_FROM?.trim();

  return { resendApiKey, fromEmail };
}

async function sendNotificationEmail(record: GapReportSubmissionRecord) {
  const { resendApiKey, fromEmail } = emailConfig();
  const toRecipients = parseRecipientList(
    process.env.GAP_REPORT_NOTIFICATION_TO_EMAIL?.trim() ||
      process.env.AUDIT_NOTIFICATION_TO_EMAIL?.trim()
  );

  if (!resendApiKey || !fromEmail || toRecipients.length === 0) {
    throw new Error('Gap Report notification email is not fully configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toRecipients,
      reply_to: record.email,
      subject: `${intakeOfferCopy(record.sourceOffer).notificationSubjectPrefix}: ${record.companyName} (${record.email})`,
      text: buildNotificationText(record),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail
        ? `Gap Report notification email failed: ${detail.slice(0, 240)}`
        : 'Gap Report notification email failed.'
    );
  }
}

async function sendCustomerConfirmationEmail(record: GapReportSubmissionRecord) {
  const { resendApiKey, fromEmail } = emailConfig();

  if (!resendApiKey || !fromEmail) {
    throw new Error('Gap Report customer confirmation email is not fully configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [record.email],
      subject: intakeOfferCopy(record.sourceOffer).customerSubject,
      text: buildCustomerConfirmationText(record),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail
        ? `Gap Report customer confirmation email failed: ${detail.slice(0, 240)}`
        : 'Gap Report customer confirmation email failed.'
    );
  }
}

export async function recordGapReportSubmission(
  input: GapReportSubmissionInput
): Promise<GapReportSubmissionResult> {
  const requestId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const warnings: string[] = [];

  let notificationStatus: 'sent' | 'failed' | 'pending' = 'pending';
  let notificationError: string | undefined;
  let confirmationStatus: 'sent' | 'failed' | 'pending' = 'pending';
  let confirmationError: string | undefined;

  const pendingRecord: GapReportSubmissionRecord = {
    ...input,
    requestId,
    submittedAt,
    notificationStatus: 'pending',
    confirmationStatus: 'pending',
  };

  try {
    await sendNotificationEmail(pendingRecord);
    notificationStatus = 'sent';
  } catch (error) {
    notificationStatus = 'failed';
    notificationError = error instanceof Error ? error.message : String(error);
    warnings.push('Gap Report notification email failed.');
  }

  try {
    await sendCustomerConfirmationEmail(pendingRecord);
    confirmationStatus = 'sent';
  } catch (error) {
    confirmationStatus = 'failed';
    confirmationError = error instanceof Error ? error.message : String(error);
    warnings.push('Gap Report customer confirmation email failed.');
  }

  const record: GapReportSubmissionRecord = {
    ...input,
    requestId,
    submittedAt,
    notificationStatus,
    notificationError,
    confirmationStatus,
    confirmationError,
  };

  try {
    const persisted = await persistGapReportSubmission(record);
    if (!persisted) {
      warnings.push(
        'Gap Report database persistence not configured. CSV blob URL is saved in the notification email; configure GAP_REPORT_DATABASE_URL or POSTGRES_URL for durable storage.'
      );
    }
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `Gap Report database persistence failed: ${error.message.slice(0, 240)}`
        : 'Gap Report database persistence failed.'
    );
  }

  return {
    requestId,
    status: warnings.length > 0 ? 'submitted_with_warnings' : 'submitted',
    warnings,
  };
}
