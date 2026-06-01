# Plan: Deflection calculator input resync

## Why this slice exists

PR #180 fixed the landing mini calculator so out-of-range typed values are
written back to the visible number input after clamp. Review found the same
latent issue in the two sibling calculator components: if a user types an
out-of-range value that clamps to the current state value, React can skip the
state update and leave the typed value visible while the slider and output still
use the prior clamped value.

## Scope (this PR)

Slice phase: Product polish

1. Apply the visible-input re-sync pattern to the full leaky-bucket calculator.
2. Apply the same pattern to the 30-second Support Tax calculator.
3. Mark the parked hardening item as resolved.

### Files touched

- `web/plans/PR-Deflection-Calculator-Input-Resync.md` - this plan doc.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` - re-sync visible number input after clamp.
- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` - re-sync visible number input after clamp.
- `HARDENING.md` - mark `DEFLECTION-CALC-INPUT-RESYNC-1` resolved.

## Mechanism

Both calculator input helpers already parse, round, clamp, and call `onChange`.
This slice stores the clamped value in a local variable, calls `onChange`, and
then writes the clamped value back to `input.value`. That keeps the uncontrolled
number input in sync even when the clamped value equals the current React state
and React skips a re-render.

## Intentional

- This does not change calculator math, copy, ranges, defaults, routes, or CTA
  behavior.
- The landing mini calculator is not touched; it was fixed in PR #180.

## Deferred

- No additional calculator consolidation is included.

Parked hardening: none. `DEFLECTION-CALC-INPUT-RESYNC-1` is resolved by this
slice.

## Verification

- `npm --prefix web run lint` - passed.
- `rg -n "const nextValue|input\.value = String\(nextValue\)|DEFLECTION-CALC-INPUT-RESYNC-1" web/src/components/deflection-demo/SupportTaxCalculator.tsx web/src/components/deflection-demo/ThirtySecondCalculator.tsx HARDENING.md` - confirmed both sibling helpers write the clamped value back to `input.value` and the hardening entry is marked resolved.
- `bash scripts/local_pr_review.sh` - passed. This ran the plan-doc audit bundle,
  cross-session drift audit, `npm --prefix web run lint`,
  `npm --prefix web run build`, and `git diff --check`.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~60 |
| Calculator input re-syncs | ~8 |
| Hardening resolution | ~2 |
| **Total** | ~70 |
