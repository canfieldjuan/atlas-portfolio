import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { AuditIntakeRecord } from './audit-intake';

type AuditIntakeSql = NeonQueryFunction<false, false>;

export type AuditIntakeSummaryRow = {
  requestId: string;
  submittedAt: string;
  fullName: string;
  workEmail: string;
  companyOrProjectUrl: string;
  roleAndDecisionScope: string;
  projectInterest: string;
  projectInterestLabel: string | null;
  sourcePage: string | null;
  sourcePageLabel: string | null;
  sourceOffer: string | null;
  sourceOfferLabel: string | null;
  biggestBottleneck: string;
  automationDataSources: string;
  currentTechEcosystem: string | null;
  desiredTimeline: string;
  desiredTimelineLabel: string | null;
  securityRequirement: string;
  securityRequirementLabel: string | null;
  deploymentConstraints: string | null;
  roiGoal: string | null;
  anticipatedInvestmentRange: string;
  anticipatedInvestmentRangeLabel: string | null;
};

function auditIntakeDatabaseUrl() {
  // Vercel's Neon/Postgres integration injects POSTGRES_URL by default, so falling
  // back to it lets persistence work on Vercel without a separate env-var alias.
  return (
    process.env.AUDIT_INTAKE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ''
  );
}

// Cache the Neon client per database URL across requests + Next dev HMR. Without
// this each persist/list call constructs a fresh client, which is wasted work in
// serverless and causes connection churn under load. globalThis is the right scope
// because Next dev HMR replaces the module but keeps globals. The cache value is
// kept loosely typed because neon()'s generic signature does not survive a
// Map<string, ...> round-trip; the call sites get the narrowed type back.
const neonClientGlobalKey = Symbol.for('atlas-portfolio.audit-intake.neon-clients');
type NeonClientCache = Map<string, unknown>;
const globalScope = globalThis as unknown as { [neonClientGlobalKey]?: NeonClientCache };
function neonClientCache(): NeonClientCache {
  if (!globalScope[neonClientGlobalKey]) {
    globalScope[neonClientGlobalKey] = new Map();
  }
  return globalScope[neonClientGlobalKey];
}

function getAuditIntakeSql(): AuditIntakeSql | null {
  const databaseUrl = auditIntakeDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  const cache = neonClientCache();
  const cached = cache.get(databaseUrl);
  if (cached) {
    return cached as AuditIntakeSql;
  }
  const client: AuditIntakeSql = neon(databaseUrl);
  cache.set(databaseUrl, client);
  return client;
}

export function auditIntakeDatabaseConfigured() {
  return auditIntakeDatabaseUrl().length > 0;
}

export async function persistAuditIntakeRecord(record: AuditIntakeRecord) {
  const sql = getAuditIntakeSql();
  if (!sql) {
    return false;
  }

  await sql.query(
    `
      INSERT INTO portfolio_audit_requests (
        request_id,
        submitted_at,
        full_name,
        work_email,
        company_or_project_url,
        role_and_decision_scope,
        project_interest,
        project_interest_label,
        source_page,
        source_page_label,
        source_offer,
        source_offer_label,
        biggest_bottleneck,
        automation_data_sources,
        current_tech_ecosystem,
        desired_timeline,
        desired_timeline_label,
        security_requirement,
        security_requirement_label,
        deployment_constraints,
        roi_goal,
        anticipated_investment_range,
        anticipated_investment_range_label,
        payload
      )
      VALUES (
        $1::uuid,
        $2::timestamptz,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24::jsonb
      )
      ON CONFLICT (request_id) DO NOTHING
    `,
    [
      record.requestId,
      record.submittedAt,
      record.fullName,
      record.workEmail,
      record.companyOrProjectUrl,
      record.roleAndDecisionScope,
      record.projectInterest,
      record.projectInterestLabel || null,
      record.sourcePage || null,
      record.sourcePageLabel || null,
      record.sourceOffer || null,
      record.sourceOfferLabel || null,
      record.biggestBottleneck,
      record.automationDataSources,
      record.currentTechEcosystem || null,
      record.desiredTimeline,
      record.desiredTimelineLabel || null,
      // Discovery-flow submissions don't collect security/budget fields (those
      // columns are NOT NULL in the table schema). Default to '' so the INSERT
      // succeeds; admin UI's label() helper renders '' as 'Not provided'.
      record.securityRequirement || '',
      record.securityRequirementLabel || null,
      record.deploymentConstraints || null,
      record.roiGoal || null,
      record.anticipatedInvestmentRange || '',
      record.anticipatedInvestmentRangeLabel || null,
      JSON.stringify(record),
    ]
  );

  return true;
}

