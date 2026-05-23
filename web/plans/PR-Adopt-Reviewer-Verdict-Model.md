# Plan: Adopt the reviewer-verdict model

Add the reviewer half of the Atlas discipline as documentation: a verdict model
(BLOCKER / MAJOR / NIT / LGTM) in `AGENTS.md` and an `AUDITOR_PROMPT.md` for an
independent reviewer session. Doc-only — makes a reviewer session *ready* without
requiring one for every PR.

## Why this slice exists

- #53–#55 installed the *builder* discipline (plan doc + mechanical gate +
  session-drift). The reviewer half — a shared verdict vocabulary and a reviewer
  prompt — was deferred (`AGENTS.md §3`). This is the last queued slice of the
  Atlas adoption.
- Today the Codex bot auto-reviews and the operator reviews by hand; this gives
  that review a shared shape (and a prompt) for when a dedicated reviewer session
  runs, without mandating one.

## Scope (this PR)

1. Add a **Reviewer verdicts** section to `AGENTS.md` (verdict table +
   independent-verification template + CI-gate rule).
2. Add `AUDITOR_PROMPT.md`, adapted to this repo (the Atlas one is
   architecture-specific — `BUILD_SPEC`/`CANONICAL`/voice — and not portable).
3. Update `AGENTS.md §3` ("not adopted"): drop session-drift (adopted in #55) and
   the reviewer-verdict model (adopted here); renumber to §4.

### Files touched

- `web/plans/PR-Adopt-Reviewer-Verdict-Model.md` — this plan doc (new)
- `AUDITOR_PROMPT.md` — independent-reviewer prompt for this repo (new)
- `AGENTS.md` — add the reviewer-verdict section; refresh the not-adopted list

## Mechanism

- `AGENTS.md` gains `## 3. Reviewer verdicts`: the four-level verdict table, a
  `## 3a` independent-verification template (re-run the gate, check claims vs the
  diff — not prose), and a `## 3b` CI-gate rule. The old `## 3. Intentionally not
  adopted` becomes `## 4`, with session-drift and reviewer-verdict removed.
- `AUDITOR_PROMPT.md` points the reviewer at its sources of truth (`AGENTS.md`,
  the PR's plan doc, `PATTERNS.md`), lists what to check (plan compliance, scope,
  independent verification, silent failures, CI), and says to respect
  `PATTERNS.md` (don't re-flag accepted-documented items) and complement the
  Codex bot.

## Intentional

- **Doc-only, optional** — no script, no CI change. The model is *available*; a
  reviewer session is not required for every PR (Codex + operator review remain
  the default).
- **Rewrote `AUDITOR_PROMPT.md` from scratch** rather than porting Atlas's — that
  one is Atlas-architecture-specific and would import dead references.
- **Refresh §3/§4** so the "not adopted" list stops claiming session-drift and
  the verdict model are deferred (both now adopted) — closing a doc-drift instance
  of the kind `PATTERNS.md` tracks.

## Deferred

- Actually running a standing reviewer session (vs the current Codex + operator
  review) — adopt when the workload warrants it.
- Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green: plan shape, files-touched
  (claimed == diff), diff-size within estimate.
- `npm --prefix web run lint` unaffected (docs only).

## Estimated diff size

| Area | LOC |
|---|---|
| AUDITOR_PROMPT.md (new) | ~50 |
| AGENTS.md reviewer section + §4 refresh | ~50 |
| this plan doc | ~90 |
| **Total** | ~190 |

Under the 400-LOC soft cap.
