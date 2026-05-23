# Plan: Commit the merge-autonomy policy to AGENTS.md

Resolve a doc-drift gap from #56: `AGENTS.md §3b` references "the standing
autonomy rule," but that rule is defined only in agent session memory — no
committed file. Define the policy in `AGENTS.md` so the contract is
self-contained.

## Why this slice exists

- A retro-review of #56 (code-reviewer agent) flagged it: `AGENTS.md §3b` says a
  green PR with no actionable review is merged "per the standing autonomy rule,"
  but that rule lives only in the agent's private memory. A fresh session or a
  human reviewer reading the committed contract has no way to look it up — the
  merge-autonomy behavior is split-brain (referenced in the repo, defined in
  agent memory).
- `AGENTS.md` is explicitly the agent-workflow contract, so the policy belongs
  there. Committing it makes the contract stand on its own.

## Scope (this PR)

1. Add `AGENTS.md §3c. Merge autonomy` — a self-contained statement of the
   green-and-no-actionable-review → merge policy.
2. Remove the dangling "per the standing autonomy rule" sentence from `§3b`,
   which referenced the now-committed policy.

### Files touched

- `web/plans/PR-Commit-Merge-Autonomy-Policy.md` — this plan doc (new)
- `AGENTS.md` — add §3c; drop the dangling reference in §3b

## Mechanism

- `§3b` keeps its CI-gate text and the Codex/operator-review note; its last
  sentence (the dangling reference) is removed.
- A new `§3c. Merge autonomy` states the policy concretely: CI-green + no
  actionable review (no BLOCKER/MAJOR; bot P1/P2s addressed or accepted-and-logged
  in `PATTERNS.md`) → squash-merge and pick up the next slice without separate
  sign-off; fixes are new commits (never force-push).
- The agent-memory note (`pr-autonomy-rule.md`) is updated out-of-band to point
  at this committed §3c instead of being the sole definition.

## Intentional

- **Promote, not delete** (Option A): define the policy in the committed contract
  rather than stripping the reference — `AGENTS.md` is the agent-workflow doc, so
  this is its right home, and future sessions/reviewers can look it up.
- Keep it short and behavior-only; no change to the gate or scripts.

## Deferred

- None specific.
- Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green: plan shape, files-touched
  (2 == 2), diff-size within estimate.
- `grep` confirms `AGENTS.md` no longer contains a dangling "standing autonomy
  rule" reference and that §3c defines the policy.

## Estimated diff size

| Area | LOC |
|---|---|
| this plan doc | ~70 |
| AGENTS.md §3c + §3b edit | ~12 |
| **Total** | ~82 |

Well under the 400-LOC soft cap.
