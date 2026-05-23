# AGENTS.md — PR workflow for atlas-portfolio

This repo uses a **plan-doc-driven PR discipline**, ported from the Atlas
project (`canfieldjuan/ATLAS`). The plan is the contract; the code implements
it. A mechanical gate checks that the plan, the diff, and the declared files
stay aligned — so intent and implementation can't silently drift across
sessions.

> Scope note: this file governs the **PR/agent workflow**. It is unrelated to
> `web/AGENTS.md`, which is a Next.js-specific build note.

---

## 1. PR shape

Every non-trivial change ships as a single PR with these artifacts.

### 1a. Plan doc (`web/plans/PR-<Slice-Name>.md`)

Required `##` sections, **in this order** (enforced by
`scripts/audit_plan_doc.py`):

| Section | Purpose |
|---|---|
| **Why this slice exists** | What's broken / missing / which request this closes. |
| **Scope (this PR)** | The narrow surface this PR touches. Numbered intent + a `### Files touched` subsection listing every file in backticks. |
| **Mechanism** | How the change works — enough that the reviewer needn't reverse-engineer it from the diff. |
| **Intentional** | Things that look wrong but aren't — explicit trade-offs and rejected alternatives. |
| **Deferred** | What's punted to a follow-up, and what would unlock it. |
| **Verification** | The exact commands run locally + their results. |
| **Estimated diff size** | A table with a `\| Total \| ~N \|` row (enforced by `scripts/audit_plan_doc_diff_size.py`). Flag if over the 400-LOC soft cap. |

### 1b. PR body

Mirror the plan: lead with `Plan: web/plans/PR-<Slice-Name>.md`, then a
one-paragraph why, then `## Intentional`, `## Deferred`, `## Verification`,
`## Diff size`.

### 1c. Commit message

Same `Plan: ...` lead line + Intentional / Deferred sections. Squash-merge
collapses to one canonical commit (this repo squash-merges).

### 1d. Diff budget

Target **< 400 LOC** per PR. Soft cap; an indivisible larger slice ships if the
plan's "Why this slice exists" justifies the overage.

### 1e. Branch naming

`claude/pr-<slice-name>` for agent-built PR branches **going forward** — the
convention adopted with this tooling. Branches predating it use `codex/*` /
`fix/*`; those are fine as-is, no renaming needed.

### 1f. Open ready for review

Open PRs as ready for review (not draft) — automated reviewers and Vercel
previews don't run on drafts.

---

## 2. Builder workflow

### 2a. Plan first

Write the full `web/plans/PR-<Slice-Name>.md` **before** any code change. If the
plan changes mid-implementation, update the plan doc in the same commit — plan
and code ship together.

### 2b. Files touched is exact

The `### Files touched` list must equal the PR's diff exactly — no missing, no
extra files (enforced by `scripts/audit_plan_doc_files_touched.py`). This is the
check that catches "the model touched files I didn't expect."

### 2c. Run the gate before opening or updating a PR

```bash
bash scripts/local_pr_review.sh
```

This requires a clean worktree, then runs:

1. **Plan-doc audit bundle** (`scripts/pre_push_audit.sh`) — plan shape,
   plan↔files-touched, plan↔diff-size, for any `web/plans/PR-*.md` in the diff.
2. **ESLint** (`npm --prefix web run lint`).
3. **Next build** (`npm --prefix web run build`).
4. **Whitespace** (`git diff --check`).

CI (`.github/workflows/pre_push_audit.yml`) mirrors the plan audits + lint on
every PR; the full build is covered by Vercel's per-PR preview.

---

## 3. Intentionally not adopted (yet)

Ported deliberately as a subset of Atlas's tooling. Not here, on purpose:

- **MCP / extracted-package / cross-layer / ASCII-Python audits** — Atlas
  data-pipeline checks that don't apply to a Next.js/TS site.
- **`audit_plan_code_consistency.py`** — parses Python AST; can't read our TS.
- **`audit_pr_session_drift.py`** — deferred until adapted from Atlas's
  `claude/pr-*` / `.claude/` assumptions to this repo's conventions.
- **Reviewer-verdict model** (BLOCKER / MAJOR / NIT / LGTM) + a separate
  reviewer session — adopt if/when we run independent review here.

See `web/plans/PR-Adopt-Atlas-PR-Discipline.md` for the adoption rationale.
