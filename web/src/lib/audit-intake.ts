import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { persistAuditIntakeRecord } from './audit-intake-database';

export type AuditIntakePayload = {
  fullName: string;
  workEmail: string;
  companyOrProjectUrl: string;
  roleAndDecisionScope: string;
  projectInterest: string;
  projectInterestLabel?: string;
  sourcePage?: string;
  sourcePageLabel?: string;
  sourceOffer?: string;
  sourceOfferLabel?: string;
  biggestBottleneck: string;
  automationDataSources: string;
  currentTechEcosystem?: string;
  desiredTimeline: string;
  desiredTimelineLabel?: string;
  securityRequirement: string;
  securityRequirementLabel?: string;
  deploymentConstraints?: string;
  roiGoal?: string;
  anticipatedInvestmentRange: string;
  anticipatedInvestmentRangeLabel?: string;
};

export type AuditIntakeRecord = AuditIntakePayload & {
  requestId: string;
  submittedAt: string;
};

export type AuditIntakeDelivery = 'database' | 'webhook' | 'atlas-crm-event' | 'email' | 'file';

const DEFAULT_AUDIT_FILE_PATH = '/tmp/atlas-portfolio-audit-requests.ndjson';
const PERSISTENT_DELIVERIES: AuditIntakeDelivery[] = [
  'database',
  'webhook',
  'atlas-crm-event',
  'file',
];

function hasPersistentDelivery(deliveries: AuditIntakeDelivery[]) {
  return deliveries.some((delivery) => PERSISTENT_DELIVERIES.includes(delivery));
}

function fileFallbackEnabled() {
  const explicit = process.env.AUDIT_INTAKE_ALLOW_FILE_FALLBACK?.trim().toLowerCase();
  if (explicit) {
    return explicit === '1' || explicit === 'true' || explicit === 'yes';
  }

  return process.env.NODE_ENV !== 'production';
}

function deriveCompanyName(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'Unknown company';
  }

  const urlCandidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  try {
    const { hostname } = new URL(urlCandidate);
    return hostname.replace(/^www\./, '') || trimmed;
  } catch {
    return trimmed;
  }
}

function parseRecipientList(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function writeLocalFallback(record: AuditIntakeRecord) {
  const filePath = process.env.AUDIT_INTAKE_FILE_PATH?.trim() || DEFAULT_AUDIT_FILE_PATH;
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

async function postAuditWebhook(url: string, record: AuditIntakeRecord) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to deliver this audit request to the intake webhook.');
  }
}

async function postAtlasCrmEvent(baseUrl: string, record: AuditIntakeRecord) {
  const endpoint = new URL('/api/v1/b2b/crm/events', baseUrl).toString();
  const authToken = process.env.AUDIT_INTAKE_ATLAS_AUTH_TOKEN?.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      crm_provider: 'generic',
      event_type: 'contact_updated',
      crm_event_id: record.requestId,
      company_name: deriveCompanyName(record.companyOrProjectUrl),
      contact_email: record.workEmail,
      contact_name: record.fullName,
      event_timestamp: record.submittedAt,
      event_data: {
        source: 'atlas-portfolio',
        intake_type: 'audit_request',
        ...record,
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail
        ? `Atlas CRM event delivery failed: ${detail.slice(0, 240)}`
        : 'Atlas CRM event delivery failed.'
    );
  }
}

function buildNotificationText(record: AuditIntakeRecord) {
  const routingContext = [
    record.sourcePage || record.sourcePageLabel
      ? `Source Page: ${record.sourcePageLabel || record.sourcePage}`
      : null,
    record.sourceOffer || record.sourceOfferLabel
      ? `Source Offer: ${record.sourceOfferLabel || record.sourceOffer}`
      : null,
  ].filter((item): item is string => Boolean(item));

  return [
    'New AI Systems Audit Request',
    `Request ID: ${record.requestId}`,
    `Submitted At: ${record.submittedAt}`,
    '',
    `Name: ${record.fullName}`,
    `Email: ${record.workEmail}`,
    `Company / Project URL: ${record.companyOrProjectUrl}`,
    `Role / Decision Scope: ${record.roleAndDecisionScope}`,
    `Primary Interest: ${record.projectInterestLabel || record.projectInterest}`,
    ...(routingContext.length > 0 ? ['', 'Routing Context', ...routingContext] : []),
    '',
    'Biggest Manual Bottleneck',
    record.biggestBottleneck || 'Not provided',
    '',
    'What They Want to Automate',
    record.automationDataSources || 'Not provided',
    '',
    `Current Tech Ecosystem: ${record.currentTechEcosystem || 'Not provided'}`,
    `Desired Timeline: ${record.desiredTimelineLabel || record.desiredTimeline}`,
    `Security Requirement: ${record.securityRequirementLabel || record.securityRequirement}`,
    '',
    'Deployment Constraints',
    record.deploymentConstraints || 'Not provided',
    '',
    `ROI Goal: ${record.roiGoal || 'Not provided'}`,
    `Budget Range: ${record.anticipatedInvestmentRangeLabel || record.anticipatedInvestmentRange}`,
  ].join('\n');
}

