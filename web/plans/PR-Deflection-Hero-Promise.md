# Plan: Deflection hero promise

Tighten the Support Ticket Deflection hero so the first screen leads with the
customer-keyword promise instead of the broader search-query framing.

## Why this slice exists

- The page structure is now cleaner, but the hero still asks the reader to infer
  the concrete promise from a broader support-ticket/search-query statement.
- The selected copy direction is urgency-driven, data-backed, problem-agitation
  copy: stop guessing, mine real tickets, and turn the missed wording into FAQ
  drafts.
- The first screen should make the offer easier to click without changing the
  product mechanics or making a stronger guarantee than the report can sustain.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the hero headline to center the missed customer-keyword promise.
2. Rewrite the hero intro/subheadline to call out guessing and customer wording.
3. Rewrite the hero body to keep the 3-6 month upload, 24-hour turnaround, ranked
   repeat questions, wording gaps, and FAQ draft outcome.
4. Change the hero CTA label to match the repeat-ticket-gap promise.
5. Keep layout, pricing, FAQ, intake, structured data, and non-hero sections
   unchanged.

### Files touched

- `web/plans/PR-Deflection-Hero-Promise.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — update hero copy and CTA label

## Mechanism

- Update the `landingPageConfigV2.hero` strings in place.
- Keep the same `GAP_REPORT_INTAKE_HREF`, CTA component, and page layout.
- Leave the partner page untouched because it inherits the shared public hero
  copy from `landingPageConfigV2`.

## Intentional

- **Hero copy only** — this does not rewrite the problem, cost, offer, pricing,
  or FAQ sections.
- **Draft language stays explicit** — the body says "FAQ drafts" so the page does
  not imply customers can publish untouched output without review.
- **No new guarantee** — the copy promises extracted wording, ranked questions,
  gaps, and drafts, not rankings, churn reduction, or a deflection percentage.

## Deferred

- Rewriting the first problem/cost sections in the same copywriting style.
- Adding proof chips or new above-the-fold UI elements.
- Updating the intake form with an optional "what should we look for?" field.
- Parked hardening considered but out of scope: DEFLECTION-INTAKE-PII-1.

Parked hardening: none.

## Verification

- `npm --prefix web run lint` — passed.
- `git diff --check` — passed.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` —
  verified the new H1, body phrase, and `Find my repeat-ticket gaps` CTA render
  with no framework error overlay.
- Mobile browser check at 390px — verified the new H1 and CTA render with no
  framework error overlay.
- `npm --prefix web run build` — passed.
- `rg -n "Your repeat support tickets are search queries your help center can't answer|We mine them for the exact words your customers type into Google|Upload 3–6 months of support tickets\. In 24 hours, get the repeat questions ranked|Upload your CSV — get a free Deflection Snapshot" web`
  — no stale instances remain.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig-v2.tsx` hero copy | ~10 |
| this plan doc | ~75 |
| **Total** | ~85 |

Under the 400-LOC soft cap.
