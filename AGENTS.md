# AGENTS.md — PR workflow for atlas-portfolio

This repo uses a **plan-doc-driven PR discipline**, ported from the Atlas
project (`canfieldjuan/ATLAS`). The plan is the contract; the code implements
it. A mechanical gate checks that the plan, the diff, and the declared files
stay aligned — so intent and implementation can't silently drift across
sessions.

> Scope note: this file governs the **PR/agent workflow**. It is unrelated to
> `web/AGENTS.md`, which is a Next.js-specific build note.

---

## Review guidelines

Automated reviewers — including the GitHub Codex connector, which reads this
section — treat the code and diff as ground truth; the PR description and commit
messages are unverified claims.

- Reconstruct the diff independently: state what each change actually does, change
  by change, in your own words. Do not read intent from the description. Report gaps
  between what the diff does, what a correct fix should do, and what the description
  claims.
- Cite `file:line` for every finding. Classify each as **BLOCKER / MAJOR / NIT /
  LGTM**; blockers must cite `file:line`. Lead with the blockers.
- Check the plan's `### Files touched` against the actual diff — they must match.
- Hunt: correctness on the primary path, security (secrets, injection, auth on any
  gated route), data/config drift (after a rename, grep for the old value — no stale
  instance may remain), frontend behavior and metadata (routes, noindex/robots,
  canonical, copy strings), accessibility, resource/perf.
- Only BLOCKER (broken correctness/security, dead link, wrong price/route shipped)
  and MAJOR (breaks a primary or plausible path, silent failure) block. NITs are
  non-blocking, and "LGTM — no BLOCKER/MAJOR" is a valid, complete result.

---

## 1. PR shape

Every non-trivial change ships as a single PR with these artifacts.

### 1a. Plan doc (`web/plans/PR-<Slice-Name>.md`)

Required `##` sections, **in this order** (enforced by
`scripts/audit_plan_doc.py`):

| Section | Purpose |
|---|---|
| **Why this slice exists** | What's broken / missing / which request this closes. |
| **Scope (this PR)** | Open with a `Slice phase: <phase>` line (see §2e), then the narrow surface this PR touches: numbered intent + a `### Files touched` subsection listing every file in backticks. |
| **Mechanism** | How the change works — enough that the reviewer needn't reverse-engineer it from the diff. |
| **Intentional** | Things that look wrong but aren't — explicit trade-offs and rejected alternatives. |
| **Deferred** | What's punted to a follow-up, and what would unlock it. End with `Parked hardening: none` or the `HARDENING.md` entry titles this slice added (see §2e). |
| **Verification** | The exact commands run locally + their results. If the slice changed a value that recurs (a number, label, route, copy string), **grep the repo for the old value and confirm no stale instance remains** — or name each remaining one in **Deferred**. |
| **Estimated diff size** | A table with a `\| Total \| ~N \|` row (enforced by `scripts/audit_plan_doc_diff_size.py`). Flag if over the 400-LOC soft cap. |

### 1b. PR body

Mirror the plan: lead with `Plan: web/plans/PR-<Slice-Name>.md` and a
`Slice phase: <phase>` line, then a one-paragraph why, then `## Intentional`,
`## Deferred`, `## Parked hardening` (`None.` or the `HARDENING.md` titles added),
`## Verification`, `## Diff size`.

### 1c. Commit message

Same `Plan: ...` + `Slice phase: ...` lead lines + Intentional / Deferred /
Parked hardening sections. Squash-merge collapses to one canonical commit (this
repo squash-merges).

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

**Bullet format the parser expects:** one file per bullet, its path the **first**
path-shaped backtick span on the line — `` - `path/to/file` — description ``.
The parser claims only that first span, so backtick'd paths *inside* the
description are ignored. Two heuristic edges are accepted as convention (logged
in `PATTERNS.md`) rather than chased with more regex: a bullet listing two files
in backticks claims only the first (so list **one file per bullet**), and an
extensionless root file (`LICENSE`, `Makefile`) isn't recognized as path-shaped.

### 2c. Run the gate before opening or updating a PR

```bash
bash scripts/local_pr_review.sh
```

This requires a clean worktree, then runs:

1. **Plan-doc audit bundle** (`scripts/pre_push_audit.sh`) — plan shape,
   plan↔files-touched, plan↔diff-size, for any `web/plans/PR-*.md` in the diff.
2. **Cross-session drift** (advisory) — `scripts/audit_pr_session_drift.py` flags
   files that `main` or another open PR also changed (and overlapping ownership
   lanes, which are optional). Informational; exits 0 until tightened with
   `--strict`. Under `--strict` the blocking signals are base drift and
   ownership-lane overlap; open-PR *file* overlap stays advisory (lanes are the
   cross-PR block — revisit if you tighten while lanes are unused). See
   `PATTERNS.md`.
