# Plan: Deflection PII copy backed by scrubbing

Issue #325 deferred stronger intake privacy wording until the browser and
backend scrubbing contracts could support more than a local best-effort claim.
The browser path now privately uploads a scrubbed CSV, and the ATLAS report path
redacts supported PII patterns from generated Snapshot/report payloads, so the
public copy can name both layers without promising perfect removal.

## Why this slice exists

- The intake trust panel still says only `best-effort local scrubbing`, which
  undersells the current two-layer handling after backend report redaction
  landed.
- The Security page still describes only client-side PII controls, so buyers do
  not see the backend redaction boundary that now backs the Snapshot/report path.
- The privacy contract test should move from forbidding stronger language to
  guarding the stronger but still scoped claim.

## Scope (this PR)

Slice phase: Product polish

1. Reword the intake trust panel from local-only best-effort scrubbing to
   browser minimization of common contact identifiers in the CSV body plus
   backend redaction for supported patterns.
2. Update the support-ticket-deflection privacy FAQ with the same scoped
   two-layer language.
3. Update the Security page CSV data-safety section so it names browser
   minimization and backend report redaction while preserving the non-guarantee.
4. Update `test-deflection-csv-privacy-contract` to require the new supported-
   pattern claim and continue forbidding absolute PII/security promises.

### Files touched

- `web/plans/PR-Deflection-PII-Copy-Backed.md` - this plan contract.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - intake trust panel privacy copy.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` - public privacy FAQ copy.
- `web/src/app/security/page.tsx` - CSV data-safety section copy.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - privacy copy contract updates.

## Mechanism

- The intake card keeps the existing smoke marker and layout, but the PII row is
  now titled `Browser + backend PII controls` and says the browser minimizes
  common contact identifiers in the CSV body before upload while the backend
  redacts supported PII patterns from generated Snapshot/report outputs.
- The Security page mirrors that boundary in its short intro and the detailed
  PII card. It still states that this does not guarantee removal of every name,
  account number, or free-text identifier.
- The privacy contract continues to assert private Blob upload, fail-closed CSV
  decoding, generic scrubbed filename, retention wording, and forbidden
  overclaims. It now also asserts the backend-redaction phrasing on the intake,
  FAQ, and Security page.

## Intentional

- This does not claim all PII is removed, that no PII can appear, or that PII
  never leaves the browser. The browser layer is still scoped to common contact
  identifiers in the CSV body and the backend layer is scoped to supported PII
  patterns.
- This does not change upload mechanics, retention, cleanup, ATLAS submission,
  or backend scrubbing behavior; it aligns public copy to the implemented
  contract.
- This does not introduce named encryption architecture claims such as AES-256
  or VPC isolation on the intake card.

## Deferred

- Broader partner landing reframe remains deferred to the partner-specific lane.
- Any future expansion from supported-pattern redaction to an all-PII guarantee
  remains deferred until implementation and tests can prove that stronger
  contract.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-csv-privacy` - passed.
- `rg -n "Browser \\+ backend PII controls|common contact identifiers in the CSV body|backend redacts supported PII patterns|browser CSV minimization|backend redaction for supported report-output PII patterns" web/src web/scripts/test-deflection-csv-privacy-contract.mjs` - passed.
- `if rg -n "best-effort local scrubbing|best-effort CSV minimization|never make it into the report|No PII ever leaves your browser|all PII is removed|no PII can appear" web/src; then exit 1; else echo "no stale runtime PII overclaims"; fi` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Intake, FAQ, and Security copy | ~35 |
| Privacy contract test updates | ~35 |
| this plan doc | ~85 |
| **Total** | ~155 |
