import { persistGapReportSubmission } from './gap-report-intake-database';
import type { DeflectionSnapshot } from './deflection-snapshot';
import { createDeflectionSnapshotPdfAttachment } from './deflection-snapshot-pdf';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  type DeflectionPriceVariantId,
  resolveDeflectionPriceVariant,
} from './deflection-pricing';
import {
  DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM,
  hasDeflectionPartnerPriceAccessToken,
} from './deflection-partner-access';
import { SITE_URL } from './seo';

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

export const GAP_REPORT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanBlobToken(value: string | undefined) {
  const token = value?.trim();
  return token || undefined;
}

// New raw CSV uploads use the private-capable default Blob store only. If that
// token is missing, fail closed instead of falling through to the legacy public
// store.
export function gapReportBlobToken(): string | undefined {
  return cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN);
}

// The atlas-portfolio project previously wrote CSVs to a prefixed legacy Blob
// store. URL-based reads/deletes keep the ordered list so admin download, ATLAS
// submit, and retention cleanup can still reach legacy CSV blobs created before
// the private-store switch.
export function gapReportBlobTokens(): string[] {
  return [
    cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN),
    cleanBlobToken(process.env.ticke_deflection_blob_READ_WRITE_TOKEN),
  ].filter((token, index, tokens): token is string => Boolean(token) && tokens.indexOf(token) === index);
}

export type GapReportMetadata = {
  name: string;
  email: string;
  companyName: string;
  supportPlatform: SupportPlatform;
  csvFilename: string;
  csvSizeBytes?: number;
  sourcePage?: string;
  sourceOffer?: string;
  priceVariant?: DeflectionPriceVariantId;
};

// Shared validation for the direct-to-blob intake: the token route validates
// before minting an upload token, and the record route re-validates before
// persisting — one source of truth so the two routes can't drift.
export function parseGapReportMetadata(
  raw: unknown
): { ok: true; value: GapReportMetadata } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid submission metadata.' };
  }
  const m = raw as Record<string, unknown>;
  const name = typeof m.name === 'string' ? m.name.trim() : '';
  const email = typeof m.email === 'string' ? m.email.trim() : '';
  const companyName = typeof m.companyName === 'string' ? m.companyName.trim() : '';
  const csvFilename = typeof m.csvFilename === 'string' ? m.csvFilename.trim() : '';
  const priceVariant =
    typeof m.priceVariant === 'string'
      ? resolveDeflectionPriceVariant(m.priceVariant.trim())
      : undefined;
  if (!name) return { ok: false, error: 'Your name is required.' };
  if (!email || !GAP_REPORT_EMAIL_RE.test(email)) {
    return { ok: false, error: 'A valid work email is required.' };
  }
  if (!companyName) return { ok: false, error: 'Company name is required.' };
  if (!isSupportPlatform(m.supportPlatform)) {
    return { ok: false, error: 'Support platform is required.' };
  }
  if (!csvFilename.toLowerCase().endsWith('.csv')) {
    return { ok: false, error: 'A .csv file is required.' };
  }
  if (m.priceVariant !== undefined && !priceVariant) {
    return { ok: false, error: 'Invalid price variant.' };
  }
  if (
    priceVariant?.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID &&
    !hasDeflectionPartnerPriceAccessToken(m[DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM])
  ) {
    return { ok: false, error: 'Invalid partner price access token.' };
  }
  return {
    ok: true,
    value: {
      name,
      email,
      companyName,
      supportPlatform: m.supportPlatform,
      csvFilename,
      csvSizeBytes: typeof m.csvSizeBytes === 'number' ? m.csvSizeBytes : undefined,
      sourcePage: typeof m.sourcePage === 'string' ? m.sourcePage : undefined,
      sourceOffer: typeof m.sourceOffer === 'string' ? m.sourceOffer : undefined,
      priceVariant: priceVariant?.id,
    },
  };
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
  priceVariant?: DeflectionPriceVariantId;
  reportRequestId?: string;
};

export type GapReportSubmissionRecord = GapReportSubmissionInput & {
  requestId: string;
  submittedAt: string;
  notificationStatus: 'pending' | 'sent' | 'failed';
  notificationError?: string;
  snapshotEmailStatus?: 'pending' | 'sent' | 'failed';
  snapshotEmailError?: string;
  confirmationStatus?: 'pending' | 'sent' | 'failed';
  confirmationError?: string;
};

export type GapReportSubmissionResult = {
  requestId: string;
  status: 'submitted' | 'submitted_with_warnings';
  warnings: string[];
  persisted: boolean;
};