3. **Real adapter test audit** (`npm --prefix web run check:real-adapter-tests`).
4. **Dead code baseline** (`npm --prefix web run check:dead-code`).
5. **Deflection Snapshot landing smoke tests**
   (`npm --prefix web run test:deflection-snapshot-landing-smoke`).
6. **ESLint** (`npm --prefix web run lint`).
7. **Next build** (`npm --prefix web run build`).
8. **Whitespace** (`git diff --check`).

CI (`.github/workflows/pre_push_audit.yml`) mirrors the plan audits + lint on
every PR; the full build is covered by Vercel's per-PR preview.

### 2d. Friction log

When a workflow pattern causes (or nearly causes) an issue, record it in
`PATTERNS.md` and resolve it deliberately as the discipline tightens — rather
than re-hitting it each session. `PATTERNS.md` is **workflow/process friction**;
deferred **product/code risk** goes in `HARDENING.md` (see §2e).

### 2e. Slice phases & hardening triage

Every plan names a `Slice phase:` in `Scope (this PR)`; the PR body and commit
repeat it. The phases:

| Phase | Use when |
|---|---|
| `Vertical slice` | Building the thinnest end-to-end path that proves the real flow. |
| `Functional validation` | Proving the finished flow works on representative inputs. |
| `Robust testing` | Pushing scale / failure / integration edges after the flow works. |
| `Production hardening` | Closing survivability, security, durability, and operational gaps. |
| `Product polish` | UX, copy, defaults, ergonomics after the core behavior is proven. |
| `Workflow/process` | Changing repo workflow, review contracts, audits, or tooling — not product behavior. |

Normal order is `Vertical slice → Functional validation → Robust testing →
Production hardening → Product polish`. Small corrections can go out of order; the
plan just names why the phase fits now.

**Triage rule.** Fix inline *only* what the slice cannot function without — the
stated flow, the `AGENTS.md` contract / the plan / CI, security guards the slice
introduces, output truthfulness, and reviewer BLOCKERs. Everything else found
while working (non-blocking error-handling gaps, missing validation, naming,
refactors, edge cases) is appended to root `HARDENING.md` and left **out** of the
diff. Each `HARDENING.md` entry carries: file/location, one-line description, why
it matters, effort (`S`/`M`/`L`), category (`correctness`/`polish`/`tech-debt`/
`security`), and the slice it was found in.

Report parked work in the plan's `Deferred` (`Parked hardening: none` or the entry
titles) and the PR body's `## Parked hardening`. At each slice start, scan
`HARDENING.md` for entries touching the same files; fix only what this slice needs,
and during a `Production hardening` phase promote the entries that are the reason
the slice exists.

---

## 3. Reviewer verdicts

When a separate reviewer session audits a PR (optional — prompt in
`AUDITOR_PROMPT.md`), it comments **once per push** with a verdict:

| Level | Meaning | Builder action |
|---|---|---|
| **BLOCKER** | Correctness, security, contract break, or CI red. | Fix before merge. |
| **MAJOR** | Architectural / scope / pattern concern. | Fix if small; else discuss before deferring. |
| **NIT** | Style, naming, comment polish. | Apply if 1-line; else skip. Reviewer marks NITs skip-worthy. |
| **LGTM** | Gates green, no remaining concerns. | Merge. |

### 3a. Independent verification

The reviewer reproduces, rather than trusting prose — Verification prose is not
gate-checked (see `PATTERNS.md`):

```
**Verification (independent):**
1. <claim from PR / plan> — verified via <command>
2. <invariant from Mechanism> — confirmed at <file:line>

**Plan-doc compliance:** Why / Scope / Files touched / Mechanism / Intentional /
Deferred / Verification / Estimated diff size — matches AGENTS.md.

**<N> NITs (skip-worthy):** ...

LGTM. (or: BLOCKER — ...)
```

### 3b. CI gate

CI must be green before LGTM. A transient/flaky failure can be called out
separately rather than block.

Today the Codex bot auto-reviews each push (P1/P2 inline) and the operator
reviews by hand; a dedicated reviewer session is optional, not required per PR.

### 3c. Merge autonomy

Git -> CI -> review -> merge is asynchronous and ordered. Pushing is what starts
the external CI/review state; do not reason ahead of state that has not landed.

