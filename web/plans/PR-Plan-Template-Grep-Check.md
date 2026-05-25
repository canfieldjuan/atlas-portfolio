# Plan: Add a grep-the-old-value step to the plan-doc Verification template

Three consecutive review MAJORs (#76, #77, #78) were the **same failure
class**: a value was changed in one place and left stale/contradicting
elsewhere, and neither the plan's Verification nor Deferred caught it.
This adds the missing check to the canonical plan-doc template (AGENTS.md
§1a) so the sweep is standard before every PR, and names the class in §4.

## Why this slice exists

- **#76:** ICP + export window locked in `decisions.md`, but the committed
  `support-deflection-acquisition-pack.md` still said "10-100" / "90 days".
- **#77:** ICP revised to 15–75 in the canon, but `page.tsx:770`,
  `voice-reference.md`, and D-029 still said "10-50".
- **#78:** the hero export window changed to "3–6 months", but "90 days"
  still appeared as the first-ask window in ~8 other page sections.
- Same root cause each time: no step that **greps the old value** to prove
  no stale instance survives. AGENTS.md §1a Verification currently asks only
  for "the exact commands run locally + their results" — nothing prompts the
  cross-file sweep, so it depended on the author remembering. It didn't.

## Scope (this PR)

Slice phase: Workflow/process

1. **AGENTS.md §1a — Verification row:** add the grep-the-old-value
   requirement for any value that recurs across the repo.
2. **AGENTS.md §4 — Anti-patterns:** name the failure class ("value swept
   in one place, stale elsewhere") with the #76/#77/#78 reference, so it's
   findable.

### Files touched

- `web/plans/PR-Plan-Template-Grep-Check.md` — this plan doc (new)
- `AGENTS.md` — §1a Verification row + a §4 anti-pattern bullet

## Mechanism

- The §1a Verification row now requires: **if the slice changed a value /
  label / route / number that appears in more than one place, grep the repo
  for the old value and confirm no stale instance remains — or name each
  remaining one in `Deferred`.**
- The §4 bullet names the class so a future builder/reviewer recognizes it.
- **Not mechanized in `audit_plan_doc.py`:** that script enforces section
  *presence*, not content — it can't generically know "the old value" to
  grep. So this stays author + reviewer discipline (the reviewer's
  independent-verification step, §3a, is the backstop), now standardized in
  the template instead of living only in one engineer's memory.

## Intentional

- **The §4 anti-pattern is one addition beyond the literal "one-line
  Verification" ask** — included because §4 is its natural, findable home.
  Trivially droppable in review if only the §1a line is wanted.
- **Not building a mechanical enforcer** — a pre-push check that extracts
  changed string-literals and greps for stragglers is heavier and
  false-positive-prone; parked unless the discipline line proves
  insufficient.

## Deferred

- Mechanical enforcement of the sweep (extract changed value-literals, grep
  for survivors) — revisit only if the discipline line still doesn't hold.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `grep -n "grep the repo" AGENTS.md` shows the new §1a requirement; the §4
  list contains the new bullet.
- This slice changes no recurring *code* value, so the new
  grep-the-old-value step is N/A to itself (docs-only template change) —
  noted here rather than skipped silently.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `AGENTS.md` (§1a row + §4 bullet) | ~6 |
| this plan doc | ~72 |
| **Total** | ~78 |

Well under the 400-LOC soft cap.