export async function listAuditIntakeRecords(limit = 50): Promise<AuditIntakeSummaryRow[]> {
  const sql = getAuditIntakeSql();
  if (!sql) {
    return [];
  }

  const boundedLimit = Math.max(1, Math.min(limit, 100));
  // Format submitted_at explicitly as ISO-8601 in UTC. The bare `::text` cast
  // emits whatever the database session's `DateStyle` is set to, which makes
  // `new Date(value)` in the admin UI sensitive to Postgres locale settings.
  const rows = await sql.query(
    `
      SELECT
        request_id::text AS request_id,
        to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS submitted_at,
        full_name,
        work_email,
        company_or_project_url,
        role_and_decision_scope,
        project_interest,
        project_interest_label,
        source_page,
        source_page_label,
        source_offer,
        source_offer_label,
        biggest_bottleneck,
        automation_data_sources,
        current_tech_ecosystem,
        desired_timeline,
        desired_timeline_label,
        security_requirement,
        security_requirement_label,
        deployment_constraints,
        roi_goal,
        anticipated_investment_range,
        anticipated_investment_range_label
      FROM portfolio_audit_requests
      ORDER BY submitted_at DESC
      LIMIT $1
    `,
    [boundedLimit]
  );

  return rows.map((row) => ({
    requestId: String(row.request_id),
    submittedAt: String(row.submitted_at),
    fullName: String(row.full_name),
    workEmail: String(row.work_email),
    companyOrProjectUrl: String(row.company_or_project_url),
    roleAndDecisionScope: String(row.role_and_decision_scope),
    projectInterest: String(row.project_interest),
    projectInterestLabel:
      typeof row.project_interest_label === 'string' ? row.project_interest_label : null,
    sourcePage: typeof row.source_page === 'string' ? row.source_page : null,
    sourcePageLabel: typeof row.source_page_label === 'string' ? row.source_page_label : null,
    sourceOffer: typeof row.source_offer === 'string' ? row.source_offer : null,
    sourceOfferLabel: typeof row.source_offer_label === 'string' ? row.source_offer_label : null,
    biggestBottleneck: String(row.biggest_bottleneck),
    automationDataSources: String(row.automation_data_sources),
    currentTechEcosystem:
      typeof row.current_tech_ecosystem === 'string' ? row.current_tech_ecosystem : null,
    desiredTimeline: String(row.desired_timeline),
    desiredTimelineLabel:
      typeof row.desired_timeline_label === 'string' ? row.desired_timeline_label : null,
    securityRequirement: String(row.security_requirement),
    securityRequirementLabel:
      typeof row.security_requirement_label === 'string' ? row.security_requirement_label : null,
    deploymentConstraints:
      typeof row.deployment_constraints === 'string' ? row.deployment_constraints : null,
    roiGoal: typeof row.roi_goal === 'string' ? row.roi_goal : null,
    anticipatedInvestmentRange: String(row.anticipated_investment_range),
    anticipatedInvestmentRangeLabel:
      typeof row.anticipated_investment_range_label === 'string'
        ? row.anticipated_investment_range_label
        : null,
  }));
}
