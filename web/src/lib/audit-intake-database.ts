import { Pool, type PoolConfig } from 'pg';
import type { AuditIntakeRecord } from './audit-intake';

type GlobalWithAuditIntakePool = typeof globalThis & {
  __auditIntakePool?: Pool;
};

function auditIntakeDatabaseUrl() {
  return (
    process.env.AUDIT_INTAKE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ''
  );
}

function auditIntakeDatabaseSsl(databaseUrl: string): PoolConfig['ssl'] {
  const explicit = process.env.AUDIT_INTAKE_DATABASE_SSL?.trim().toLowerCase();
  if (explicit === 'false' || explicit === '0' || explicit === 'no') {
    return false;
  }

  if (
    explicit === 'true' ||
    explicit === '1' ||
    explicit === 'yes' ||
    databaseUrl.includes('sslmode=require')
  ) {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

function getAuditIntakePool() {
  const databaseUrl = auditIntakeDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  const globalForPool = globalThis as GlobalWithAuditIntakePool;
  if (!globalForPool.__auditIntakePool) {
    globalForPool.__auditIntakePool = new Pool({
      connectionString: databaseUrl,
      max: 3,
      ssl: auditIntakeDatabaseSsl(databaseUrl),
    });
  }

  return globalForPool.__auditIntakePool;
}

export async function persistAuditIntakeRecord(record: AuditIntakeRecord) {
  const pool = getAuditIntakePool();
  if (!pool) {
    return false;
  }

  await pool.query(
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