async function sendNotificationEmail(record: AuditIntakeRecord) {
  const resendApiKey =
    process.env.AUDIT_NOTIFICATION_RESEND_API_KEY?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.AUDIT_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL?.trim() ||
    process.env.ATLAS_EMAIL_DEFAULT_FROM?.trim();
  const toRecipients = parseRecipientList(process.env.AUDIT_NOTIFICATION_TO_EMAIL?.trim());

  if (!resendApiKey || !fromEmail || toRecipients.length === 0) {
    throw new Error('Audit notification email is not fully configured.');
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
      reply_to: record.workEmail,
      subject: `New audit request: ${record.fullName} (${deriveCompanyName(record.companyOrProjectUrl)})`,
      text: buildNotificationText(record),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail
        ? `Audit notification email failed: ${detail.slice(0, 240)}`
        : 'Audit notification email failed.'
    );
  }
}

export async function recordAuditIntake(payload: AuditIntakePayload) {
  const requestId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const record: AuditIntakeRecord = {
    requestId,
    submittedAt,
    ...payload,
  };

  const deliveries: AuditIntakeDelivery[] = [];
  const warnings: string[] = [];

  try {
    const persisted = await persistAuditIntakeRecord(record);
    if (persisted) {
      deliveries.push('database');
    }
  } catch (error) {
    // Database errors can include connection strings, schema names, host/user, and SQL
    // fragments. `warnings` is returned to the client by /api/audit, so surface only a
    // generic message and log the full error server-side for operator triage.
    console.error('Audit database persistence failed', error);
    warnings.push('Audit database persistence failed.');
  }

  const webhookUrl = process.env.AUDIT_INTAKE_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      await postAuditWebhook(webhookUrl, record);
      deliveries.push('webhook');
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Audit webhook delivery failed.');
    }
  }

  const atlasBaseUrl = process.env.AUDIT_INTAKE_ATLAS_BASE_URL?.trim();
  if (atlasBaseUrl) {
    try {
      await postAtlasCrmEvent(atlasBaseUrl, record);
      deliveries.push('atlas-crm-event');
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Atlas CRM event delivery failed.');
    }
  }

  const emailConfigured =
    process.env.AUDIT_NOTIFICATION_TO_EMAIL?.trim() ||
    process.env.AUDIT_NOTIFICATION_RESEND_API_KEY?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY?.trim() ||
    process.env.AUDIT_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL?.trim() ||
    process.env.ATLAS_EMAIL_DEFAULT_FROM?.trim();
  if (emailConfigured) {
    try {
      await sendNotificationEmail(record);
      deliveries.push('email');
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Audit notification email failed.');
    }
  }

  if (deliveries.length === 0 && !fileFallbackEnabled()) {
    throw new Error(
      'Audit intake is not configured for production delivery. Configure email notification, webhook, or Atlas CRM delivery.'
    );
  }

  if (deliveries.length === 0 || (warnings.length > 0 && fileFallbackEnabled())) {
    await writeLocalFallback(record);
    deliveries.push('file');
  }

  if (deliveries.length > 0 && !hasPersistentDelivery(deliveries)) {
    warnings.push(
      'Audit intake notification succeeded, but no persistent intake sink is configured. Configure AUDIT_INTAKE_DATABASE_URL, AUDIT_INTAKE_WEBHOOK_URL, or AUDIT_INTAKE_ATLAS_BASE_URL to store submissions outside the inbox.'
    );
  }

  return { requestId, deliveries, warnings };
}
