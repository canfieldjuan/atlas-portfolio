import { neon } from '@neondatabase/serverless';
import type { AuditIntakeRecord } from './audit-intake';

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