type GapReportSubmissionOptions = {
  requirePersistence?: boolean;
  snapshot?: DeflectionSnapshot;
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

const DEFLECTION_REPORT_REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

export function deflectionResultsPath(
  reportRequestId: string | undefined,
  priceVariant?: DeflectionPriceVariantId,
) {
  if (!reportRequestId || !DEFLECTION_REPORT_REQUEST_ID_RE.test(reportRequestId)) {
    return null;
  }
  const path = `/systems/support-ticket-deflection/results/${encodeURIComponent(reportRequestId)}`;
  if (!priceVariant || priceVariant === DEFLECTION_DEFAULT_PRICE_VARIANT_ID) return path;
  return `${path}?priceVariant=${encodeURIComponent(priceVariant)}`;
}

function deflectionResultsUrl(
  reportRequestId: string | undefined,
  priceVariant?: DeflectionPriceVariantId,
) {
  const path = deflectionResultsPath(reportRequestId, priceVariant);
  return path ? `${SITE_URL}${path}` : null;
}

function buildNotificationText(record: GapReportSubmissionRecord) {
  const offer = intakeOfferCopy(record.sourceOffer);
  const resultsUrl = deflectionResultsUrl(record.reportRequestId, record.priceVariant);

  return [
    offer.notificationHeading,
    '',
    `Request ID: ${record.requestId}`,
    ...(resultsUrl ? [`Report request ID: ${record.reportRequestId}`, `Results: ${resultsUrl}`] : []),
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
    `Private blob reference: ${record.csvBlobUrl}`,
    'Download: open /admin/intake and use the authenticated CSV link for this request.',
    '',
    offer.notificationFooter,
  ].join('\n');
}

function buildSnapshotEmailText(record: GapReportSubmissionRecord) {
  const firstName = record.name?.trim().split(/\s+/)[0] || '';
  const offer = intakeOfferCopy(record.sourceOffer);
  const resultsUrl = deflectionResultsUrl(record.reportRequestId, record.priceVariant);

  return [
    firstName ? `Hi ${firstName},` : 'Hi,',
    '',
    `We received your CSV for ${record.companyName}.`,
    ...(resultsUrl ? ['', `Your free ${offer.snapshotName} is ready:`, resultsUrl] : []),
    '',
    'What happens next:',
    '1. We review the support tickets you uploaded.',
    '2. We look for repeat questions and the words customers use when they get stuck.',
    resultsUrl
      ? `3. If we find more data issues, we will follow up at this email.`
      : `3. We send your free ${offer.snapshotName} to this email as soon as processing finishes.`,
    ...(resultsUrl
      ? [
          '',
          'Tip: save this email or bookmark your results link if you might come back later. Your CSV is held for 30 days, so you can upgrade to the full report during that window without re-uploading.',
        ]
      : []),
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

async function sendSnapshotEmail(record: GapReportSubmissionRecord, snapshot?: DeflectionSnapshot) {
  const { resendApiKey, fromEmail } = emailConfig();

  if (!resendApiKey || !fromEmail) {
    throw new Error('Gap Report snapshot email is not fully configured.');
  }

  const resultsUrl = deflectionResultsUrl(record.reportRequestId, record.priceVariant);
  const attachment = snapshot
    ? createDeflectionSnapshotPdfAttachment({
        snapshot,
        companyName: record.companyName,
        resultsUrl,
      })
    : null;
  const payload = {
    from: fromEmail,
    to: [record.email],
    subject: intakeOfferCopy(record.sourceOffer).customerSubject,
    text: buildSnapshotEmailText(record),
    ...(attachment ? { attachments: [attachment] } : {}),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail
        ? `Gap Report snapshot email failed: ${detail.slice(0, 240)}`
        : 'Gap Report snapshot email failed.'
    );
  }
}

async function persistGapReportRecord(record: GapReportSubmissionRecord) {
  try {
    const persisted = await persistGapReportSubmission(record);
    if (persisted) {
      return { persisted: true as const, warning: '' };
    }
    return {
      persisted: false as const,
      warning:
        'Gap Report database persistence not configured. CSV blob URL is saved in the notification email; configure GAP_REPORT_DATABASE_URL or POSTGRES_URL for durable storage.',
    };
  } catch (error) {
    return {
      persisted: false as const,
      warning:
        error instanceof Error
          ? `Gap Report database persistence failed: ${error.message.slice(0, 240)}`
          : 'Gap Report database persistence failed.',
    };
  }
}

export async function recordGapReportSubmission(
  input: GapReportSubmissionInput,
  options: GapReportSubmissionOptions = {},
): Promise<GapReportSubmissionResult> {
  const requestId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const warnings: string[] = [];
  const requirePersistence = options.requirePersistence === true;

  let notificationStatus: 'sent' | 'failed' | 'pending' = 'pending';
  let notificationError: string | undefined;
  let snapshotEmailStatus: 'sent' | 'failed' | 'pending' = 'pending';
  let snapshotEmailError: string | undefined;

  const pendingRecord: GapReportSubmissionRecord = {
    ...input,
    requestId,
    submittedAt,
    notificationStatus: 'pending',
    snapshotEmailStatus: 'pending',
    confirmationStatus: 'pending',
  };

  let persisted = false;
  if (requirePersistence) {
    const initialPersistence = await persistGapReportRecord(pendingRecord);
    persisted = initialPersistence.persisted;
    if (!persisted) {
      warnings.push(initialPersistence.warning);
      return {
        requestId,
        status: 'submitted_with_warnings',
        warnings,
        persisted,
      };
    }
  }

  try {
    await sendNotificationEmail(pendingRecord);
    notificationStatus = 'sent';
  } catch (error) {
    notificationStatus = 'failed';
    notificationError = error instanceof Error ? error.message : String(error);
    warnings.push('Gap Report notification email failed.');
  }

  try {
    await sendSnapshotEmail(pendingRecord, options.snapshot);
    snapshotEmailStatus = 'sent';
  } catch (error) {
    snapshotEmailStatus = 'failed';
    snapshotEmailError = error instanceof Error ? error.message : String(error);
    warnings.push('Gap Report snapshot email failed.');
  }

  const record: GapReportSubmissionRecord = {
    ...input,
    requestId,
    submittedAt,
    notificationStatus,
    notificationError,
    snapshotEmailStatus,
    snapshotEmailError,
    confirmationStatus: snapshotEmailStatus,
    confirmationError: snapshotEmailError,
  };

  const finalPersistence = await persistGapReportRecord(record);
  if (finalPersistence.persisted) {
    persisted = true;
  } else {
    warnings.push(finalPersistence.warning);
  }

  return {
    requestId,
    status: warnings.length > 0 ? 'submitted_with_warnings' : 'submitted',
    warnings,
    persisted,
  };
}
