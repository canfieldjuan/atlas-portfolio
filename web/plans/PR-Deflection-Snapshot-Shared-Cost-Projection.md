## Why this slice exists

#245 is partly closed by the shared row renderer, but the `/snapshot` page still
has a bespoke fixed cost band while the real results page uses an interactive
Support Tax projection. That leaves the preview with a slider-vs-fixed mismatch:
buyers see one cost shape before upload and a different one after upload.

This slice extracts the production projection into a shared component and uses
it on the landing page. It also records the full-report preview decision for
#245: keep the paid report described in prose for now, rather than inventing a
separate marketing artifact fixture.

The diff is expected to exceed the 400 LOC soft cap because the existing
results-page projection has to move into a shared client component, both
consumers have to swap to it, and a CI-enrolled drift guard has to land with
the extraction.

## Scope (this PR)

Slice phase: Product polish

1. Extract the results-page Support Tax projection UI, slider, metric labels,
   and run-rate math into a shared landing component.
2. Keep the real results page behavior the same: controlled assisted-contact
   cost state, checkout CTA button, and row estimates update from the slider.
3. Replace the `/snapshot` fixed `Support Tax estimate` / `Annualized pace` /
   `Snapshot action` metric band with the shared interactive projection.
4. Let the landing snapshot preview use the same assisted-contact state so hero,
   artifact, row, and projection estimates stay in sync.
5. Add a focused source guard and enroll it in CI so both pages keep importing
   the shared projection and the old fixed cost-band labels cannot return.
6. Update the snapshot landing smoke markers from the removed fixed metric
   label to the shared projection markers.

### Files touched

- `.github/workflows/pre_push_audit.yml` - enroll the cost-projection drift guard.
- `web/package.json` - add the guard script.
- `web/plans/PR-Deflection-Snapshot-Shared-Cost-Projection.md` - plan for this slice.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - update landing render markers.
- `web/scripts/test-deflection-cost-projection-share.mjs` - source guard for shared projection usage.
- `web/scripts/test-deflection-row-renderer-share.mjs` - keep the existing row guard aligned with shared cost state.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - fixture update for smoke marker changes.
- `web/src/components/landing/DeflectionResultsPage.tsx` - use the shared projection.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - use the shared projection and shared cost state.
- `web/src/components/landing/DeflectionSupportTaxProjection.tsx` - shared projection component.

## Mechanism

`DeflectionSupportTaxProjection.tsx` becomes the single source for the support
tax slider, uploaded-window / 30-day / 12-month / 3-year metric labels, and
estimated-cost math. It supports a button action for the real results page and
a link action for the landing page.

`DeflectionResultsPage.tsx` keeps owning `assistedContactCost` so the shared
row components and checkout-adjacent annual estimate still update from the same
slider. `DeflectionSnapshotLandingPage.tsx` becomes a client component and owns
the same state for the representative preview, so the landing hero, artifact
rows, and shared projection no longer disagree.

The guard script checks that both pages import the shared projection, that the
results page no longer defines a local projection component, and that the
landing page no longer carries the removed fixed metric labels.

## Intentional

- Full-report preview decision for #245: keep the paid report as prose in this
  landing page for now. A faithful artifact preview would need a representative
  paid-report fixture and evidence/source rendering decisions beyond this cost
  projection slice.
- The landing page still sends visitors to the existing free Snapshot intake
  CTA; the shared projection uses a link action there, not the results-page
  checkout button.
- No route, pricing, checkout, upload, or paid artifact behavior changes are in
  scope.

## Deferred

- A future paid-report-preview slice can add a faithful `FAQDeflectionReportArtifact`
  demo if the operator wants the paid artifact shown visually on the marketing
  page.

Parked hardening: none

## Verification

- `node web/scripts/audit-test-enrollment.mjs` - PASS; reported all 22 `test:*`
  scripts enrolled.
- `npm --prefix web run test:deflection-cost-projection-share` - PASS.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS.
- `npm --prefix web run test:deflection-row-renderer-share` - PASS.
- `npm --prefix web run test:deflection-teaser-rank-copy` - PASS.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3120` - PASS against the local dev server.
- `npm --prefix web run lint` - PASS.
- `npm --prefix web run build` - PASS.
- Browser check of `/systems/support-ticket-deflection/snapshot` desktop and
  mobile with `agent-browser` - PASS; page rendered content, no framework
  overlay, no horizontal overflow, shared projection and slider rendered, old
  fixed labels were absent, and changing the assisted-contact input to `75`
  updated both projection and row estimates.
- `bash scripts/local_pr_review.sh` - PASS.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | ~115 LOC |
| Shared cost projection extraction | ~285 LOC |
| Results page cleanup/use | ~250 LOC |
| Landing page shared state/use | ~175 LOC |
| Guard + package/workflow enrollment | ~65 LOC |
| Smoke marker updates | ~15 LOC |
| Total | ~905 LOC |
