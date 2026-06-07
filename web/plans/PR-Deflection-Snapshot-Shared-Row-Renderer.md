## Why this slice exists

Issue #245 still has one visible snapshot-preview mismatch after the shared
teaser extraction: the `/snapshot` landing artifact renders its own
top-question and locked-question rows. That bespoke rendering shows
`priority score`, uses different locked-row styling, and does not match the
post-upload results page labels buyers see after upload.

This slice continues the structural #245 fix by sharing the production row
renderers between the results page and the marketing preview. It deliberately
leaves the cost-projection and full-report-preview decisions for follow-up PRs.
The diff is over the 400 LOC soft cap because the slice needs to move both row
families into one shared component, delete two local landing renderers, replace
the results-page inline rows, and add the drift guard in the same reviewable
unit.

## Scope (this PR)

Slice phase: Product polish

1. Extract the real results-page top-question rows into a shared component that
   ranks by ticket count and uses the production `target phrase from your
   tickets` / estimated-cost row copy.
2. Extract the real results-page locked-question rows into the same shared
   component file, preserving `Question text withheld` and estimated-cost copy.
3. Replace the landing page's bespoke `SnapshotQuestionRows` and
   `LockedQuestionFomoRows` with the shared row components, using the same
   benchmark assisted-contact cost the landing cost band already uses.
4. Keep the Snapshot landing route, hero proof panel, artifact metrics, teaser
   renderer, cost band, CTA href/label, metadata, intake flow, result checkout
   behavior, and smoke markers unchanged.
5. Add a focused row-renderer guard so future drift back to `priority score` or
   bespoke landing row functions fails locally.
6. Enroll that row-renderer guard in the pre-push audit workflow so the drift
   detector gates future PRs in CI.
7. Pin shared row count/currency formatting to `en-US` so server-rendered
   marketing HTML and client hydration do not vary by visitor locale.

### Files touched

- `web/package.json`
- `web/plans/PR-Deflection-Snapshot-Shared-Row-Renderer.md`
- `.github/workflows/pre_push_audit.yml`
- `web/scripts/test-deflection-row-renderer-share.mjs`
- `web/src/components/landing/DeflectionResultsPage.tsx`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`
- `web/src/components/landing/DeflectionSnapshotRows.tsx`

## Mechanism

`DeflectionSnapshotRows.tsx` becomes the shared source for:

- `DeflectionTopQuestionRows`;
- `DeflectionLockedQuestionRows`.

The components accept the Snapshot question arrays plus the assisted-contact
cost to use when rendering estimated cost labels. `DeflectionResultsPage.tsx`
passes its interactive `assistedContactCost` state, preserving the post-upload
slider behavior. `DeflectionSnapshotLandingPage.tsx` passes
`DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD`, preserving the fixed marketing
benchmark while removing the local `priority score` renderer.

The new `test-deflection-row-renderer-share.mjs` guard reads the shared row
component plus both consumers. It asserts that the shared rows carry the
production labels, that both pages import/use the shared components, and that
the landing page no longer defines or renders the old bespoke row functions or
`priority score` copy. The guard is enrolled in `pre_push_audit.yml` so the
shared-row invariant fails in CI, not only in local verification.

The shared row helper also owns its own `en-US` integer and whole-USD formatters.
That preserves the landing page's prior explicit formatting and avoids
server/client text drift for visitors whose browsers default to non-US locales.

## Intentional

- This is row-rendering alignment only. The landing cost band still differs from
  the results page's interactive Support Tax projection and remains a #245
  follow-up.
- The landing page still uses the benchmark assisted-contact cost rather than a
  user-adjustable state value because this slice does not add interactive cost
  controls to the marketing page.
- The locked-row text `Question text withheld` is reintroduced on the landing
  artifact because it is the production row label and accurately describes what
  the free Snapshot preview shows.
- No smoke marker changes are planned because monitored landing strings stay
  intact.

## Deferred

- #245 follow-up: decide whether the landing page should reuse the results-page
  interactive Support Tax projection or keep the current marketing cost band as
  a separate proof section.
- #245 follow-up: decide whether to add a faithful full-report artifact preview
  or keep the paid report described in prose.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-row-renderer-share` - passed.
  Enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run test:deflection-teaser-rank-copy` - passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3118` - passed against the local dev server.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` desktop
  and mobile - passed; shared row labels rendered (`target phrase from your
  tickets`, `Question text withheld`), `priority score` was absent, no framework
  error overlay appeared, and mobile reported `hasHorizontalOverflow: false`.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~118 |
| CI workflow enrollment | ~3 |
| Shared row component extraction | ~145 |
| Results page import/use cleanup | ~85 |
| Snapshot landing import/use cleanup | ~126 |
| Focused guard + package script | ~76 |
| Total | ~553 |

Over the 400 LOC soft cap because this is an extraction/de-duplication slice:
the shared row renderer, both consumer swaps, and the regression guard need to
land together so the landing page stops drifting back to `priority score`.
