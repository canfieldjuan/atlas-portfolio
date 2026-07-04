# PR-CI-Temporal-State

## Why this slice exists

Issue #485's P0 slice committed the post-push handoff boundary into `AGENTS.md`.
The optional P2 follow-up is a tiny observed-state helper so a resumed agent can
ask "where is this PR in the ladder?" without polling, merging, or speculating
about async CI/review state.

This slice adds that one-shot reporter. It prints a single state and exits.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a read-only PR state classifier and CLI.
2. Add a small shell wrapper for the same one-shot read.
3. Document the helper from `AGENTS.md`.
4. Cover the state ladder with pure unit tests that do not call GitHub.

### Files touched

- `web/plans/PR-CI-Temporal-State.md` - plan for the one-shot state helper slice.
- `AGENTS.md` - document the helper as a one-shot observed-state read, not a poller or merge authority.
- `scripts/pr_state.py` - implement the read-only state classifier and CLI.
- `scripts/pr_state.sh` - shell wrapper for the Python helper.
- `scripts/test_pr_state.py` - unit coverage for ladder classification.

## Mechanism

`scripts/pr_state.py` checks local state first and then, if clean, reads the
current branch PR through `gh pr view`. It classifies one state:

- `LOCAL_DIRTY` - uncommitted local changes exist.
- `COMMITTED` - clean local commits are not represented by an open PR head.
- `PUSHED_CI_PENDING` - the PR exists but checks have not finished or reported.
- `CI_RED` - at least one check has a blocking failed conclusion.
- `REVIEW_PENDING` - checks are green but the observed review/merge state is not
  ready.
- `GREEN_MERGE_READY` - checks are green, GitHub reports a clean merge state, and
  `reviewDecision` is `APPROVED`.
- `MERGED` - the PR is already merged.

The script never polls, never writes, and never merges. Tests call the pure
classifier directly with fixture dictionaries, so the test suite does not need
GitHub, network, or local repository state.

## Intentional

- The helper is conservative. `GREEN_MERGE_READY` requires `reviewDecision:
  APPROVED`, but `AGENTS.md` remains the authority that the human reviewer
  verdict is required before merge.
- `REVIEW_PENDING` intentionally covers both missing review and non-ready merge
  state; the tool is a ladder read, not a review adjudicator.
- The shell wrapper exists for operator ergonomics, while the Python entrypoint
  keeps the classifier testable.

## Deferred

- No watcher, webhook, polling loop, or merge automation is added here.

Parked hardening: none

## Verification

- `python scripts/test_pr_state.py` - passed, 8 tests.
- `scripts/pr_state.sh --json` on the dirty worktree - passed, reported
  `LOCAL_DIRTY`.
- `python scripts/audit_plan_doc.py web/plans/PR-CI-Temporal-State.md` - passed.
- `python scripts/audit_plan_doc_files_touched.py web/plans/PR-CI-Temporal-State.md` - passed, 5 claimed files matched 5 actual files.
- `python scripts/audit_plan_doc_diff_size.py web/plans/PR-CI-Temporal-State.md` - passed; the estimate remained within the allowed drift.
- `npm --prefix web ci` - installed dependencies in the fresh worktree; 0 vulnerabilities.
- `bash scripts/local_pr_review.sh` - passed; covered plan audits, cross-session
  drift, real-adapter audit, dead-code baseline, deflection Snapshot landing
  smoke tests, ESLint, Next build, and whitespace.

## Estimated diff size

| Area | LOC |
|---|---|
| Plan doc | ~80 |
| `AGENTS.md` note | ~10 |
| State helper + wrapper | ~190 |
| Tests | ~100 |
| **Total** | ~380 |
