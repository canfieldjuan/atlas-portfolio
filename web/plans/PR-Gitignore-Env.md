# Plan: Gitignore local secret files (.env / .env.local)

Adds `.env` and `.env.local` to `.gitignore` so local secret files can't be
committed by accident.

## Why this slice exists

- An `.env` holding an OpenRouter API key was placed at the repo root and was
  **not** gitignored. It was never tracked/committed, but a stray `git add -A`
  would sweep it in (this actually happened mid-work and was caught by GitHub
  push-protection). This closes that gap repo-wide so it can't recur.
- Split out of PR #121 (the 74%-stat fix) per `AGENTS.md` "Never in a PR"
  (no rides-along changes) — Codex P1.

## Scope (this PR)

Slice phase: Workflow/process

1. **`.gitignore`** — append a "Local secrets (never commit)" block ignoring
   `.env` and `.env.local`.

### Files touched

- `web/plans/PR-Gitignore-Env.md` — this plan doc (new)
- `.gitignore` — ignore `.env` / `.env.local`

## Mechanism

- Config-only. No code, no runtime impact. `git check-ignore .env` confirms the
  pattern matches.

## Intentional

- Only `.env` / `.env.local` (the local-secret convention). Did not touch other
  ignore rules.
- No secret was ever committed; this is preventative.

## Deferred

- None.

Parked hardening: none.

## Verification

- `git check-ignore .env` and `.env.local` both match (exit 0).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| .gitignore | ~4 |
| this plan doc | ~40 |
| **Total** | ~44 |

Well under the 400-LOC soft cap.
