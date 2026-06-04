## Why this slice exists

atlas-portfolio#197 asks for the additive short landing page to sell one clear
thing: the free Deflection Snapshot. The current snapshot route has the right
raw material: a 4-P structure, before/after answer proof, representative
snapshot artifact, and cost proof. But several sections still frame the paid
full report as the main object, which weakens the single-offer page.

This slice tightens the snapshot page around the Snapshot conversion while
leaving the full report as downstream context: the visitor should understand
"upload tickets, get the free Snapshot, then decide if the full report is
worth unlocking."

## Scope (this PR)

Slice phase: Product polish

1. Reword the cost-proof band so the third metric is the free Snapshot action,
   not the paid full-report price.
2. Reframe the first-page copy from "buy the full report" toward "prove the
   repeat pattern with the free Snapshot."
3. Keep the free/full boundary visible, but make the CTA and final push sell the
   Snapshot only.
4. Preserve the existing route, CTA destination, demo snapshot fixture, no-chrome
   behavior, sitemap entry, intake, checkout, results, and paid report logic.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Offer-Focus.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

`DeflectionSnapshotLandingPage` keeps using `DEMO_DEFLECTION_SNAPSHOT` and the
existing section order. The cost-proof helper still computes uploaded-window
cost and annualized pace from the representative snapshot, but the third metric
becomes the free Snapshot step instead of the fixed paid-report price.

Page copy changes are limited to positioning: the Snapshot becomes the named
artifact in the cost band, picture section, proof section, and final push. The
full report remains mentioned only as what a strong Snapshot can justify later.
No math, constants, links, forms, API calls, or client state change.

## Intentional

- No new calculator or interactive cost control is added; this page stays short
  and demo-forward.
- No checkout, Stripe, results-page, paid artifact, ATLAS parser, or intake
  behavior changes are included.
- The representative demo disclaimer stays in place; this page still does not
  claim customer-specific measurements before upload.
- The full report is not hidden, only demoted from the primary offer.

## Deferred

- Promotion or traffic routing from the long page to the short Snapshot route
  remains a separate follow-up.
- Any broader visual redesign beyond the offer-positioning copy remains out of
  scope.
- Parked hardening: none.

## Verification

Ran before push:

- `rg -n "Full report unlock|paid report purchase|paid unlock|vague ROI claim|the full report is the paid unlock" web/src/components/landing/DeflectionSnapshotLandingPage.tsx -S` - no matches
- `rg -n "Get my free Deflection Snapshot|Snapshot action|Snapshot comes before any paid report|The only ask on this page" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Offer-Focus.md -S` - expected Snapshot-first markers present
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- Browser check of `/systems/support-ticket-deflection/snapshot` at 1440x1100 and 390x844 - passed; page rendered, all three CTAs pointed to `/systems/support-ticket-deflection/intake`, no horizontal overflow, no page errors, and screenshots showed no obvious text overlap.
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~72 |
| Snapshot landing offer-positioning copy | ~45 |
| Total | ~117 |
