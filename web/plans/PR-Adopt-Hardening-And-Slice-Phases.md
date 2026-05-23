# Plan: Adopt Atlas's hardening register, slice phases, and anti-patterns

Re-sync of the Atlas (`canfieldjuan/ATLAS`) PR/feature-building conventions into
this repo. Atlas's `AGENTS.md` has grown to 598 lines; most of the growth is
Atlas-specific (Python per-package guardrails, the extracted-package manifest,
Kimi-worker routing, ~30 domain audits) and stays out. This slice ports the
three **generic** build patterns the operator selected.

## Why this slice exists

- The operator updated the Atlas rules and wants this repo's PR-creation and
  feature-building discipline to stay aligned where it generically applies.
- Two of the three patterns are already being *improvised* here without backing:
  I've written "Parked hardening: none" in every plan doc this session with no
  formal convention, and the deflection go-live gate (4 `mapAtlasMatch` items) is
  parked in `PATTERNS.md` for lack of a proper home. This formalizes both.

## Scope (this PR)

Slice phase: Workflow/process

1. **`HARDENING.md`** (new, root) — a parked-hardening register mirroring Atlas's
   format (dated, newest-first, structured entries). Seed it by migrating the
   deflection go-live gate out of `PATTERNS.md`.
2. **`AGENTS.md`** — add the `Slice phase:` convention to the plan template / PR
   body / commit; add a "Slice phases & hardening triage" subsection; add an
   "Anti-patterns" section; refresh "Intentionally not adopted" to record what
   this slice adopts vs the Atlas-specific bits still skipped.
3. **`PATTERNS.md`** — convert the go-live-gate entry to a MOVED pointer and
   document the `PATTERNS.md` (workflow friction) vs `HARDENING.md` (parked
   product/code risk) boundary.

### Files touched

- `web/plans/PR-Adopt-Hardening-And-Slice-Phases.md` — this plan doc (new)
- `HARDENING.md` — parked-hardening register + migrated go-live gate (new)
- `AGENTS.md` — slice phases, hardening triage, anti-patterns, adoption note
- `PATTERNS.md` — go-live-gate entry → MOVED pointer + the two-logs boundary

## Mechanism

- **`HARDENING.md`** carries the Atlas entry shape (File/location, Description,
  Why it matters, Effort S/M/L, Category, Found-during slice) under dated headers,
  newest-first, plus the "only park non-slice-breaking work; scan at slice start;
  promote during hardening phases" rules — adapted to drop Atlas-only bits
  (ownership lanes, the `docs/technical-debt/` register).
- **Slice phases** are a convention line in the plan's `Scope` (`Slice phase:
  <phase>`), echoed in the PR body + commit — **not** a new enforced `##` section,
  so `audit_plan_doc.py` is unchanged. The 6-phase taxonomy is documented in a new
  `AGENTS.md §2e`.
- **Parked hardening** is a line inside the plan's existing `Deferred` section
  ("Parked hardening: none" or the `HARDENING.md` titles added) + a `## Parked
  hardening` block in the PR body — again no audit change.
- **Anti-patterns** is a documentation-only `AGENTS.md` section.
- **Migration:** the go-live gate's four items become one cohesive `HARDENING.md`
  entry (`DEFLECTION-GOLIVE-1`); the `PATTERNS.md` entry is kept (the log retains
  RESOLVED/MOVED entries) but rewritten to point at `HARDENING.md`.

## Intentional

- **No tooling/audit changes** — slice phases and parked-hardening are conventions
  in prose sections the shape audit already allows; enforcing them via the audit
  would be scope creep and is deferred.
- **Dropped the Atlas-only pieces of the hardening model:** ownership lanes (we're
  effectively single-threaded; the drift audit already treats lanes as optional)
  and the `docs/technical-debt/` debt register (we don't have one; a follow-up plan
  is our promotion path).
- **`PATTERNS.md` vs `HARDENING.md` split is deliberate:** `PATTERNS.md` = workflow
  /process friction (the discipline itself biting); `HARDENING.md` = deferred
  product/code risk from a slice. The go-live gate is the latter, so it moves.
- **This plan dogfoods the new conventions** (the `Slice phase:` line above and
  "Parked hardening" below) so the first use is also the worked example.

## Deferred

Parked hardening: none.

- **Auditor fixture tests** (Atlas §3h) — not adopted; only matters if we extend
  `audit_plan_doc*.py`, and we have no test harness for the scripts yet.
- **Enforcing `Slice phase:` via the audit** — left as convention; revisit if it's
  skipped in practice.
- **Ownership lanes / per-package guardrails / manifest / Kimi routing / domain
  audits / `audit_plan_code_consistency.py`** — Atlas-specific, stay out (recorded
  in `AGENTS.md`).

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  4 == 4 + diff-size). No lint/build impact — the changed files are root-level
  Markdown outside `web/`.
- Re-read `HARDENING.md`: the migrated `DEFLECTION-GOLIVE-1` entry carries all four
  gate items; `PATTERNS.md` points to it; `AGENTS.md` documents slice phases +
  anti-patterns + the adoption delta.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `HARDENING.md` (register + migrated gate) | ~55 |
| `AGENTS.md` (slice phases + triage + anti-patterns + adoption note) | ~70 |
| `PATTERNS.md` (MOVED pointer + boundary note) | ~14 |
| this plan doc | ~95 |
| **Total** | ~234 |

Under the 400-LOC soft cap.
