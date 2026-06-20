# PR-Deflection-Snapshot-Trust-Panel-Smoke

## Why this slice exists

PR #331 separated the Snapshot intake trust panel from the form card so the
security context stays visible without crowding the intake. The shared public
reachability smoke already watches the trust-panel `deterministicBadge`, but the
Snapshot landing route smoke does not. This slice closes that route-specific
guard gap without changing UI.

## Scope (this PR)

Slice phase: Workflow/process

1. Add the existing `deterministicBadge` trust-panel marker to the Snapshot
   landing smoke's required markers.
2. Add the marker to the mocked smoke fixture and marker-key assertions.
3. Add a source assertion that the shared intake form still exposes the marker.
4. Leave visible copy, layout, intake behavior, and security claims unchanged.

### Files touched

- `web/scripts/smoke-deflection-snapshot-landing.mjs` - require the trust-panel marker.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - update fixture and source assertions.
- `web/plans/PR-Deflection-Snapshot-Trust-Panel-Smoke.md` - plan contract for this slice.

## Mechanism

The Snapshot landing smoke already parses whitespace-separated `data-smoke`
tokens from rendered HTML. Adding `deterministicBadge` to `REQUIRED_MARKERS`
makes the route smoke fail if the separated trust panel loses its primary
No-LLM marker. The mocked fixture and marker list move with the smoke contract,
and the source assertion reads `SupportTicketCsvIntakeForm.tsx`, which owns the
trust-panel markup rendered inside the Snapshot page.

## Intentional

- No runtime component changes.
- No security-claim wording changes.
- This stays marker-based; full visual regression remains outside this slice.

## Deferred

Full visual regression coverage and broader security-claim rewrites remain
deferred to their dedicated lanes.

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
| **Total** | **~69** |
