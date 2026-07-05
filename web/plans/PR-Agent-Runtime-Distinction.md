# PR-Agent-Runtime-Distinction

## Why this slice exists

After the CI temporal handoff arc (#485), the repo now has a safe one-shot PR
state reader but no committed distinction between agent runtimes. That matters:
Codex and Claude Code do not have the same long-running abilities.

Codex needs an external runner or bridge to wake on review/push events and to
perform low-compute timer checks. Claude Code can use its native session and PR
event behavior for that wake/poll loop, so its repo guidance should not tell it
to build unnecessary watcher infrastructure.

The same workflow docs should also prepare builders for the review style we
actually want: reconstruct the PR from the diff, derive the correct fix from the
problem, then compare both against the description. That keeps PR descriptions
truthful and makes hidden scope drift or symptom patches easier to catch.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a root `CLAUDE.md` that gives Claude Code repo-level guidance and points
   to the PR workflow contract.
2. Update `AGENTS.md` to distinguish Codex from Claude Code for long-horizon
   work and bind reviewers/builders to independent PR reconstruction.
3. Add a small portfolio `docs/PR_RECONSTRUCTION_PROTOCOL.md` adapted from the
   Atlas rule already on `canfieldjuan/ATLAS` main.
4. Keep `web/CLAUDE.md` as the web-directory bridge to the root Claude guidance.

### Files touched

- `web/plans/PR-Agent-Runtime-Distinction.md` - plan for the runtime distinction slice.
- `AGENTS.md` - add the platform-neutral distinction between Codex and Claude Code.
- `CLAUDE.md` - new root Claude Code guidance for this repo.
- `docs/PR_RECONSTRUCTION_PROTOCOL.md` - independent PR reconstruction review protocol.
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

`docs/PR_RECONSTRUCTION_PROTOCOL.md` records the review method: read the diff
as ground truth, derive the correct fix from the problem without anchoring on
the diff, then compare both against the PR description. `AGENTS.md` references
that protocol from builder prep and reviewer verification. `CLAUDE.md` tells
Claude Code to build for that review: keep the diff narrow, state the actual
claim, and avoid hidden behavior or overbroad descriptions.

## Intentional

- No GitHub Action, webhook, timer, or merge automation is added here. This slice
  only codifies how the two runtimes should behave.
- The root `CLAUDE.md` is intentionally short. It points Claude Code to
  `AGENTS.md` as the contract instead of forking a second copy of the workflow.
- `web/CLAUDE.md` remains a tiny bridge because Next.js-specific guidance still
  lives in `web/AGENTS.md`.
- The reconstruction protocol is documentation only. It does not add a blocking
  CI gate or require a dedicated reviewer session on every portfolio PR.

## Deferred

- If we want GitHub-hosted Claude Code invocation, add a separate slice for a
  portfolio-scoped `.github/workflows/claude.yml` and required secret setup.
- If we want Codex to run unattended, add a separate external-runner/bridge slice
  outside this repo or with an explicit repo integration plan.
- If we later want enforcement, add a separate reviewer-template or PR-body audit
  slice; this PR only records the contract.

Parked hardening: none

## Verification

- `grep` for the Codex/Claude Code distinction in `AGENTS.md`, `CLAUDE.md`, and
  `web/CLAUDE.md` - passed.
- `grep` for reconstruction protocol references in `AGENTS.md`, `CLAUDE.md`, and
  `docs/PR_RECONSTRUCTION_PROTOCOL.md` - passed.
- `python scripts/audit_plan_doc.py web/plans/PR-Agent-Runtime-Distinction.md` - passed.
- `python scripts/audit_plan_doc_files_touched.py web/plans/PR-Agent-Runtime-Distinction.md` - passed.
- `python scripts/audit_plan_doc_diff_size.py web/plans/PR-Agent-Runtime-Distinction.md` - passed; actual diff is 271 LOC.
- `npm --prefix web ci` - installed dependencies in this fresh worktree before
  the full gate.
- `bash scripts/local_pr_review.sh` - passed after reconstruction protocol update.

## Estimated diff size

| Area | LOC |
|---|---|
| Plan doc | ~120 |
| `AGENTS.md` runtime distinction | ~30 |
| `AGENTS.md` reconstruction references | ~35 |
| Root `CLAUDE.md` | ~85 |
| Reconstruction protocol doc | ~55 |
| `web/CLAUDE.md` bridge | ~10 |
| **Total** | ~335 |
