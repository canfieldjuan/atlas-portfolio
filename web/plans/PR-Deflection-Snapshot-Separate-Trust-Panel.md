# PR-Deflection-Snapshot-Separate-Trust-Panel

## Why this slice exists

The Snapshot intake CTA and security text now sit in the right order, but the
trust/security block still renders inside the same visual shell as the intake
form. That keeps the form card reading taller than it needs to on desktop. This
slice separates the trust panel from the intake card visually while keeping it
directly below the upload CTA and leaving all wording untouched.

## Scope (this PR)

Slice phase: Product polish

1. Make the shared CSV intake component render as a vertical stack.
2. Keep the headline, fields, file upload, errors, and submit CTA inside the
   primary intake card.
3. Render the existing trust/security block as a sibling panel below the card,
   still immediately after the CTA in reading order.
4. Preserve mobile stacking, smoke markers, labels, validation, and all visible
   copy.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - separate the trust panel from the form card shell.
- `web/plans/PR-Deflection-Snapshot-Separate-Trust-Panel.md` - plan contract for this slice.

## Mechanism

The component keeps `data-smoke="inlineForm uploadEyebrow"` on the outer wrapper
but changes that wrapper from the card shell into a `space-y-4` stack. A nested
card contains the existing headline and `<form>`. The trust/security panel stays
after the form as a sibling panel with the same three items and the same text,
so the reading order and accessibility semantics remain unchanged.

## Intentional

- No copy changes.
- No validation, submission, file-upload, or data-handling changes.
- This changes the shared intake form, so the standalone intake route receives
  the same visual separation on desktop and mobile.

## Deferred

PII/backend scrubbing, storage claims, and copy changes remain deferred to their
dedicated lane.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- Browser check at `http://127.0.0.1:3130/systems/support-ticket-deflection/snapshot`
  with Turbopack dev server:
  - Desktop 1440x1100 screenshot:
    `/tmp/deflection-snapshot-separate-trust-desktop.png`; no horizontal
    overflow (`scrollWidth: 1425`, `innerWidth: 1440`), outer wrapper is
    `space-y-4`, form card top/bottom `64/688`, trust panel top `704`,
    security heading top `721`, and next section top `944`.
  - Mobile 390x844 screenshot:
    `/tmp/deflection-snapshot-separate-trust-mobile.png`; no horizontal
    overflow (`scrollWidth: 375`, `innerWidth: 390`), form card top/bottom
    `430/1253`, trust panel top `1269`, and next section top `1562`.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3130`
  - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` | ~298 |
| `web/plans/PR-Deflection-Snapshot-Separate-Trust-Panel.md` | ~78 |
| **Total** | **~376** |
