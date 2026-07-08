# Plan: Add ## Review guidelines to AGENTS.md for the Codex connector

The GitHub Codex connector reviews this repo's PRs but does not follow its review
discipline, because it ingests review guidance only from a `## Review guidelines`
section in `AGENTS.md`, which this file lacked. This slice adds that section so the
connector reviews with the same deconstruct-from-diff discipline used across repos.

## Why this slice exists

- The Codex connector (active on `canfieldjuan/atlas-portfolio`) runs its generic
  default review here because `AGENTS.md` has no `## Review guidelines` section —
  the only place the connector ingests review instructions from.
- Operator request: make the Codex connector review this repo the same way it
  reviews the other repos.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a `## Review guidelines` section to the root `AGENTS.md` with a
   self-contained deconstruct-from-diff review protocol: diff as ground truth, cite
   `file:line`, BLOCKER/MAJOR/NIT/LGTM verdicts, files-touched match, and
   web-specific hunts (metadata/noindex, stale values after renames, routes).
2. Refresh the generated deflection demo example after the ATLAS contract source
   drifted ahead of this branch; this is generated fixture output only.
3. No behavior code or tests; the connector reads the section at review time.

### Files touched

- `web/plans/PR-Review-Guidelines.md` — this plan doc (new)
- `AGENTS.md` — add the `## Review guidelines` section
- `web/src/lib/deflection-demo-example.ts` — generated contract fixture refresh
  required by the pre-push audit

## Mechanism

The Codex connector searches the repo for a `## Review guidelines` section and
follows it. The new section sits after the intro (before `## 1. PR shape`) in the
root `AGENTS.md` and states the review discipline inline (this repo has no separate
rule pack). It reuses the deconstruct-from-diff core used in Atlas, tuned for a
Next.js / landing-page repo (metadata/noindex, stale-value grep, routes).

## Intentional

- The guidelines are stated inline rather than referencing a rule pack, because this
  repo (unlike Atlas) has no `docs/REVIEWER_RULES.md`. Kept short and actionable
  rather than a full rule matrix.
- Placed in the root `AGENTS.md` (the PR/workflow file), not `web/AGENTS.md` (the
  Next.js build note), so it governs review across the whole repo.
- The deflection demo fixture refresh is included because CI rejected the stale
  generated output against the current ATLAS contract source; no handwritten demo
  or product behavior changed.

## Deferred

- None.

Parked hardening: none.

## Verification

- `npm --prefix web run generate:deflection-contracts` — refreshed the generated
  deflection demo example from the current ATLAS contract source.
- `bash scripts/local_pr_review.sh origin/main` — passed after the generated
  fixture refresh, including plan audits, real-adapter audit, dead-code baseline,
  deflection landing smoke tests, ESLint, Next build, and `git diff --check`.
- Manual: `AGENTS.md` renders without Markdown errors.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Review-Guidelines.md` | ~76 |
| `AGENTS.md` | ~23 |
| `web/src/lib/deflection-demo-example.ts` | ~2 |
| Total | ~101 |
