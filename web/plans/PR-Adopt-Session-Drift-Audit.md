# Plan: Adopt the cross-session drift audit (lenient)

Port Atlas's `audit_pr_session_drift.py` and wire it into the local gate as an
**advisory** check, so a builder sees when `main` or another open PR touches the
same files — without blocking. Tighten to enforcing later.

## Why this slice exists

- The plan-doc gate (#53/#54) keeps a single PR's plan, diff, and files aligned,
  but says nothing about *concurrent* work. The original 3-hour miscommunication
  was partly a multi-session problem; this audit is the piece that catches it.
- The operator chose to start **lenient** ("tighten as we work"), so this lands
  the detection (base drift + open-PR file overlap + optional ownership-lane
  overlap) as advisory output, not a hard gate.
- Over the 400-LOC soft cap (see Estimated diff size): the ported audit script is
  a single indivisible unit (~425 LOC); splitting it would ship a non-functional
  half. Same justification pattern as #53.

## Scope (this PR)

1. Port `audit_pr_session_drift.py`, adapted: plan glob `plans/` → `web/plans/`,
   ownership lanes optional, advisory-by-default with a `--strict` opt-in.
2. Wire it into `scripts/local_pr_review.sh` as an advisory check (exits 0).
3. Document it in `AGENTS.md §2c` (and note lanes are optional).

### Files touched

- `web/plans/PR-Adopt-Session-Drift-Audit.md` — this plan doc (new)
- `scripts/audit_pr_session_drift.py` — ported + adapted audit (new)
- `scripts/local_pr_review.sh` — run the drift audit (advisory) in the bundle
- `AGENTS.md` — document the drift check in the gate list

## Mechanism

- The audit compares three things: files this branch changed vs base; files
  `main` changed since the branch point (overlap = base drift); and files each
  other open PR changed (overlap = a heads-up). It also flags two open PRs
  declaring the same `Ownership lane:` — but lanes are **optional**.
- **Lenient:** `main()` prints findings and exits 0 by default; `--strict` makes
  blocking findings exit non-zero. `branch_ownership` no longer requires a lane.
- `local_pr_review.sh` runs it via `run_check` after the plan-doc bundle; because
  it exits 0, the check always passes but its output (any overlap) is printed.
- Kept **local-only** (not in CI), matching Atlas: the open-PR overlap needs `gh`
  and is most useful to the builder before pushing.

## Intentional

- **Advisory, not blocking** — the operator asked to start lenient. `--strict` is
  the single switch to tighten later; no other rewrite needed.
- **Ownership lanes optional** — the lane machinery is ported (so it's ready) but
  never required; our plan docs don't declare lanes yet.
- **Local-only** — no CI wiring this slice; the GitHub-PR-overlap part wants `gh`
  auth and the base-drift part is advisory.
- Renamed the Atlas-specific `ATLAS_SKIP_PR_SESSION_DRIFT_GITHUB` env var to
  `SKIP_PR_SESSION_DRIFT_GITHUB`.

## Deferred

- Tightening to `--strict` (block on base drift / lane overlap) — when concurrent
  sessions become common. Tracked alongside the lenient→strict note in `AGENTS.md`.
- Making ownership lanes a required plan-doc field (and gate-enforcing them).
- CI wiring, if the base-drift check proves worth running server-side.
- Parked hardening: none.

## Verification

- `python3 scripts/audit_pr_session_drift.py origin/main` runs and exits 0
  (advisory), reporting base/open-PR overlap.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape, files-touched,
  diff-size).
- `npm --prefix web run lint` + `build` unaffected (Python-only change).

## Estimated diff size

| Area | LOC |
|---|---|
| session-drift script (ported + adapted) | ~425 |
| this plan doc | ~90 |
| local_pr_review.sh + AGENTS.md wiring/docs | ~16 |
| **Total** | ~530 |

Over the 400-LOC soft cap — justified in "Why this slice exists" as an
indivisible script port.
