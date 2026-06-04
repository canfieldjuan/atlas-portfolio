## Why this slice exists

The public Snapshot page now has a sharper hero and a stronger artifact preview,
but the page still asks visitors to pass through repeated explanation before the
final CTA. The current order puts the cost band before the inspectable artifact
and then repeats the same "Snapshot is the proof object" idea in a process
section. This slice tightens the page flow so the offer reads as: promise,
artifact, economic proof, trust proof, CTA.

## Scope (this PR)

Slice phase: Product polish

1. Move the representative Snapshot artifact directly after the hero so visitors
   see the free deliverable before the benchmark cost band.
2. Remove the redundant process section that restates the Snapshot-proof idea
   already covered by the hero, artifact, cost band, and proof list.
3. Rename the artifact section framing from `Picture` to a clearer artifact
   cue, while preserving the public route, CTA destination, monitored smoke
   markers, intake, checkout, pricing, results, partner routing, and docs.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Section-Order-Cut.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

`DeflectionSnapshotLandingPage` keeps the same components and data fixture. The
render order changes from hero -> cost -> artifact -> process -> proof -> final
CTA to hero -> artifact -> cost -> proof -> final CTA. The process section is
deleted rather than rewritten because its steps duplicate the Snapshot value
already shown by the hero proof panel and artifact preview.

The cost band remains intact, including the `Snapshot action` label and
`Snapshot comes before any paid report` copy used by the landing smoke. The
final CTA copy remains intact, including `The only ask on this page is the CSV
upload`.

## Intentional

- This is section-order and redundancy polish only; it does not change the
  Snapshot data fixture, result page, checkout, intake, pricing, or smoke
  scripts.
- The deleted process cards are intentionally not replaced elsewhere because
  they repeated the surrounding sections.
- The cost band still appears on the page because Support Tax is part of the
  Snapshot's value proof; it simply follows the inspectable artifact.
- No smoke marker update is needed because the required render markers remain on
  the page.

## Deferred

- Entry-link and CTA consistency across other public entry surfaces remains the
  next planned slice.
- Results-page positioning and paid-report unlock presentation remain separate
  from this public landing-page pass.
- Parked hardening: none.

## Verification

- `rg -n "The Snapshot is the proof object|Export closed tickets|Step 1" web/src/components/landing/DeflectionSnapshotLandingPage.tsx -S` -
  passed; the deleted process section strings are gone from the component.
- `rg -n "Snapshot action|Snapshot comes before any paid report|The only ask on this page is the CSV upload|Artifact" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Section-Order-Cut.md -S` -
  passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` at
  `127.0.0.1:3109` desktop 1440x1100 and mobile 390x844 - passed; the artifact
  section renders before the Support Tax cost band, the deleted process section
  is absent, no framework error overlay appeared, mobile reported no horizontal
  overflow, and the rendered HTML still contains the required smoke markers.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Snapshot section-order polish | ~45 |
| Total | ~120 |
