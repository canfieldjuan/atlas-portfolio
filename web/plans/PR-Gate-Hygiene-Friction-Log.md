# Plan: Gate hygiene + friction log

Post-#53 cleanup: stop untracked scratch/byproduct files from breaking or
dirtying the newly-live local gate, and start the friction log for emerging
patterns so we resolve them as we tighten the discipline.

## Why this slice exists

- #53 put the plan-doc gate live on `main`. Running it locally immediately
  surfaced noise: untracked `web/FAQs-Demos/` scratch demos break
  `npm run build` / `lint` (type + lint errors), and the Python audits leave a
  `scripts/__pycache__/`. Neither is app code; both make the local gate fail or
  report a dirty tree.
- The operator asked to keep a living log of emerging patterns that cause
  issues, resolved as we move forward. This slice starts that log and clears the
  first two patterns it records.

## Scope (this PR)

1. Exclude `web/FAQs-Demos/` from git, ESLint, and TypeScript so it stops
   breaking local build/lint.
2. Ignore the `scripts/__pycache__/` byproduct of the Python audit scripts.
3. Add `PATTERNS.md`, seeded with the friction surfaced during the
   Atlas-discipline adoption, and point to it from `AGENTS.md`.
4. Harden `audit_plan_doc_files_touched.py` to claim only the first path-shaped
   backtick span per list item — the gate caught that the #53 path-shape guard
   still claimed path-shaped backticks inside descriptions (this PR's own plan
   tripped it on first run — claimed 11 vs 7 — before the parser fix and the
   8th file settled the gate at claimed 8 / actual 8).

### Files touched

- `web/plans/PR-Gate-Hygiene-Friction-Log.md` — this plan doc (new)
- `web/.gitignore` — ignore `FAQs-Demos/`
- `.gitignore` — ignore `__pycache__/` and `*.pyc`
- `web/eslint.config.mjs` — add `FAQs-Demos/**` to global ignores
- `web/tsconfig.json` — add `FAQs-Demos` to `exclude`
- `scripts/audit_plan_doc_files_touched.py` — harden parser: first path-shaped span per list item
- `PATTERNS.md` — new friction log (new)
- `AGENTS.md` — pointer to `PATTERNS.md`

## Mechanism

- ESLint flat config: add `"FAQs-Demos/**"` to the existing `globalIgnores([...])`
  so `eslint .` skips the demos.
- tsconfig: add `"FAQs-Demos"` to `exclude` so `next build`'s type-check skips it.
- `web/.gitignore`: `FAQs-Demos/` stops the demos showing as untracked.
- root `.gitignore`: `__pycache__/` + `*.pyc` stop the audit scripts' byproduct
  from dirtying the tree (which trips `local_pr_review.sh`'s clean-tree gate).
- `PATTERNS.md`: a dated, append-only log; each entry names the pattern, its
  impact, and status. `AGENTS.md` gains a one-line pointer.
- `audit_plan_doc_files_touched.py`: now stops after the first path-shaped
  backtick span on each Files-touched line, so path-shaped text in a description
  (e.g. `FAQs-Demos/`) is no longer mis-claimed as a touched file.

## Intentional

- Keep the demos on disk (still useful as references) — just out of
  git/lint/build. They are scratch, not app code.
- Do **not** gitignore the operator's untracked root content drafts — those are
  content, not byproduct. The clean-tree-vs-drafts friction is logged in
  `PATTERNS.md` for a later decision (relax clean-tree to ignore untracked vs
  track/ignore the drafts), not resolved here.
- Bundle the exclusions and the log: both are post-#53 gate hygiene that
  surfaced together; the log's first entries are these exclusions.

## Deferred

- Resolving the logged-but-open patterns (clean-tree vs untracked drafts;
  Verification prose not gate-checked) — tracked in `PATTERNS.md`, resolved as we
  tighten the discipline.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` and `npm --prefix web run build` pass with
  `FAQs-Demos` excluded — the failures #53 surfaced are gone.
- `bash scripts/pre_push_audit.sh` green: plan shape (7/7, in order),
  files-touched (claimed == diff), diff-size within the estimate band.

## Estimated diff size

| Area | LOC |
|---|---|
| This plan doc | ~110 |
| PATTERNS.md (new log) | ~63 |
| gitignore + eslint + tsconfig + AGENTS pointer | ~15 |
| files-touched parser hardening | ~7 |
| **Total** | ~180 |

Well under the 400-LOC soft cap.
