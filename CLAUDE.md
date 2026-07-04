# CLAUDE.md

This file gives Claude Code repo-level guidance for `canfieldjuan/atlas-portfolio`.
The workflow contract lives in `AGENTS.md`; read that file before any
non-trivial PR work.

## Claude Code Runtime Role

Claude Code is not the same runtime as Codex/API sessions.

- Claude Code can use its native PR/review/comment wake behavior and scheduled
  self-checks for long-horizon coding.
- Do not add an in-repo watcher, polling loop, or merge bot just to recreate
  Claude Code wake/poll behavior.
- The repo's `scripts/pr_state.py` helper is a one-shot observed-state read. Use
  it when resuming a PR, but do not turn it into a loop.
- Codex-specific external-runner requirements do not automatically apply to
  Claude Code. If a task asks for Codex automation, keep that separate from this
  Claude guidance.

## Long-Horizon Claude Code Loop

For approved multi-slice work:

1. Read `AGENTS.md`.
2. Plan the slice first in `web/plans/PR-<Slice-Name>.md`.
3. Implement only the planned slice.
4. Run the local gate before opening or updating the PR:

   ```bash
   bash scripts/local_pr_review.sh
   ```

5. Open the PR ready for review, not draft.
6. On review/CI wake-up, fix only observed failures or review threads. Do not
   pre-fix imagined CI or review output.
7. Resolve review threads only after the fix is pushed and verified.
8. Merge only when the repo contract is satisfied: observed green CI, clean
   merge state, no unresolved actionable review threads, and the human reviewer
   verdict required by `AGENTS.md`.
9. After merge, tear down the finished worktree and continue to the next
   approved slice if the active arc has one.

## Review Comments And Bot Findings

Codex/Copilot comments are advisory inputs. Treat P1/P2 findings seriously, but
verify them against the code before changing behavior. Do not blindly apply every
bot suggestion.

When a finding is real:

- fix the upstream cause, not only the symptom;
- add or update tests for the happy path and the edge case that exposed the gap;
- push the fix as a new commit;
- rerun the relevant local gate;
- resolve the thread only after the fix is present on the PR.

## Web-Specific Work

For work under `web/`, also read `web/AGENTS.md`. It contains the Next.js version
warning and the local framework-specific note.
