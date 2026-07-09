# PR-Agent-Runtime-Distinction

## Why this slice exists

After the CI temporal handoff arc (#485), the repo now has a safe one-shot PR
state reader but no committed distinction between agent runtimes. That matters:
Codex and Claude Code do not have the same long-running abilities.

Codex needs an external runner or bridge to wake on review/push events and to
perform low-compute timer checks. Claude Code can use its native session and PR
event behavior for that wake/poll loop, so its repo guidance should not tell it
to build unnecessary watcher infrastructure.

The same workflow docs should also state the rules builders adopt when they know
reviewers may reconstruct the PR from the diff: start from the problem, code to
the correct-fix shape, keep scope visible, and make the PR body a receipt instead
of a shield.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a root `CLAUDE.md` that gives Claude Code repo-level guidance and points
   to the PR workflow contract.
2. Update `AGENTS.md` to distinguish Codex from Claude Code for long-horizon
   work and bind builders to coding rules for independent reconstruction review.
3. Add a small portfolio `docs/CODING_FOR_RECONSTRUCTION_REVIEW.md` adapted from
   the Atlas review-reconstruction rule already on `canfieldjuan/ATLAS` main.
4. Keep `web/CLAUDE.md` as the web-directory bridge to the root Claude guidance.

### Files touched

- `web/plans/PR-Agent-Runtime-Distinction.md` - plan for the runtime distinction slice.
- `AGENTS.md` - add the platform-neutral distinction between Codex and Claude Code.
- `CLAUDE.md` - new root Claude Code guidance for this repo.
- `docs/CODING_FOR_RECONSTRUCTION_REVIEW.md` - builder rules for coding against reconstruction review.
- `web/CLAUDE.md` - point web-scoped Claude sessions back to the root guidance and Next.js note.

## Mechanism

`AGENTS.md` gets a short section after the CI temporal merge-autonomy rule:

- Codex may use `scripts/pr_state.py` as the sensor, but wake/poll/continue
  behavior must come from an external runner or operator because Codex does not
  persist a native PR subscription loop from repo files alone.
- Claude Code may use its native review/comment wake behavior and scheduled
  self-checks for long-horizon work; it still obeys the repo gates, review
  threads, and human-verdict merge rule.

The new root `CLAUDE.md` mirrors that distinction in Claude-specific language:
read `AGENTS.md`, use Claude Code's native ability for wake/poll continuation,
do not build extra watchers unless explicitly requested, and keep all merge
decisions behind observed green CI, clean review state, and the human verdict.

`docs/CODING_FOR_RECONSTRUCTION_REVIEW.md` records the builder method: start
from the problem, describe the correct-fix shape before coding, keep the diff
narrow and self-explaining, test behavior rather than story, and run the
diff/correct-fix/description self-check before push. `AGENTS.md` references that
contract from builder prep and keeps the reviewer reconstruction template as
context. `CLAUDE.md` tells Claude Code to follow the builder rules while coding,
not as an after-the-fact PR-body polish pass.

## Intentional

- No GitHub Action, webhook, timer, or merge automation is added here. This slice
  only codifies how the two runtimes should behave.
- The root `CLAUDE.md` is intentionally short. It points Claude Code to
  `AGENTS.md` as the contract instead of forking a second copy of the workflow.
- `web/CLAUDE.md` remains a tiny bridge because Next.js-specific guidance still
  lives in `web/AGENTS.md`.
- The reconstruction coding rules are documentation only. They do not add a
  blocking CI gate or require a dedicated reviewer session on every portfolio PR.

## Deferred

- If we want GitHub-hosted Claude Code invocation, add a separate slice for a
  portfolio-scoped `.github/workflows/claude.yml` and required secret setup.
- If we want Codex to run unattended, add a separate external-runner/bridge slice
  outside this repo or with an explicit repo integration plan.
- If we later want enforcement, add a separate reviewer-template or PR-body audit
  slice; this PR only records the builder contract.

Parked hardening: none

## Verification

- `grep` for the Codex/Claude Code distinction in `AGENTS.md`, `CLAUDE.md`, and
  `web/CLAUDE.md` - passed.
- `grep` for reconstruction coding-rule references in `AGENTS.md`, `CLAUDE.md`, and
  `docs/CODING_FOR_RECONSTRUCTION_REVIEW.md` - passed after builder-rule correction.
- `python scripts/audit_plan_doc.py web/plans/PR-Agent-Runtime-Distinction.md` - passed.
- `python scripts/audit_plan_doc_files_touched.py web/plans/PR-Agent-Runtime-Distinction.md` - passed.
- `python scripts/audit_plan_doc_diff_size.py web/plans/PR-Agent-Runtime-Distinction.md` - passed; actual diff is 297 LOC.
- `npm --prefix web ci` - installed dependencies in this fresh worktree before
  the full gate.
- `bash scripts/local_pr_review.sh` - passed after builder-rule correction.

## Estimated diff size

| Area | LOC |
|---|---|
| Plan doc | ~120 |
| `AGENTS.md` runtime distinction | ~30 |
| `AGENTS.md` reconstruction coding rules | ~35 |
| Root `CLAUDE.md` | ~85 |
| Reconstruction coding rules doc | ~70 |
| `web/CLAUDE.md` bridge | ~10 |
| **Total** | ~335 |
