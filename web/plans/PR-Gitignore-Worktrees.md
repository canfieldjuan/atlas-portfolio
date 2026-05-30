# Plan: Gitignore in-repo git worktrees (/worktrees/)

Adds `/worktrees/` to `.gitignore` so a parallel session's git worktree created
inside the repo can't be swept into a commit by `git add -A`.

## Why this slice exists

- Parallel Claude sessions in this repo use `git worktree add worktrees/<name>`
  (the recommended pattern to avoid the shared-tree HEAD race). That dir is an
  embedded git repo at the repo root and is **not** ignored, so a routine
  `git add -A` stages it ("adding embedded git repository" warning) and would
  commit a worktree pointer. This actually happened during PR-Deflection-Results-Page
  and was caught manually. This closes the footgun repo-wide.

## Scope (this PR)

Slice phase: Workflow/process

1. **`.gitignore`** — ignore the root-level `/worktrees/` directory.

### Files touched

- `web/plans/PR-Gitignore-Worktrees.md` — this plan doc (new)
- `.gitignore` — ignore `/worktrees/`

## Mechanism

- Config-only, root-anchored (`/worktrees/`) so it only ignores the repo-root
  worktrees dir, not any unrelated nested `worktrees` path. No code, no runtime
  impact. `git check-ignore worktrees/` confirms the match.

## Intentional

- Root-anchored, not bare `worktrees/`, to avoid over-matching.
- Preventative; no worktree was ever committed.
- Built in an isolated `git worktree` off `origin/main` precisely because the
  shared working tree had a parallel session's uncommitted work — switching
  branches there would have dragged it along.

## Deferred

- None.

Parked hardening: none.

## Verification

- `git check-ignore worktrees/` matches (exit 0).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| .gitignore | ~3 |
| this plan doc | ~45 |
| **Total** | ~48 |

Well under the 400-LOC soft cap.
