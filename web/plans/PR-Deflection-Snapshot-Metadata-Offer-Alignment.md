## Why this slice exists

The Snapshot landing page now sells a richer free deliverable: ranked repeat
ticket issues, customer wording, a benchmark Support Tax estimate, and one
sourced draft answer. The route metadata still describes the older artifact as
priority-score framing, which undersells the Snapshot in search/social previews
and no longer matches the visible page promise. After
`PR-Deflection-Window-30-Days`, this slice also needs to preserve the current
30-day upload window while replacing the stale offer framing.

## Scope (this PR)

Slice phase: Product polish

1. Align the `/systems/support-ticket-deflection/snapshot` metadata title with
   the Snapshot-first offer.
2. Replace the stale metadata description so search, Open Graph, and Twitter
   previews name the same deliverables the page now sells.
3. Preserve the route, rendered landing page, intake CTA, 30-day upload-window
   ask, keywords, sitemap, no-chrome registration, smoke scripts, checkout,
   pricing, results, and partner funnel behavior.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Metadata-Offer-Alignment.md`
- `web/src/app/systems/support-ticket-deflection/snapshot/page.tsx`

## Mechanism

The Snapshot route already centralizes its SEO/social preview copy through
`generatePageMetadata`. This slice changes only the `title` and `description`
passed to that helper. Because the helper fans the description into standard
metadata, Open Graph, and Twitter fields, no separate preview-specific edit is
needed. The description keeps the already-merged `Upload 30 days` ask and
changes the deliverable list from priority-score framing to the richer Snapshot
offer.

## Intentional

- This is metadata positioning only; it does not change rendered page content,
  forms, routes, checkout, pricing, result delivery, or smoke markers.
- The 30-day upload window from `PR-Deflection-Window-30-Days` is preserved;
  this slice does not reopen that cross-surface decision.
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

- `git grep -nP "relative priority scores|one sourced drafted answer preview|Upload 3 months of closed tickets" -- web` -
  passed; the retired metadata promise and stale 3-month metadata ask are
  absent from runtime source after this PR. Remaining matches are the
  historical plan-doc record named in Deferred and this plan's verification
  command.
- `rg -n "Free Deflection Snapshot: Find Repeat Support Tickets to Deflect First|Upload 30 days|benchmark Support Tax estimate|one sourced answer draft" web/src/app/systems/support-ticket-deflection/snapshot/page.tsx web/plans/PR-Deflection-Snapshot-Metadata-Offer-Alignment.md -S` -
  passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` desktop
  1440x1100 and mobile 390x844 at `127.0.0.1:3112` - passed; route rendered,
  browser title and meta description matched the new 30-day offer copy, no
  framework error overlay appeared, and mobile reported no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~85 |
| Snapshot metadata | ~3 |
| Total | ~90 |
