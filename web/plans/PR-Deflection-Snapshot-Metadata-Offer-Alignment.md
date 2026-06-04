## Why this slice exists

The Snapshot landing page now sells a richer free deliverable: ranked repeat
ticket issues, customer wording, a benchmark Support Tax estimate, and one
sourced draft answer. The route metadata still describes the older artifact as
priority-score framing, which undersells the Snapshot in search/social previews
and no longer matches the visible page promise.

## Scope (this PR)

Slice phase: Product polish

1. Align the `/systems/support-ticket-deflection/snapshot` metadata title with
   the Snapshot-first offer.
2. Replace the stale metadata description so search, Open Graph, and Twitter
   previews name the same deliverables the page now sells.
3. Preserve the route, rendered landing page, intake CTA, keywords, sitemap,
   no-chrome registration, smoke scripts, checkout, pricing, results, and
   partner funnel behavior.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Metadata-Offer-Alignment.md`
- `web/src/app/systems/support-ticket-deflection/snapshot/page.tsx`

## Mechanism

The Snapshot route already centralizes its SEO/social preview copy through
`generatePageMetadata`. This slice changes only the `title` and `description`
passed to that helper. Because the helper fans the description into standard
metadata, Open Graph, and Twitter fields, no separate preview-specific edit is
needed.

## Intentional

- This is metadata positioning only; it does not change rendered page content,
  forms, routes, checkout, pricing, result delivery, or smoke markers.
- Keywords stay unchanged because the stale promise is in the title and
  description, not the keyword list.
- No broader metadata sweep is included; this slice is limited to the public
  Snapshot landing route.

## Deferred

- Intake, partner, calculator, playbook, demo, support-tax, and results metadata
  can be reviewed in separate slices if those routes need the same offer
  hierarchy.
- Entry-surface runtime labels were handled by
  `PR-Deflection-Snapshot-Entry-Cta-Consistency`; this slice does not revisit
  CTA labels.
- The remaining old priority-score framing in
  `web/plans/PR-Deflection-Snapshot-Landing-Page.md` stays by design as a
  historical record of the original Snapshot route slice and what it explicitly
  did not claim at that time.
- Parked hardening: none.

## Verification

- `git grep -nP "relative priority scores|one sourced drafted answer preview" -- web` -
  passed; the retired metadata promise is absent from runtime source after this
  PR. Remaining matches are the historical plan-doc record named in Deferred
  and this plan's verification command.
- `rg -n "Free Deflection Snapshot: Find Repeat Support Tickets to Deflect First|benchmark Support Tax estimate|one sourced answer draft" web/src/app/systems/support-ticket-deflection/snapshot/page.tsx web/plans/PR-Deflection-Snapshot-Metadata-Offer-Alignment.md -S` -
  passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` desktop
  1440x1100 and mobile 390x844 at `127.0.0.1:3111` - passed; route rendered,
  browser title and meta description matched the new offer copy, no framework
  error overlay appeared, and mobile reported no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~65 |
| Snapshot metadata | ~3 |
| Total | ~68 |