**Handoff after push.** After opening or updating a PR, stop active reasoning.
Do not poll CI or wait for review in-session. Report the PR URL and the local
checks already run, then hand off to the review-watcher or operator for the next
transition. Resume only when a verdict or observed check state is surfaced.

Reconcile only against observed output: a real red check's logs or a delivered
review thread. Never pre-fix expected failures, imagined CI output, or review
comments that have not been posted.

For a resumed session that needs one observed PR state read, run
`python scripts/pr_state.py` or `scripts/pr_state.sh`. It prints one ladder state
(`LOCAL_DIRTY`, `COMMITTED`, `PUSHED_CI_PENDING`, `CI_RED`, `REVIEW_PENDING`,
`GREEN_MERGE_READY`, or `MERGED`) and exits. It is not a poller, watcher, review
adjudicator, or merge authority.

A PR is mergeable only when **green CI is observed** and the **human reviewer's
verdict has landed**. The bot/Codex approval is necessary but not sufficient;
the recorded rule is PATTERNS.md [[pr-autonomy-rule]]. With that timing guard
satisfied, a PR with **no actionable review** is squash-merged and the next slice
is picked up, without a separate explicit sign-off. **No actionable review**
means, per verdict level:

- **BLOCKER** - none open; must be fixed first.
- **MAJOR** - fixed, or explicitly accepted by the operator and logged in
  `PATTERNS.md` (the §3 table's "discuss before deferring"). The agent does not
  defer a MAJOR on its own.
- **bot P1/P2** - addressed, or accepted-and-logged in `PATTERNS.md`.
- **NIT** - never blocks.

The next slice starts only after the previous slice's PR is merged. Fixes go in
as new commits (never force-push); squash-merge collapses them.

### 3e. Test adapter discipline

1. **Use real test adapters when they exist.** Tests must exercise repo modules
   through their normal imports (`@/`, package entrypoints, or the real adapter
   exported by the codebase) instead of re-creating fake pools, query-string
   parsers, HTTP shims, or local mini-adapters that approximate production
   behavior.
2. **Mock only the external boundary.** It is fine to spy on console output,
   freeze time, stub network/storage/env, or provide fixture data, but the
   adapter or module whose behavior is under review stays in the call path.
3. **Name any exception in the plan.** If no real adapter exists yet, or if a
   real adapter cannot be used in the slice, the plan's Intentional or Deferred
   section must say why and name the follow-up that would make the test real.

---

## 4. Anti-patterns

Never in a PR or review:

- **Drive-by formatting** unrelated to the slice — format-only diffs ship as their
  own slice.
- **Plan doc in a follow-up commit** — plan and code ship together (§2a).
- **"While I was here" cleanups** not required for the slice to function — add a
  `HARDENING.md` entry and move on (§2e).
- **Bypassing the gate** with `--no-verify` or force-push unless the operator names
  it in the latest message.
- **Reviewer rubber-stamping** — a green gate doesn't prove the diff matches the
  plan; spot-check the diff, don't just trust a green test sweep.
- **Builder applying every NIT** — apply only the 1-line / unambiguous ones; skip
  the ones the reviewer marked skip-worthy.
- **Value swept in one place, stale elsewhere** — changing a recurring value (a
  number, label, route, copy string) without grepping the old value to confirm no
  stale or contradicting instance survives. Caught three times in review
  (#76/#77/#78); the §1a Verification grep step is the guard.

---

## 5. Intentionally not adopted (yet)

Ported deliberately as a subset of Atlas's tooling. Not here, on purpose:

- **MCP / extracted-package / cross-layer / ASCII-Python audits** — Atlas
  data-pipeline checks that don't apply to a Next.js/TS site.
- **`audit_plan_code_consistency.py`** — parses Python AST; can't read our TS.
- **Ownership lanes** — Atlas's cross-PR coordination for concurrent builders;
  we're effectively single-threaded and the drift audit already treats lanes as
  optional. (We adopted `Slice phase:` but not the `Ownership lane:` line.)
- **Auditor fixture tests (Atlas §3h)** + the heavier pytest discipline — our gate
  is lint + build + Vercel; revisit if we extend the `audit_plan_doc*.py` scripts.
- **A separate debt register (`docs/technical-debt/`)** — `HARDENING.md` is our
  parked-risk queue; promotion path is a follow-up plan, not a register.

(Adopted since: `audit_pr_session_drift.py` lenient/advisory in #55; the
reviewer-verdict model + `AUDITOR_PROMPT.md` in #56–57; slice phases, the
`HARDENING.md` register + parked-hardening triage, and the anti-patterns list in
this slice.)

See `web/plans/PR-Adopt-Atlas-PR-Discipline.md` for the original adoption rationale.
