# Deflection Locked Preview Width

## Why this slice exists

After widening the public Snapshot demo to the hero frame, the locked full-report
preview below it still looks indented. The root cause is that
`DeflectionLockedReportPreview` still uses the default `section-band` content
box plus a `max-w-6xl` child, while the Snapshot demo now uses
`section-band-wide` and `max-w-7xl`.

## Scope (this PR)

Slice phase: Product polish

1. Align the locked full-report preview section with the Snapshot demo width.
2. Keep the generated report model, preview section subset, locked overlay,
   copy, CTA routing, pricing, and privacy copy untouched.
3. Add a source-level smoke assertion so the locked preview frame stays aligned
   with the Snapshot demo frame.

### Files touched

- `web/src/components/landing/DeflectionLockedReportPreview.tsx` — widen the locked full-report preview section wrapper to match the Snapshot demo frame.
- `web/src/lib/deflection-snapshot-landing-smoke.test.ts` — assert the locked preview uses the same wide section-band and hero-width child frame.
- `web/plans/PR-Deflection-Locked-Preview-Width.md` — plan for this slice.

## Mechanism

The locked report preview reuses the existing `section-band-wide` CSS variant
and changes its inner container from `mx-auto max-w-6xl` to
`mx-auto max-w-7xl`. This gives the muted full-report section the same
horizontal frame as the Snapshot demo above it while leaving the preview's
heading copy capped at `max-w-3xl`.

## Intentional

- This is presentation-only. It does not change report data, generated
  contracts, preview section selection, row rendering, checkout, pricing, or
  privacy copy.
- The existing parked `DEFLECTION-SNAPSHOT-DEVSERVER-1` hardening item was
  considered. It still blocks local dev-server browser verification for this
  route, but it is unrelated to this width-only fix.

## Deferred

No additional formatting issues are included in this slice.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` — passed; 1 test file / 4 tests.
- `npm --prefix web run lint -- src/components/landing/DeflectionLockedReportPreview.tsx src/lib/deflection-snapshot-landing-smoke.test.ts` — passed.
- `bash scripts/local_pr_review.sh` — passed; includes plan-doc audit,
  deflection snapshot landing smoke tests, ESLint, Next build, and
  `git diff --check`.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Locked preview layout | ~2 |
| Smoke assertion | ~5 |
| Plan doc | ~59 |
| Total | ~66 |
