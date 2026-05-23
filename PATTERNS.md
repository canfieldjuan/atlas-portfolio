# Emerging patterns & friction log

A living, append-only log of patterns that have caused (or nearly caused) issues
in this repo's workflow — especially around the plan-doc PR discipline (see
`AGENTS.md`). The point is to *notice* friction once and resolve it deliberately
as we tighten the discipline, rather than re-hitting it each session.

Each entry: what the pattern is, why it bit, and its status. Newest first.
`RESOLVED` entries stay for the record. `OPEN` entries are the backlog.

---

## 2026-05-23

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

### RESOLVED — Base ref not forwarded to the audit bundle
`local_pr_review.sh` accepted a base-ref arg but didn't pass it to
`pre_push_audit.sh`, which silently re-resolved trunk — wrong audited diff for a
non-default base.
**Resolution:** `pre_push_audit.sh` now takes an explicit base-ref arg;
`local_pr_review.sh` forwards it (#53 review).
