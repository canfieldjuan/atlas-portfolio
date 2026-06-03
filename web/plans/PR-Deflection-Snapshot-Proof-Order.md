# PR-Deflection-Snapshot-Proof-Order

## Why this slice exists

atlas-portfolio#197 is still open after the additive snapshot landing route
landed. The route now sells the free Deflection Snapshot, but the first viewport
still leads with a broad ranked-snapshot panel. The issue review called out a
sharper order: show the answer-quality proof first: a support ticket thread
turning into a drafted answer with source/review badges, so the visitor believes
the snapshot can produce something worth publishing before they evaluate the
support-cost math or the full-report unlock.

This slice keeps the existing route additive and uses the already-bounded
`DEMO_DEFLECTION_SNAPSHOT` teaser data. It changes presentation and positioning
only: no new ATLAS fields, no checkout behavior, no results-page contract, and no
new benchmark or SEO claims.

## Scope (this PR)

Slice phase: Product polish

1. Reorder the `/systems/support-ticket-deflection/snapshot` first viewport
   around answer-quality proof instead of a generic snapshot table.
2. Add a compact before/after proof panel from the existing demo teaser: customer
   ticket wording, sourced drafted answer, source count, and review badge.
3. Place a concise free-snapshot vs full-report boundary beside the proof so the
   free offer and paid unlock are clear in the first screen.
4. Preserve the existing CTA destination, no-chrome route behavior, sitemap
   entry, and representative-data disclaimer.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Proof-Order.md` - plan contract for this slice.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - snapshot landing first-viewport proof order and offer-boundary copy.

## Mechanism

`DeflectionSnapshotLandingPage` keeps using `DEMO_DEFLECTION_SNAPSHOT`. The
hero's visual column changes from the broader `SnapshotArtifact` as the primary
object to a new proof-focused panel that derives one customer phrase from the
demo answer's matching top question, displays the existing teaser answer, and
adds badges for source count and review status. The ranked snapshot table remains
available below the hero as supporting proof, so the page still shows what the
snapshot contains without making the table the first proof object.

The offer-boundary rows are static copy tied to the existing free/full product
shape: the free snapshot shows top repeats, wording examples, and one sourced
drafted answer; the paid report unlocks the complete ranked backlog, drafts,
source trail, and no-proven-answer list. The supporting snapshot card derives
its locked-rank label from `snapshot.locked_questions`, not from the subset of
free rows rendered for visual density.

## Intentional

- This does not replace the existing long-form support-ticket-deflection page.
- This does not alter intake, results, checkout, webhook, paid artifact, or ATLAS
  parser behavior.
- This does not add cost estimates to the sample landing page; the sample still
  labels scores as relative priority signals rather than raw ticket counts.
- The before/after proof is representative demo data, not a customer-specific
  uploaded snapshot.

## Deferred

- Traffic split or promotion of the new snapshot route into the primary nav/CTA
  path remains a follow-up after this page shape is reviewed.
- Closing #197 will wait until the operator confirms the additive route now has
  the desired first-screen proof order.

Parked hardening: none

## Verification

- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser check: opened `/systems/support-ticket-deflection/snapshot` with
  `agent-browser` at 1440x1100 and 390x844 viewports; confirmed the new headline,
  before/after proof region, free/full boundary copy, supporting snapshot panel,
  and CTAs render in order with no browser page errors.
- Browser screenshot check: inspected desktop and mobile screenshots from the
  local dev server; confirmed the first viewport has no overlapping text and the
  mobile before/after panel reads cleanly after the CTA.
- Review fix browser check: re-opened
  `/systems/support-ticket-deflection/snapshot` with `agent-browser`; confirmed
  the supporting snapshot card renders `Ranks 6-12 stay locked` and the stale
  `Ranks 4-12 stay locked` label is absent.
- `rg -n "See which repeat tickets are burning support time before you buy anything|BEFORE / AFTER SNAPSHOT PROOF|Before ticket thread|Free snapshot|Full report|support-ticket-deflection/snapshot" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Proof-Order.md` - passed; the new first-screen proof markers and route are present, and the old cost-first headline has no match.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~78 |
| Snapshot landing page proof order | ~140 |
| Total | ~218 |
