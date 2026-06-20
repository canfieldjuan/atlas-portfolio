# PR-Deflection-Snapshot-Intake-Compact-Fields

## Why this slice exists

After the hero alignment pass, the Snapshot intake card still consumes a lot of
desktop height because every short field renders in a single vertical stack.
The mobile stack is fine, but desktop has enough horizontal space to pair the
short fields and bring the upload, CTA, and security footer higher in the first
viewport without changing any copy.

## Scope (this PR)

Slice phase: Product polish

1. Pair the name/work-email fields into a two-column row at desktop widths.
2. Pair the company/support-platform fields into a second two-column row at
   desktop widths.
3. Preserve the current mobile single-column order, required-field labels,
   validation messages, smoke markers, and all visible copy.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - desktop field grouping only.
- `web/plans/PR-Deflection-Snapshot-Intake-Compact-Fields.md` - plan contract for this slice.

## Mechanism

The shared CSV intake form keeps the same inputs and handlers, but groups the
first four short fields into two responsive grids. The grids collapse to a
single column below the medium breakpoint, so mobile behavior stays unchanged.
The CSV upload, submit CTA, and security footer remain full-width below the
grouped fields.

## Intentional

- No copy changes.
- No field additions/removals and no validation logic changes.
- This affects the standalone intake route too because it uses the same shared
  form component and benefits from the same desktop compaction.

## Deferred

Copy changes and stronger PII/security claims remain deferred to the dedicated
PII/backend lane.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- Browser check at `http://127.0.0.1:3127/systems/support-ticket-deflection/snapshot`
  with Turbopack dev server:
  - Desktop 1440x1100 screenshot:
    `/tmp/deflection-snapshot-compact-desktop.png`; no horizontal overflow
    (`scrollWidth: 1425`, `innerWidth: 1440`), name/email share top `327`,
    company/platform share top `415`, CTA top `611`, security footer visible
    with first heading top `696`.
  - Mobile 390x844 screenshot:
    `/tmp/deflection-snapshot-compact-mobile-top.png`; no horizontal overflow
    (`scrollWidth: 375`, `innerWidth: 390`) and fields remain stacked with
    name/email/company/platform tops `724/812/900/988`.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3127`
  - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` | ~198 |
| `web/plans/PR-Deflection-Snapshot-Intake-Compact-Fields.md` | ~76 |
| **Total** | **~274** |
