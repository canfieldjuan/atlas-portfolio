# Plan: Adopt Atlas PR discipline (plan-doc enforcement)

Port the language-agnostic core of Atlas's plan-doc PR convention and its
mechanical enforcement into this repo, so a PR's plan, its diff, and its
declared files stay aligned across sessions — before the PR goes live.

## Why this slice exists

- This repo already follows the convention *informally* — `web/plans/PR-*.md`
  docs and PR bodies with Intentional / Deferred / Verification / Diff-size —
  but there is **no mechanical enforcement**. A recent change cost ~3 hours
  because the plan's intent and the actual diff drifted apart and nothing
  caught it.
- Atlas solves exactly this with a plan-doc contract (`AGENTS.md §1–3`) plus
  audit scripts and a CI gate. Porting the portable subset closes our gap.
- This slice is **over the 400-LOC soft cap** (see Estimated diff size). That
  is justified here: the scripts, the orchestrators, the CI workflow, and the
  convention doc are an indivisible tooling slice — none functions without the
  others. Splittable on request (see Estimated diff size).

## Scope (this PR)

1. Port the three **language-agnostic** plan-doc audit scripts (pure-stdlib
   Python, no pip): plan shape, plan↔files-touched, plan↔diff-size.
2. Add trimmed `local_pr_review.sh` + `pre_push_audit.sh` orchestrators,
   repointed to `web/plans/` and extended with our Node gates.
3. Add a CI workflow that runs the plan audits + lint on PRs.
4. Add a root `AGENTS.md` documenting the PR-shape contract, adapted to this
   repo's paths and branch names.

### Files touched

- `web/plans/PR-Adopt-Atlas-PR-Discipline.md` — this plan doc (new)
- `scripts/audit_plan_doc.py` — plan-shape audit (new, ported as-is)
- `scripts/audit_plan_doc_files_touched.py` — plan↔diff files audit (new, ported as-is)
- `scripts/audit_plan_doc_diff_size.py` — plan↔diff-size audit (new, ported as-is)
- `scripts/pre_push_audit.sh` — core bundle orchestrator (new, trimmed + Node gates)
- `scripts/local_pr_review.sh` — local pre-PR runner (new, trimmed)
- `.github/workflows/pre_push_audit.yml` — CI gate (new)
- `AGENTS.md` — root PR-shape convention doc (new)

## Mechanism

- `scripts/local_pr_review.sh` (run before each PR): requires a clean tree,
  resolves base `origin/main` (or an explicit base-ref arg), runs
  `pre_push_audit.sh` **forwarding that base ref**, then `npm --prefix web run
  lint`, `npm --prefix web run build`, and `git diff --check` (whitespace). The
  Node gates live here, not in `pre_push_audit.sh`.
- `scripts/pre_push_audit.sh`: accepts an optional base-ref arg (else
  auto-resolves trunk). For each added/modified `web/plans/PR-*.md`, runs
  `audit_plan_doc.py` (required `##` sections, in order); for each
  newly-committed plan, runs `audit_plan_doc_files_touched.py` (the plan's
  "Files touched" list must equal the diff's files) and
  `audit_plan_doc_diff_size.py` (diff LOC vs declared budget). No Node gates.
- `.github/workflows/pre_push_audit.yml`: on `pull_request` + push to `main`,
  sets up Python 3.12 + Node, runs the plan audits + `npm run lint`. The full
  build is left to Vercel's existing per-PR deploy to avoid double-building.
- The three audit scripts take the plan path as an argument and are
  path-agnostic — ported unchanged except for a path-shape guard in the
  files-touched parser; only the orchestrators' `web/plans/` glob, base-ref
  threading, and the Node steps are repo-specific.

## Intentional

- **Keep the audit scripts in Python.** They're pure stdlib
  (re/sys/pathlib/subprocess/dataclasses) — no pip. CI adds one `setup-python`
  step; locally python3 is present (3.13). Porting to Node/TS is deferred — no
  functional gain now.
- **Skip the MCP / extracted-manifest / cross-layer-caller / ASCII-Python
  audits.** They target Atlas's Python data-pipeline and MCP servers; this is a
  Next.js/TS marketing site. They'd be no-ops or false failures here.
- **Skip `audit_plan_code_consistency.py`.** It parses **Python AST** and cannot
  read our TypeScript. A TS port is out of scope.
- **Add `npm run lint` + `npm run build` to the local bundle.** Atlas's gate is
  Python-audit-only; our real "does it compile / lint" gate is the Node
  toolchain. Without this the gate is toothless on our actual code.
- **CI runs lint + plan audits, not the full build** — Vercel already builds
  every PR; double-building wastes CI minutes.
- **Governance scripts live in a new root `scripts/`**, kept separate from
  `web/scripts/` (app build scripts); plan docs stay at `web/plans/`.
- **Root `AGENTS.md`** — distinct from `web/AGENTS.md` (the unrelated
  "non-standard Next.js" note), which is left untouched.

## Deferred

- `audit_pr_session_drift.py` — adopt after vetting/adapting its Atlas
  assumptions (it expects `claude/pr-*` branch naming + `.claude/` session
  layout; ours is `codex/*` / `fix/*`). Follow-up: `PR-Adopt-Session-Drift-Audit`.
- Reviewer-verdict model (BLOCKER / MAJOR / NIT / LGTM) + `AUDITOR_PROMPT.md` —
  only worthwhile if a separate reviewer session runs against this repo.
  Deferred until you decide to run one.
- Optional pre-push git hook (`core.hooksPath`) — the manual `local_pr_review.sh`
  plus the CI gate cover the need first.
- Node/TS port of the audit scripts — deferred unless the dual-runtime bothers you.
- Exclude `web/FAQs-Demos/` from git + ESLint + tsconfig — those untracked
  scratch demos break local `npm run build` / `lint` but are not app code and
  never reach CI. Surfaced by this PR's own gate. Follow-up:
  `PR-Exclude-FAQs-Demos-From-Build`.
- Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh` passes — plan shape (7/7 sections, in order),
  plan↔files-touched (8 claimed == 8 in diff), and plan↔diff-size OK (estimate
  ~810 in the Estimated diff size table; the script prints the live actual +
  drift, which stays inside the ±25% band — the moving number is not hardcoded
  here, since Verification prose is not gate-checked).
- `npm --prefix web run lint` and `npm --prefix web run build` pass on all
  **tracked** code. They currently fail only on untracked `web/FAQs-Demos/`
  scratch demo files (not in git, never reach CI/Vercel) — excluding those is a
  named follow-up (see Deferred). The full `scripts/local_pr_review.sh` bundle
  is green apart from that pre-existing untracked-file noise.
- CI (`pre_push_audit.yml`) runs the plan audits + lint against the pushed tree,
  which excludes the untracked demos, so CI is green.

## Estimated diff size

| Area | LOC |
|---|---|
| 3 plan-doc audit scripts (Python) | ~356 |
| 2 orchestrators (bash) | ~195 |
| CI workflow | ~40 |
| Root AGENTS.md | ~105 |
| This plan doc | ~115 |
| **Total** | ~810 |

Over the 400-LOC soft cap — justified in "Why this slice exists" as an
indivisible tooling-adoption slice (scripts + orchestrators + CI + convention
doc don't function apart). Splittable into (a) scripts + orchestrators + plan
and (b) CI + `AGENTS.md` on request.
