# Buyer Qualification Checklist (Security + Compliance)

Last updated: April 27, 2026.

Use this in discovery before investing in deep solution design.

## Current posture (for accurate deal qualification)

- SOC 2 attestation is not currently active/published.
- Questionnaire support is available during sales (CAIQ/SIG style when required).
- Deployment model is project-scoped (cloud and local/on-prem patterns can be scoped to buyer requirements).
- Detailed trust artifacts are handled directly during security review and commercial discussions.

## Step 1: Identify the compliance gate

1. Is SOC 2 Type 2 mandatory before contract signature?
2. Will Type 1 plus a documented roadmap satisfy procurement for phase one?
3. Will questionnaire + evidence package satisfy interim assurance?
4. Are there hard deployment constraints (single-tenant, on-prem, data residency, customer-managed keys)?

## Step 2: Route the opportunity

### Route A: Fast-close lane (no immediate SOC 2 gate)

Proceed when all are true:

- SOC 2 Type 2 is not a hard contractual precondition.
- Buyer accepts questionnaire responses and architecture/control evidence.
- Timeline priority is implementation speed.

Execution guidance:

- Send architecture and data-flow package early.
- Complete required security questionnaires.
- Confirm access control, incident expectations, and shared responsibilities in writing.
- Keep scope narrow and delivery-focused.

### Route B: Enterprise lane (SOC 2-gated)

Proceed when all are true:

- SOC 2 requirement is mandatory in legal/procurement.
- Buyer accepts a staged compliance timeline and milestones.
- Expected deal value or strategic value justifies compliance spend.

Execution guidance:

- Set compliance milestones and dependencies in writing before late-stage pre-sales work.
- Define audit scope boundaries and control ownership early.
- Plan controls/readiness/audit sequencing with explicit dates.
- Attach compliance cost and timeline to account planning.

## Step 3: Economic qualification

Before committing to Route B, quantify:

1. Expected annual contract value and strategic value.
2. Compliance spend (internal + external).
3. Probability of close after compliance milestones.
4. Opportunity cost against non-SOC2-gated pipeline.

If expected return does not justify compliance cost, disqualify early.

## Step 4: Proposal language guardrails

- Do not claim certifications or attestations that are not currently active.
- Distinguish "controls in place" from "independent attestation complete."
- Keep claims scoped to current controls and contracted deliverables.
- Note interim evidence packages are not a replacement for an independent SOC report.
