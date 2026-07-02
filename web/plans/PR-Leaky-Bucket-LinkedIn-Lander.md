# PR-Leaky-Bucket-LinkedIn-Lander

## Why this slice exists

Issue #480: `/systems/support-ticket-deflection/calculator` will receive
LinkedIn traffic — mostly mobile, mostly heads of customer support mid-scroll.
Today the leaky-bucket calculator presents seven sliders as one undifferentiated
wall, which is heavy friction on a phone, and the page still carries a
"Back to Support Ticket Deflection" escape hatch at the top of a no-chrome
conversion page. There is also no low-commitment action: the only CTA is the
intake upload, a big first-touch ask for cold social traffic. This slice
restructures for number-first engagement: three core inputs visible, the four
assumption sliders collapsed, and a "Send my numbers to Juan" mailto
micro-conversion that carries the visitor's own numbers.

## Scope (this PR)

Slice phase: Product polish

1. Progressive disclosure in `SupportTaxCalculator`: keep the volume, agents,
   and salary sliders visible; move repeat share, attrition, and the two
   self-service sliders into a collapsed "Adjust the assumptions" expander
   (same `<details>` pattern the 30-second calculator shipped in #482). The
   headline number, metric tiles, and named leak-breakdown cards stay as-is.
2. Add a "Send my numbers to Juan" card: a `mailto:` link (the established
   micro-conversion pattern from `SupportTicketCsvIntakePage`) whose subject
   and body are prefilled with the visitor's inputs, the three leak lines,
   and the total — a lower-commitment first touch than the intake upload,
   honestly labeled as a message to the site owner.
3. Remove the back-link escape hatch (and its now-unused imports) from
   `calculator/page.tsx`, completing the sweep #482 started on the
   support-tax page.

### Files touched

- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — assumptions expander + email-breakdown card.
- `web/src/app/systems/support-ticket-deflection/calculator/page.tsx` — back-link removal.
- `web/plans/PR-Leaky-Bucket-LinkedIn-Lander.md` — document the slice.

## Mechanism

The four assumption sliders move inside a native `<details>` expander whose
summary names the defaults ("50% repeat share, 35% attrition, 14% to 40%
self-service"), so the collapsed state still discloses what the number is
built on. The inputs section renders three sliders, then the expander —
no state or math changes; `computeLeakyBucketLeak` is untouched and remains
pinned by `test:support-tax-math`.

The email card builds its `mailto:` href with `encodeURIComponent` from the
same destructured values the cards render: subject
"My support-tax breakdown", body listing the seven inputs, the three leak
dollar lines, and the annual total, with a link back to the calculator page.
It is a plain anchor styled as the secondary action next to the existing
"Start Your Forensic Audit" primary CTA, matching the intake page's
mailto add-on pattern. The label and helper copy state plainly that the
draft is addressed to Juan — a lead-capture touch, not a self-addressed
artifact — so the CTA promises exactly what clicking does.

## Intentional

- The `Start Your Forensic Audit` CTA string is untouched and remains the
  primary action; the email card is deliberately secondary styling.
- No new test suite: the math this page renders is already pinned by
  `test:support-tax-math`, and the mailto body is presentation composed from
  those tested values — a source-string guard would duplicate the existing
  reachability smoke without asserting behavior.
- The email goes to `juan@juancanfield.com` (the established address in the
  intake page's add-on card), not a new capture endpoint — a lead-capture
  API is out of scope for a copy/structure slice.
- URL share state for this calculator is not added here; the seven-input
  model would need its own param mapping and is not what LinkedIn post
  creative links to. Named in Deferred.
- The `compact` prop and its layout branches are untouched; only
  `calculator/page.tsx` mounts this component today, but the prop is public
  surface and out of scope.

## Deferred

- Per-route OG images and calculator analytics events (including a CTA-click
  event for the new email card) — `PR-Calculator-Channel-Plumbing`, next
  slice.
- URL share state for the leaky-bucket calculator, if LinkedIn engagement
  shows demand for pasteable configured results.
- A real email-capture endpoint replacing the mailto pattern, if the
  micro-conversion earns it.
- The two parked calculator-math entries below were scanned per the
  `HARDENING.md` workflow and deliberately left parked: this slice changes
  structure and copy only, and resolving either entry changes the live
  headline number — the product decision they were parked for.

Parked hardening: SUPPORT-TAX-MATH-1; SUPPORT-TAX-MATH-2

## Verification

- `npm --prefix web run test:support-tax-math` — math untouched, still
  13/13.
- `npm --prefix web run test:deflection-public-reachability-smoke` — guarded
  CTA strings intact (this component is in the guarded set).
- `npm --prefix web run lint` — clean (catches the unused `ArrowLeft`/`Link`
  imports the back-link removal leaves behind).
- `rg -n "Back to Support Ticket Deflection" web/src/app/systems/support-ticket-deflection/calculator/ web/src/app/systems/support-ticket-deflection/support-tax/` —
  zero matches on the two calculator landers; this slice finishes the sweep
  #482 started. The link intentionally remains on `demo/page.tsx`,
  `playbook/page.tsx`, and the results error/unavailable pages — those are
  browse and recovery surfaces, not paid-traffic conversion pages, and
  removing their navigation is out of scope.
- `bash scripts/local_pr_review.sh` — full local gate including the Next
  build.
- Manual: on the dev server, confirm the three core sliders render, the
  expander opens with the four assumption sliders, and the email link opens
  a draft containing the currently-configured numbers.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/src/components/deflection-demo/SupportTaxCalculator.tsx` | ~120 |
| `web/src/app/systems/support-ticket-deflection/calculator/page.tsx` | ~12 |
| `web/plans/PR-Leaky-Bucket-LinkedIn-Lander.md` | ~110 |
| Total | ~242 |
