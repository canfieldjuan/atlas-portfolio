# Plan: Clean up deflection landing section transitions

## Why this slice exists

The support-ticket-deflection landing page has visually noisy section
transitions. Plain `section-band` sections are transparent, while muted/accent
sections use translucent backgrounds over the page gradient. That creates a
three-color transition in places, and section labels/headlines can look like
they sit on the boundary instead of clearly belonging to the new section.

## Scope (this PR)

Slice phase: Product polish

1. Scope section-background cleanup to the support-ticket-deflection landing
   page only.
2. Give that page's plain, muted, and accent section bands opaque backgrounds so
   transitions are one clean color change.
3. Keep the existing section order, copy, spacing, calculator, demo, pricing,
   CTA, and FAQ behavior unchanged.

### Files touched

- `web/plans/PR-Clean-Section-Transitions.md` — this plan doc.
- `web/src/components/landing/DeflectionLandingPage.tsx` — add a page-scoped class hook.
- `web/src/app/globals.css` — scoped opaque section backgrounds for the deflection landing page.

## Mechanism

`DeflectionLandingPage` adds a `deflection-landing` class to its `<main>`.
`globals.css` then targets `.deflection-landing .section-band` variants with
opaque background colors. The global `.section-band` spacing and other landing
pages remain unchanged.

This removes the transparent page-gradient bleed-through that made adjacent
sections appear to have an extra color band. Section headings keep the existing
top padding, so they sit inside the new section background rather than visually
straddling the transition.

## Intentional

- No copy changes.
- No section reordering.
- No global `.section-band` behavior change outside this landing page.
- No calculator/demo layout changes.

## Deferred

- Any broader visual pass across other site pages using `.section-band`.
- Further spacing changes after reviewing the cleaner transitions.
- Parked hardening: none

## Verification

- `rg -n "deflection-landing|section-band-muted|section-band-blue|\.section-band \{" web/src/components/landing/DeflectionLandingPage.tsx web/src/app/globals.css` — confirmed the scoped class hook and opaque section-background rules.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- Browser check of `/systems/support-ticket-deflection` desktop and 390px mobile — no framework overlay, no browser errors, no horizontal overflow. Verified scoped section backgrounds are opaque and section headings retain top padding inside the new section background.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~65 |
| Landing page class hook | ~2 |
| Scoped section backgrounds | ~18 |
| Total | ~85 |

Well under the 400-LOC soft cap.
