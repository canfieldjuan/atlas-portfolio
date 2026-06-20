# PR-Deflection-Snapshot-Hero-Proof-Strip

## Why this slice exists

The Snapshot hero now has the right proportions and inline intake behavior, but
the left side still feels visually plain on desktop once the intake card carries
most of the structure. The user wants the first viewport to feel more deliberate
without changing the approved hero copy, removing intake fields, or adding new
security claims.

## Scope (this PR)

Slice phase: Product polish

1. Add a compact proof strip under the existing hero paragraph.
2. Reuse values already derived from `DEMO_DEFLECTION_SNAPSHOT` so the strip
   previews the same artifact shown lower on the page, including the cost
   metric's uploaded-window scope.
3. Tighten the submit-adjacent security line alignment so it does not strand the
   shield icon when the first viewport is inspected, while still allowing the
   line to wrap in narrower hero-card columns.
4. Leave the hero headline, supporting paragraph, intake fields, trust panel,
   and downstream sections unchanged.
5. Preserve mobile stacking and avoid horizontal overflow.

### Files touched

- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - add the hero proof strip.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - tighten submit security line wrapping.
- `web/plans/PR-Deflection-Snapshot-Hero-Proof-Strip.md` - plan contract for this slice.

## Mechanism

`DeflectionSnapshotLandingPage` gains a small `HeroProofStrip` helper that
derives repeat-ticket count, uploaded-window cost, uploaded-window days, and
included-draft count from the existing demo Snapshot fixture. The helper renders
below the hero paragraph as a compact grid, adding first-viewport structure on
wide desktop while staying stacked through the tablet/narrow-laptop breakpoint.
The submit security line keeps its text and placement, but uses a smaller mono
treatment with a wrapped span so the icon stays visually attached to the text
without forcing nowrap until the card is wide enough.

## Intentional

- The strip does not change existing hero wording or intake form fields.
- The strip uses already-rendered Snapshot values instead of new claims.
- The cost card names the uploaded-window scope so the hero figure is not
  confused with the annualized projection lower on the page.
- The submit security line keeps the same words and remains under the button.
- Security copy is not expanded in this slice because backend PII and claim
  hardening are separate lanes.

## Deferred

Field-count reductions, broader landing copy changes, backend PII scrubbing,
and stronger storage/security claims remain deferred to their dedicated lanes.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3136`
  - passed against the local Snapshot route.
- `npm --prefix web run build` - passed.
- Browser check at
  `http://127.0.0.1:3136/systems/support-ticket-deflection/snapshot` - passed:
  desktop screenshot `/tmp/deflection-hero-proof-strip-desktop-tight.png`
  showed the proof strip in the first viewport, the submit security line on one
  line, the trust panel still starting above the fold, and no horizontal
  overflow (`scrollWidth: 1425`, `innerWidth: 1440`). Mobile screenshot
  `/tmp/deflection-hero-proof-strip-mobile.png` showed the proof strip stacked
  before the intake, the submit security line wrapped as a controlled text
  block, and no horizontal overflow (`scrollWidth: 375`, `innerWidth: 390`).
- `bash scripts/local_pr_review.sh` - passed; reported advisory open-PR file
  overlap with #327 on `DeflectionSnapshotLandingPage.tsx`, with no blocking
  drift detected.
- Review follow-up: `npm --prefix web run test:deflection-snapshot-landing-smoke`
  - passed after addressing the P2 comments.
- Review follow-up: `npm --prefix web run lint` - passed.
- Review follow-up:
  `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3136`
  - passed.
- Review follow-up: `npm --prefix web run build` - passed.
- Review follow-up browser checks passed at the missed `md`/narrow-laptop
  widths: `/tmp/deflection-hero-proof-strip-768-review-fix.png` had no
  overflow (`scrollWidth: 753`, `innerWidth: 768`), one proof-strip column, and
  the cost detail `over 30 days`; `/tmp/deflection-hero-proof-strip-1024-review-fix.png`
  had no overflow (`scrollWidth: 1009`, `innerWidth: 1024`), one proof-strip
  column, and wrapped submit security text. Desktop
  `/tmp/deflection-hero-proof-strip-desktop-review-fix.png` kept three proof
  columns and one-line submit security text with no overflow; mobile
  `/tmp/deflection-hero-proof-strip-mobile-review-fix.png` stayed single-column
  with no overflow.

## Estimated diff size

| File | LOC |
|---|---:|
| **Total** | **~173** |
