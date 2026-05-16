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
};

export type GapReportSubmissionResult = {
  requestId: string;
  status: 'submitted' | 'submitted_with_warnings';
  warnings: string[];
};

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
  return [
    'New Gap Report CSV submission',
    '',
    `Request ID: ${record.requestId}`,
    `Submitted: ${record.submittedAt}`,
    '',
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
    '— Atlas Portfolio (Gap Report intake)',
  ].join('\n');
}

async function sendNotificationEmail(record: GapReportSubmissionRecord) {
  const resendApiKey =
    process.env.GAP_REPORT_NOTIFICATION_RESEND_API_KEY?.trim() ||
    process.env.AUDIT_NOTIFICATION_RESEND_API_KEY?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.GAP_REPORT_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.AUDIT_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL?.trim() ||
    process.env.ATLAS_EMAIL_DEFAULT_FROM?.trim();
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
      subject: `New Gap Report CSV: ${record.companyName} (${record.email})`,
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

export async function recordGapReportSubmission(
  input: GapReportSubmissionInput
): Promise<GapReportSubmissionResult> {
  const requestId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const warnings: string[] = [];

  let notificationStatus: 'sent' | 'failed' | 'pending' = 'pending';
  let notificationError: string | undefined;

  try {
    await sendNotificationEmail({
      ...input,
      requestId,
      submittedAt,
      notificationStatus: 'pending',
    });
    notificationStatus = 'sent';
  } catch (error) {
    notificationStatus = 'failed';
    notificationError = error instanceof Error ? error.message : String(error);
    warnings.push('Gap Report notification email failed.');
  }

  const record: GapReportSubmissionRecord = {
    ...input,
    requestId,
    submittedAt,
    notificationStatus,
    notificationError,
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
