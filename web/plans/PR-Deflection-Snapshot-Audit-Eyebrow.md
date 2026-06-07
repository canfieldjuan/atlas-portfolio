## Why this slice exists

Issue #266 points out that the Snapshot artifact card eyebrow says
`BEFORE / AFTER SNAPSHOT PROOF`, but the card is not a before/after
comparison. It shows what the audit finds in the uploaded ticket backlog:
customer wording, repeat volume, Support Tax estimate, and one draft answer.

Keeping the before/after label overstates the section and implies a comparison
against an existing FAQ state the buyer may not have. This slice reframes the
eyebrow as discovery/audit output while leaving the section's descriptive H2
unchanged.

## Scope (this PR)

Slice phase: Product polish

1. Replace the Snapshot artifact card eyebrow with `WHAT THE AUDIT FINDS`.
2. Update the section `aria-label` so the hidden accessibility name does not
   retain the old before/after framing.
3. Update the focused landing smoke marker names and fixtures to pin the new
   eyebrow text.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Audit-Eyebrow.md` - plan for this slice.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - visible
  eyebrow and section accessibility label.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - required marker label.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - smoke fixture and
  missing-marker assertion.

## Mechanism

The visible eyebrow changes from:

```tsx
BEFORE / AFTER SNAPSHOT PROOF
```

to:

```tsx
WHAT THE AUDIT FINDS
```

The smoke helper continues to require the eyebrow marker, but under an
`auditFinds` key so future failures describe the intended concept instead of
the retired before/after frame.

## Intentional

- The H2 `The Snapshot shows what repeats, what it costs, and one answer.` is
  unchanged because it already describes the card accurately.
- The hidden `aria-label` changes with the eyebrow because screen-reader users
  should not get the stale before/after framing.
- No upload, checkout, pricing, artifact, or layout behavior changes are in
  scope.

## Deferred

- No further landing-page copy sweep is included here. This slice only closes
  the specific #266 mismatch.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS;
  printed `Deflection Snapshot landing smoke tests passed.`
- `npm --prefix web run lint -- src/components/landing/DeflectionSnapshotLandingPage.tsx scripts/smoke-deflection-snapshot-landing.mjs scripts/test-deflection-snapshot-landing-smoke.mjs` - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `rg -n "BEFORE / AFTER SNAPSHOT PROOF|Before and after Deflection Snapshot proof|beforeAfterProof" web/src web/scripts` - PASS; exited 1 with no output, confirming no stale runtime or smoke marker copy remains.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +80 |
| Landing copy | +2 / -2 |
| Smoke marker/test fixture | +5 / -5 |
| Total | ~99 changed |
