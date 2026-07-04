# PR-CI-Temporal-Handoff

## Why this slice exists

Issue #485 logged a CI temporal audit finding: `AGENTS.md` gives agents merge
autonomy once a PR is CI-green with no actionable review, but it does not define
the post-push handoff boundary that keeps an agent from reasoning ahead of the
async Git -> CI -> review -> merge pipeline.

That gap has already produced a recorded incident in `PATTERNS.md`: the
review-watcher merged #61 on the bot approval before the human reviewer verdict
landed. The committed contract needs to carry the timing guard itself so fresh
sessions do not depend on out-of-band memory.

## Scope (this PR)

Slice phase: Workflow/process

1. Add the post-push handoff boundary to `AGENTS.md`.
2. Tighten `AGENTS.md` merge autonomy so merge requires observed green CI and the
   human reviewer verdict, with Codex approval necessary but not sufficient.
3. Keep all existing local, CI, review, and security gates intact.

### Files touched

- `web/plans/PR-CI-Temporal-Handoff.md` - plan for the CI temporal handoff slice.
- `AGENTS.md` - commit the handoff boundary and human-verdict merge guard.

## Mechanism

`AGENTS.md §3c` is rewritten from a single merge-autonomy rule into an ordered
workflow contract:

1. After opening or updating a PR, stop active reasoning and report the PR URL
   plus local checks already run.
2. Treat CI and review as async external state owned by the review-watcher or
   operator until a verdict is surfaced.
3. Reconcile only against observed CI output or delivered review threads.
4. Merge only when green CI is observed and the human reviewer verdict has
   landed, preserving the `PATTERNS.md [[pr-autonomy-rule]]` incident lesson.
5. Pick up the next slice only after the previous PR is merged.

## Intentional

- This is a contract-only repair. No workflow, watcher, or CI implementation is
  changed in this P0 slice.
- The existing merge autonomy is not removed; it is moved behind the observed
  state and human-verdict timing guard.
- `PATTERNS.md` already records the incident and resolution, so this slice
  references that rule instead of duplicating the incident entry.

## Deferred

- Slice 2 of issue #485 can add the optional one-shot PR state reporter
  (`LOCAL_DIRTY / COMMITTED / PUSHED_CI_PENDING / CI_RED / REVIEW_PENDING /
  GREEN_MERGE_READY / MERGED`) if we want an observed-state helper later.

Parked hardening: none

## Verification

- `python scripts/audit_plan_doc.py web/plans/PR-CI-Temporal-Handoff.md` - passed.
- `python scripts/audit_plan_doc_files_touched.py web/plans/PR-CI-Temporal-Handoff.md` - passed, 2 claimed files matched 2 actual files.
- `python scripts/audit_plan_doc_diff_size.py web/plans/PR-CI-Temporal-Handoff.md` - passed; the estimate remained within the allowed drift.
- `bash scripts/local_pr_review.sh` - passed after `npm --prefix web ci` installed
  this fresh worktree's missing `web/node_modules`; final gate covered plan
  audits, cross-session drift, real-adapter audit, dead-code baseline,
  deflection Snapshot landing smoke tests, ESLint, Next build, and whitespace.
- `grep` for the old merge-autonomy sentence - no stale instance found.
- `grep` for the new temporal guard phrases - found the handoff boundary,
  observed-green-CI guard, human-reviewer verdict guard, observed-output
  reconciliation rule, and next-slice-after-merge rule.

## Estimated diff size

| Area | LOC |
|---|---|
| Plan doc | ~70 |
| `AGENTS.md` §3c update | ~30 |
| **Total** | ~100 |
