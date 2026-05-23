# Plan: Clarify the §3c merge-autonomy MAJOR rule

Resolve a self-contradiction in `AGENTS.md §3c` (added by #57) about whether a
**MAJOR** review finding can be parked-and-logged or must be resolved before an
autonomous merge. Make the rule internally consistent and consistent with the
§3 verdict table.

## Why this slice exists

- A retro-review of #57 (code-reviewer agent) found `AGENTS.md §3c` disagrees
  with itself on MAJORs:
  - Sentence 1 — *"…no BLOCKER/MAJOR, and any bot P1/P2s either addressed or
    explicitly accepted and logged…"* — reads BLOCKER/MAJOR as a **hard floor**
    (must resolve), with only bot P1/P2s eligible for accept-and-log.
  - Sentence 2 — *"Anything actionable is resolved (or accepted in `PATTERNS.md`)
    first"* — reads broader: **any** actionable item, a MAJOR included, may be
    accept-and-logged instead of fixed.
- The two are not the same rule, and this is exactly the spot where an autonomous
  merge decision can go wrong (merge with an unresolved MAJOR, or block on one the
  policy actually permits parking).
- The §3 verdict table already pins the correct reading: **MAJOR** = *"Fix if
  small; else discuss before deferring."* A MAJOR is deferrable, but only after
  discussion — i.e. not silently parked by the agent during an autonomous merge.

## Scope (this PR)

1. Rewrite `AGENTS.md §3c` so "no actionable review" is defined precisely and
   without the sentence-1/sentence-2 contradiction: BLOCKER must be fixed; a
   MAJOR is fixed or explicitly accepted by the operator and logged; bot P1/P2s
   addressed or accepted-and-logged; a NIT never blocks.

### Files touched

- `web/plans/PR-Clarify-Merge-Autonomy-Major-Floor.md` — this plan doc (new)
- `AGENTS.md` — rewrite §3c to remove the MAJOR contradiction

## Mechanism

- §3c's two-sentence definition is replaced by a single precise statement of what
  "no actionable review" means, per verdict level:
  - **BLOCKER** — no open BLOCKER (must be fixed first).
  - **MAJOR** — fixed, or explicitly accepted by the operator and logged in
    `PATTERNS.md` (the §3 table's "discuss before deferring", made concrete in
    this repo's accepted-advisory-goes-to-`PATTERNS.md` convention).
  - **bot P1/P2** — addressed, or accepted-and-logged.
  - **NIT** — never blocks.
- The "Anything actionable is resolved (or accepted)…" blanket sentence is
  removed; its intent is folded into the per-level definition above.
- The force-push prohibition + squash-merge note in §3c is preserved verbatim.

## Intentional

- **No §3 table edit.** The fix maps the table's MAJOR row ("discuss before
  deferring") onto "explicitly accepted by the operator and logged in
  `PATTERNS.md`" — the repo's established convention for accepted-advisory items
  (`AUDITOR_PROMPT.md`, `PATTERNS.md`). The table stays the source of the verdict
  semantics; §3c just stops contradicting it. So the table needs no change.
- **Operator-accepted, not agent-parked.** A MAJOR leaves "actionable" only when
  the *operator* accepts it (logged in `PATTERNS.md`), not when the agent decides
  to defer — keeping autonomous merge conservative for the most significant
  non-blocking findings.

## Deferred

- **Authorship independence of the autonomy rule.** §3c (and the agent-memory
  rule) presume the review is *independent* of the author; neither says an
  agent-**authored** PR is ineligible for autonomous self-merge. Flagged during
  this PR's planning; out of scope for the MAJOR-ambiguity fix. Follow-up:
  `PR-Clarify-Merge-Autonomy-Independence` if we want it committed. (This PR is
  itself agent-authored, so it is **not** auto-merged — it awaits operator
  sign-off.)
- Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green: plan shape (7/7 sections, in
  order), files-touched (2 claimed == 2 in diff), diff-size within the estimate
  band.
- `npm --prefix web run lint` unaffected (docs-only change).
- `grep` confirms `AGENTS.md §3c` no longer contains the "Anything actionable…"
  blanket sentence and defines the rule per verdict level.

## Estimated diff size

| Area | LOC |
|---|---|
| this plan doc | ~78 |
| AGENTS.md §3c rewrite | ~14 |
| **Total** | ~92 |

Well under the 400-LOC soft cap.
