# PR-Deflection-Snapshot-Submit-Security-Smoke

## Why this slice exists

PR #334 added the submit-adjacent security reassurance under the Snapshot intake
button, and PR #335 polished its wrapping across breakpoints. The existing
Snapshot landing smoke requires the form submit button and the separated trust
panel, but it does not require the submit-adjacent security line itself. This
slice adds that guard so the reassurance cannot disappear unnoticed.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a stable `submitSecurityLine` smoke marker to the submit-adjacent
   reassurance line.
2. Require that marker in the public Snapshot landing smoke.
3. Update the mocked smoke fixture and marker assertions to include the marker.
4. Leave visible copy, layout, intake behavior, and security claims unchanged.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - add the submit security line marker.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - require the submit security line marker.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - update fixture and marker assertions.
- `web/plans/PR-Deflection-Snapshot-Submit-Security-Smoke.md` - plan contract for this slice.

## Mechanism

The submit-adjacent reassurance paragraph keeps the same text and styling, but
adds `data-smoke="submitSecurityLine"`. The Snapshot landing smoke already
parses whitespace-separated `data-smoke` token lists from rendered HTML, so
adding `submitSecurityLine` to `REQUIRED_MARKERS` makes local and production
route smoke fail if that line disappears. The mocked fixture and marker list
move with the smoke contract so the unit test covers the same required marker.

## Intentional

- No visible text, layout, upload, or validation behavior changes.
- This does not strengthen or reword security claims.
- The guard stays marker-based rather than visual-regression based.

## Deferred

Full visual regression coverage and broader claim rewrites remain deferred to
their dedicated lanes.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| **Total** | **~76** |
