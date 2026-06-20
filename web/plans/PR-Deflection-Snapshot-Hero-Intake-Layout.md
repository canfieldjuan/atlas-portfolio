# PR-Deflection-Snapshot-Hero-Intake-Layout

## Why this slice exists

The Snapshot landing hero looks balanced on mobile, but on desktop the inline
intake form is tall enough that the left-side H1 sits midway down the form. The
first viewport reads like two unrelated vertical positions instead of one
composed hero. This slice adjusts layout hierarchy only; copy and backend
privacy claims stay unchanged while the PII work happens separately.

## Scope (this PR)

Slice phase: Product polish

1. Top-align the Snapshot hero grid on desktop so the badge, H1, and intake
   card begin as one first-viewport unit.
2. Move the submit button above the security/trust panel inside the shared CSV
   intake form so the primary action is not buried under the security copy.
3. Keep the existing security copy visible as a quieter form footer instead of
   a large mid-form block.

### Files touched

- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - desktop hero alignment and grid spacing.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - submit/security visual order and footer styling.
- `web/plans/PR-Deflection-Snapshot-Hero-Intake-Layout.md` - plan contract for this slice.

## Mechanism

The hero grid switches from vertical centering to desktop top alignment with a
slightly tighter column gap and a max-width wrapper around the form column. The
CSV intake form keeps the same fields and text, but the submit block renders
immediately after the file field. The security panel follows as an attached
footer with softer border/background treatment so it remains visible and
reassuring without competing with the submit button.

## Intentional

- No copy changes in this slice. The security labels and descriptions remain as
  they are until the separate PII/backend work lands.
- The shared form changes affect the standalone intake route as well as the
  Snapshot hero, because the submit-before-security hierarchy is better for
  both contexts.
- The security section stays visible in the form rather than moving to a
  distant page section; the user still sees it before submitting.

## Deferred

Copy changes and stronger PII/security claims remain deferred to the dedicated
PII/backend lane.

Parked hardening: none.

## Verification

- Command passed: `npm --prefix web run test:deflection-snapshot-landing-smoke`.
- Command passed: `npm --prefix web run lint`.
- Command passed: `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3126` against a local Turbopack dev server.
- Browser check passed at `http://127.0.0.1:3126/systems/support-ticket-deflection/snapshot`:
  - desktop 1440x1100 screenshot `/tmp/deflection-snapshot-hero-desktop.png`; no horizontal overflow, H1 no longer sits mid-form, submit CTA renders above the security footer.
  - mobile 390x844 screenshot `/tmp/deflection-snapshot-hero-mobile.png`; no horizontal overflow and the mobile stack remains readable.
- Command passed: `npm --prefix web run build`.
- Recurring value/copy sweep: not applicable; this slice intentionally leaves
  visible copy unchanged and moves existing UI blocks only.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` | 26 |
| `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` | 72 |
| `web/plans/PR-Deflection-Snapshot-Hero-Intake-Layout.md` | 73 |
| **Total** | **171** |
