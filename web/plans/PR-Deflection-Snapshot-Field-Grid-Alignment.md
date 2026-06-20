# PR-Deflection-Snapshot-Field-Grid-Alignment

## Why this slice exists

The compact intake layout pairs short fields into desktop rows. The rows work,
but reviewer feedback noted that a validation message or the support-platform
hint can stretch a paired grid cell and leave the sibling cell visually taller
than its input. The fix is a small layout-only alignment tweak that keeps paired
fields snug at desktop widths without changing copy or behavior.

## Scope (this PR)

Slice phase: Product polish

1. Add desktop start-alignment to the two paired-field grids in the shared
   Snapshot CSV intake form.
2. Preserve the current mobile stack, field order, labels, validation behavior,
   smoke markers, upload control, CTA, and security footer.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - paired-field grid alignment only.
- `web/plans/PR-Deflection-Snapshot-Field-Grid-Alignment.md` - plan contract for this slice.

## Mechanism

The two responsive field groups keep their existing `grid gap-5 md:grid-cols-2`
layout and add `md:items-start`. That keeps each paired field cell aligned to
the top of its row when one side contains helper text or a validation message.
Below the medium breakpoint the form remains a single-column stack.

## Intentional

- No copy changes.
- No validation, submission, file-upload, or data-handling changes.
- This does not change the CTA/security-footer ordering from the previous hero
  layout slice.

## Deferred

PII/backend scrubbing, storage claims, and copy changes remain deferred to their
dedicated lane.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- Browser check at `http://127.0.0.1:3128/systems/support-ticket-deflection/snapshot`
  with Turbopack dev server:
  - Desktop 1440x1100, after submitting the empty form:
    `/tmp/deflection-snapshot-field-grid-errors-desktop.png`; no horizontal
    overflow (`scrollWidth: 1425`, `innerWidth: 1440`), both paired grids have
    `md:items-start`, name/email input tops both `327`, company/platform input
    tops both `435`, and 5 invalid fields rendered.
  - Mobile 390x844, after the same empty-submit state:
    `/tmp/deflection-snapshot-field-grid-errors-mobile.png`; no horizontal
    overflow (`scrollWidth: 375`, `innerWidth: 390`) and fields remain stacked
    with name/email/company/platform tops `724/832/940/1048`.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3128`
  - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` | ~4 |
| `web/plans/PR-Deflection-Snapshot-Field-Grid-Alignment.md` | ~74 |
| **Total** | **~78** |
