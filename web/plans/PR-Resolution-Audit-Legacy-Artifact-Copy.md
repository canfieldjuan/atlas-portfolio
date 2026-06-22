# Plan: Resolution Audit legacy artifact copy

PR #361 aligned the structured paid report, but the legacy artifact fallback
still renders `FULL BACKLOG REPORT`, `Your complete Support Tax report is
ready.`, and `Paid report contents`. That fallback is only for older paid rows,
but it is still part of the paid results route.

## Why this slice exists

- Public paid result handoff should not regress to Backlog Report language when
  an older paid artifact lacks the structured report model.
- Partner legacy paid artifacts still need Deflection Report wording until the
  partner surface gets its own reframe.
- Hosted and paid-unlock smokes distinguish structured model pages from legacy
  artifact pages, so artifact copy needs its own markers rather than sharing the
  model dashboard labels.

## Scope (this PR)

Slice phase: Product polish

1. Add a small legacy artifact copy resolver keyed by `priceVariant`.
2. Pass the saved/requested price variant into `DeflectionReportArtifactPage`
   after an artifact is known to exist.
3. Rename public legacy artifact framing to full Resolution Audit language while
   keeping partner legacy artifact framing as full Deflection Report.
4. Update hosted-results, paid-unlock, and report-model tests/smokes so legacy
   artifact markers use `contents` labels and structured model markers keep
   `dashboard` labels.

### Files touched

- `web/plans/PR-Resolution-Audit-Legacy-Artifact-Copy.md` - this plan contract.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` - pass resolved price variant into the artifact fallback page.
- `web/src/components/landing/DeflectionReportArtifactPage.tsx` - variant-aware legacy artifact framing copy.
- `web/scripts/smoke-deflection-hosted-results.mjs` - hosted results artifact marker labels.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - hosted results artifact fixture labels.
- `web/scripts/smoke-deflection-paid-unlock.mjs` - paid unlock artifact marker labels.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - paid unlock artifact fixture and source assertions.
- `web/scripts/test-deflection-report-model-result-page.mjs` - route/source assertions for artifact price-variant pass-through.

## Mechanism

- The results route already confirms model/artifact/snapshot existence before
  enforcing price-variant spoofing. This slice reuses that helper for artifact
  fallback rendering after `getArtifact()` returns a real artifact.
- `DeflectionReportArtifactPage` derives its badge, headline, intro, and primer
  label from the resolved variant. Public/default copy says full Resolution
  Audit; partner copy says full Deflection Report.
- Legacy artifact smokes use `Full audit contents` / `Full report contents`,
  while structured model smokes keep `Full audit dashboard` / `Full report
  dashboard`. That keeps the smoke auto-detection deterministic.

## Intentional

- This does not touch the structured `DeflectionReportModelPage` behavior from
  PR #361.
- This does not rename internal `DeflectionReport*` types, route names, or ATLAS
  contract fields.
- This does not change checkout behavior, Stripe integration, privacy copy, or
  the partner landing-page offer.

## Deferred

- Partner landing-page reframe remains deferred to a partner-specific pass.
- PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed.
- `rg -n "FULL BACKLOG REPORT|Your complete Support Tax report is ready|Paid report contents|FULL RESOLUTION AUDIT|Your Resolution Audit is ready|Full audit contents|FULL DEFLECTION REPORT|Your Deflection Report is ready|Full report contents|Full audit dashboard|Full report dashboard" web/src/components/landing/DeflectionReportArtifactPage.tsx web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx web/scripts/smoke-deflection-hosted-results.mjs web/scripts/test-deflection-hosted-results-smoke.mjs web/scripts/smoke-deflection-paid-unlock.mjs web/scripts/test-deflection-paid-unlock-smoke.mjs web/scripts/test-deflection-report-model-result-page.mjs`
  - passed; public legacy artifact markers moved to Resolution Audit contents
    language, partner artifact markers remain Deflection Report contents
    language, and old Backlog Report artifact labels survive only as negative
    source assertions in the paid-unlock test.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Results route artifact pass-through | ~15 |
| Legacy artifact copy resolver | ~45 |
| Smoke and route test updates | ~90 |
| this plan doc | ~90 |
| **Total** | ~240 |
