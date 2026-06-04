## Why this slice exists

The next public landing-page slice needs to keep the offer from drifting back
into a broad support-ticket pitch. The page should sell one thing: the free
Deflection Snapshot. The current hero explains the general transformation from
repeat tickets into help-center answers, but the first viewport can make the
Snapshot itself feel more concrete and valuable by naming the ranked repeats,
customer wording, Support Tax estimate, and one sourced draft before the visitor
hits the rest of the page.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the Snapshot hero headline and subhead around the free diagnostic
   offer, not the broader support-ticket transformation.
2. Tighten the hero proof panel so its first viewport preview shows the same
   offer parts: repeat pattern, customer wording, benchmark Support Tax
   estimate, and one sourced draft.
3. Preserve the Snapshot route, CTA label, intake destination, checkout,
   pricing, results page, partner routing, monitor/runbook docs, and long page.
4. Update the landing smoke marker only if the hero copy changes its required
   render marker.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Hero-Offer-Reframe.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`
- `web/scripts/smoke-deflection-snapshot-landing.mjs`
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs`

## Mechanism

`DeflectionSnapshotLandingPage` already renders the public Snapshot route from
`DEMO_DEFLECTION_SNAPSHOT`. This slice changes only presentation copy and
derived display values already available in that fixture. The hero subhead names
the Snapshot deliverables directly. `HeroProofPanel` keeps the existing before /
after proof structure, but its summary rail now includes the representative
Support Tax estimate derived from `snapshotCostProof(snapshot)`, alongside the
repeat-ticket count, source-ticket count, and gated preview count.

The smoke script keeps checking the same public page and intake href. Its
headline marker follows the new hero headline so the render guard still proves
the first-viewport offer loaded.

## Intentional

- This PR is public landing-page presentation only; it does not redesign the
  uploaded Snapshot results page from issue #196.
- The Support Tax number remains a benchmark estimate from the representative
  labeled-synthetic fixture, not a guaranteed savings claim.
- The CTA label and destination stay unchanged to avoid a funnel contract change
  in a copy-polish slice.
- The long support-ticket page remains live; this PR does not make canonical
  route decisions.

## Deferred

- Artifact-preview polish below the hero remains the next planned public-page
  slice.
- Results-page positioning, payload-backed locked rows, and any paid-report
  unlock presentation remain separate from this public-page slice.
- Entry-link and CTA consistency across other pages waits until the hero and
  artifact copy settle.
- Parked hardening: none.

## Verification

- `rg -n "Turn repeat support tickets into help-center answers your team can publish\\." web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/smoke-deflection-snapshot-landing.mjs web/scripts/test-deflection-snapshot-landing-smoke.mjs -S` -
  passed; no stale old hero headline remains in the component or smoke fixtures.
- `rg -n "Get the free Snapshot that shows which support tickets to deflect first\\.|Support Tax estimate|BEFORE / AFTER SNAPSHOT PROOF" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/smoke-deflection-snapshot-landing.mjs web/scripts/test-deflection-snapshot-landing-smoke.mjs web/plans/PR-Deflection-Snapshot-Hero-Offer-Reframe.md -S` -
  passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` at
  `127.0.0.1:3107` desktop and 390x844 mobile - passed; the new hero headline,
  `Support Tax estimate`, and CTA rendered, no framework error overlay appeared,
  and mobile reported no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Snapshot hero presentation | ~35 |
| Smoke marker update | ~4 |
| Total | ~119 |
