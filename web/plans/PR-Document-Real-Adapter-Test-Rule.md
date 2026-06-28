## Why this slice exists

Recent test-review feedback caught builders still writing fake pool and
query-string checks even when the repo has real adapters available. The rule was
useful in review, but it was not present on `main`, so the next builder session
could miss it before starting another slice.

This workflow slice lands the rule in the repo-level agent contract so future
test work starts from the same standard: use the real adapter when the codebase
already provides one, and name any exception in the plan instead of silently
approximating production behavior.

## Scope (this PR)

Slice phase: Workflow/process

1. Add an `AGENTS.md` test-adapter discipline rule requiring real adapters when
   they exist.
2. Clarify that mocks belong at external boundaries, not in place of the module
   or adapter under review.
3. Require plan-visible exceptions when a real adapter cannot be used.

### Files touched

- `AGENTS.md` — add the real-adapter testing rule.
- `web/plans/PR-Document-Real-Adapter-Test-Rule.md` — plan for this workflow
  slice.

## Mechanism

The new `AGENTS.md` section sits under reviewer workflow because it governs what
reviewers should accept and what builders should produce in test slices. It uses
three concrete rules:

1. Import the real repo module or adapter through the normal code path.
2. Keep mocks at external boundaries such as console, clock, network, storage,
   environment, or fixture data.
3. Put any exception in the plan's Intentional or Deferred section so reviewers
   can see the trade-off.

## Intentional

- This PR is documentation-only. It does not migrate any existing tests; that
  belongs to the active real-adapter testing lane.
- The rule allows boundary mocks because tests still need deterministic inputs
  and observable side-effect spies. The prohibited pattern is replacing an
  available repo adapter with a local approximation.

## Deferred

The enforcement audit remains deferred to the planned follow-up that blocks new
fabricated local stubs mechanically.

Parked hardening: none

## Verification

rg -n "fake pools|query-string|real adapter|Test adapter discipline" AGENTS.md web/plans/PR-Document-Real-Adapter-Test-Rule.md # PASS
bash scripts/local_pr_review.sh # PASS

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `AGENTS.md` | ~14 |
| `web/plans/PR-Document-Real-Adapter-Test-Rule.md` | ~58 |
| Total | ~72 |
