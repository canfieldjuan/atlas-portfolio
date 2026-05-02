import { neon } from '@neondatabase/serverless';
import type { AuditIntakeRecord } from './audit-intake';

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
  return (
    process.env.AUDIT_INTAKE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ''
  );
}

function getAuditIntakeSql() {
  const databaseUrl = auditIntakeDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  return neon(databaseUrl);
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
      record.securityRequirement,
      record.securityRequirementLabel || null,
      record.deploymentConstraints || null,
      record.roiGoal || null,
      record.anticipatedInvestmentRange,
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
  const rows = await sql.query(
    `
      SELECT
        request_id::text AS request_id,
        submitted_at::text AS submitted_at,
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
