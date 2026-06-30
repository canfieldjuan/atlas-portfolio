# Deflection Snapshot Demo Width

## Why this slice exists

The public Resolution Snapshot landing page makes the demo artifact feel
visually disconnected from the hero because the hero uses a `max-w-7xl`
container while the Snapshot demo section below it had a narrower section-band
content box plus a `max-w-6xl` child. That narrower frame makes the generated
demo look inset and less like the main deliverable preview.

## Scope (this PR)

Slice phase: Product polish

1. Align the Snapshot demo section wrapper with the hero width.
2. Keep the generated demo data, Snapshot projection, intake form, and report
   preview untouched.
3. Add a source-level smoke assertion so the landing wrapper does not drift
   back to a narrower frame.

### Files touched

- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` — widen the Snapshot demo section wrapper to match the hero frame.
- `web/src/app/globals.css` — add a localized wide section-band padding variant so the wider child frame has enough available width.
- `web/src/lib/deflection-snapshot-landing-smoke.test.ts` — assert the Snapshot demo wrapper uses the hero-width container.
- `HARDENING.md` — park the pre-existing dev-server route failure found during browser verification.
- `web/plans/PR-Deflection-Snapshot-Demo-Width.md` — plan for this slice.

## Mechanism

The Snapshot demo section applies a localized `section-band-wide` class so the
full-bleed band uses an `80rem` content frame, then changes its inner container
from `mx-auto max-w-6xl` to `mx-auto max-w-7xl`. That matches the hero section's
horizontal measure while leaving the section copy capped at `max-w-3xl`. The
artifact card then spans the same page frame as the hero, but the explanatory
text remains readable.

## Intentional

- This is presentation-only. It does not change Snapshot data, report-model
  contracts, generated fixtures, CTA routing, pricing, or privacy copy.
- The proof section remains `max-w-6xl`; the user's concern is the Snapshot
  demo artifact looking too narrow relative to the hero.
- `HARDENING.md` was scanned before starting. No parked hardening item touches
  this Snapshot landing layout.

## Deferred

The operator mentioned a second formatting issue but has not named it yet. This
slice handles only the Snapshot demo width mismatch.

Parked hardening:

- `DEFLECTION-SNAPSHOT-DEVSERVER-1` — the production build passes, but the
  local dev server returns HTTP 500 on the Snapshot landing route because the
  webpack dev pipeline trips over the transitive `node:crypto` import path
  through the intake form. This is outside the presentation-only width slice.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` — passed; 1 test file / 4 tests.
- `npm --prefix web run lint -- src/components/landing/DeflectionSnapshotLandingPage.tsx src/lib/deflection-snapshot-landing-smoke.test.ts` — passed.
- `bash scripts/local_pr_review.sh` — passed; includes plan-doc
  audit, deflection snapshot landing smoke tests, ESLint, Next build, and
  `git diff --check`.
- Browser verification against `http://127.0.0.1:3017/systems/support-ticket-deflection/snapshot`
  was attempted and blocked by the pre-existing dev-server `node:crypto`
  import failure described above; the production build passed in local review.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Snapshot landing layout | ~1 |
| Wide section-band CSS | ~5 |
| Smoke assertion | ~8 |
| Hardening note | ~9 |
| Plan doc | ~70 |
| Total | ~93 |
