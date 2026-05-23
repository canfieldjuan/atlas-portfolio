# Emerging patterns & friction log

A living, append-only log of patterns that have caused (or nearly caused) issues
in this repo's workflow — especially around the plan-doc PR discipline (see
`AGENTS.md`). The point is to *notice* friction once and resolve it deliberately
as we tighten the discipline, rather than re-hitting it each session.

Each entry: what the pattern is, why it bit, and its status. Newest first.
`RESOLVED` entries stay for the record. `OPEN` entries are the backlog.

---

## 2026-05-23

### RESOLVED — "Invisible text" was misdiagnosed from source; `globals.css` already remapped it
The intake (#52), `/systems` (#60), and the site-wide contrast pass (#61) were
all framed as fixing `text-white` rendering invisible on light surfaces. **They
weren't invisible:** `globals.css` (from the light-theme migration #40) had
`.text-white { color: var(--text-strong) !important }`, forcing every `text-white`
to render dark at runtime. The swaps were *semantic cleanup* (use the real
`text-foreground` token instead of the `!important` band-aid), not visual fixes —
caught by the #61 reviewer (LGTM, 1 NIT).
**Lesson:** don't diagnose a CSS-visual bug from utility classes alone — render
it (or grep `globals.css` for an override) before declaring it broken. Source
tokens lie when a global `!important` rule remaps them.
**Resolution:** removed the now-dead `.text-white` override (this PR,
`PR-Remove-Dead-Text-White-Override`).

### RESOLVED — Auto-merged #61 on the bot 👍 before the human reviewer's verdict
The review-watcher merged #61 on Codex's 👍, but the independent reviewer
(`canfieldjuan`) posts a review-with-body that often lands *after* the bot — so
the human review (LGTM + the NIT above) was skipped.
**Resolution:** the merge gate is now the **human reviewer's** verdict, not the
bot's 👍 (Codex 👍 is necessary but not sufficient). See [[pr-autonomy-rule]].

### OPEN — Session-drift self-PR filter is imperfect (matters when wiring CI/--strict)
`audit_pr_session_drift.py` excludes the *current* PR from open-PR overlap by
matching branch name **or** commit OID. Two failure modes (Codex P2 + review on
#55): a different PR sharing a branch name (e.g. fork `patch-1`) is wrongly
skipped (false negative), and under a CI `pull_request` build's detached merge-ref
neither match fires, so the PR sees its **own** files as overlap (false positive).
**Impact:** none today — local-only advisory use runs on a branch where
`HEAD == headRefOid`. Bites when `--strict` is wired into CI.
**Fix when it matters:** key self-identification on the resolved **PR number**,
not branch/OID.

### OPEN — Open-PR file overlap is advisory even under --strict
By design (faithful to Atlas), the cross-PR *blocking* signal is ownership-**lane**
overlap; open-PR *file* overlap is only a heads-up. Since lanes are currently
optional/unused, flipping `--strict` would give **no** cross-PR enforcement.
**Impact:** none today (lenient). 
**Decide when tightening:** either require ownership lanes, or add
`open_pr_overlaps` to the `--strict` blocking set. Documented in `AGENTS.md §2c`.

### OPEN — Clean-tree gate trips on untracked content drafts
`scripts/local_pr_review.sh` refuses to run unless the worktree is clean, but
untracked content drafts (e.g. root `*.md` scratch files) count as "dirty", so
the gate needs `--allow-dirty` even when no tracked code is mid-edit. Untracked
files don't affect the committed-diff audits, so the strictness is broader than
needed.
**Impact:** every local gate run currently needs `--allow-dirty`.
**Options:** relax the clean-tree check to ignore *untracked* files (still block
on tracked modifications); or have the operator commit/ignore the drafts.

### OPEN — Verification prose is not gate-checked
The gate validates plan section *shape*, the files-touched *set*, and the
`| Total |` diff-size row — but nothing checks the free prose in `Verification`.
On #53 a stale `actual loc` figure and a wrong Python version both passed a green
gate.
**Impact:** Verification claims are honor-system and can drift from reality.
**Options:** add a light check (e.g. forbid hardcoded `actual loc:` figures, or
cross-check cited versions); or accept honor-system and keep brittle numbers out
of prose by convention.

### RESOLVED — `web/FAQs-Demos/` scratch demos break local build/lint
Untracked demo `.tsx`/`.jsx` files under `web/` were compiled by `next build`
and linted by `eslint .`, producing type/lint errors unrelated to app code (they
never reach CI/Vercel since they aren't committed).
**Resolution:** excluded from git + ESLint + tsconfig (this PR,
`PR-Gate-Hygiene-Friction-Log`).

### RESOLVED — `scripts/__pycache__/` dirties the tree
Running the Python audit scripts creates `scripts/__pycache__/`, which then trips
the clean-tree gate.
**Resolution:** gitignored (this PR).

### RESOLVED — Files-touched parser captured non-path backticks
`audit_plan_doc_files_touched.py` claimed *every* backtick span on a
Files-touched line, so inline code in a description (e.g. `npm run lint`) would
become a phantom claimed path and fail a future plan's gate.
**Resolution:** path-shape guard added (#53 review).

### RESOLVED — Path-shape guard alone still claimed path-shaped descriptions
The #53 guard kept *any* path-shaped backtick span, so a Files-touched
*description* mentioning a path (e.g. `FAQs-Demos/`, `*.pyc`) still became a
phantom claimed path. This PR's own plan tripped it on first run (claimed 11 vs
7 actual) — the gate catching its own tooling.
**Resolution:** parser now claims only the *first* path-shaped span per list
item (this PR, `PR-Gate-Hygiene-Friction-Log`).

### DOCUMENTED — Files-touched parser has two heuristic edges
The "first path-shaped backtick span per bullet" rule leaves two edges, accepted
as convention rather than chased with more regex (per #54 review):
- **Multi-file bullet:** `` - `a.ts` and `b.ts` — ... `` claims only `a.ts`;
  `b.ts` would phantom-`MISSING`. Convention: **one file per bullet**.
- **Extensionless root file:** `LICENSE`, `Makefile`, `Dockerfile`, `CODEOWNERS`
  aren't matched by the `/`-or-`.ext` path-shape guard, so they phantom-`MISSING`
  if a PR touches one. No clean fix yet — if it bites, add the specific name to
  `PATH_SHAPE_RE`. (Narrow: almost every file has a `/` or an extension.)
**Status:** convention pinned in `AGENTS.md §2b`; a red gate from either edge is
now a documented answer, not a re-debug.

### RESOLVED — Base ref not forwarded to the audit bundle
`local_pr_review.sh` accepted a base-ref arg but didn't pass it to
`pre_push_audit.sh`, which silently re-resolved trunk — wrong audited diff for a
non-default base.
**Resolution:** `pre_push_audit.sh` now takes an explicit base-ref arg;
`local_pr_review.sh` forwards it (#53 review).
