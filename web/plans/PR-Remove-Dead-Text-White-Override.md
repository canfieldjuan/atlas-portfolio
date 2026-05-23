# Plan: Remove the dead `.text-white` override (address #61 review)

Addresses the reviewer NIT on #61: `globals.css` had `.text-white { color:
var(--text-strong) !important }` (added by the light-theme migration #40), which
remapped every `text-white` to dark — so `text-white` was never actually
invisible. #52/#60/#61 removed all `text-white` classNames, so that override is
now dead. Remove it, correct the misleading comment, and log the lesson.

## Why this slice exists

- The #61 reviewer (LGTM) flagged that the "invisible-text" framing was wrong:
  `globals.css:86` forced `text-white` to render dark via `!important`. The swaps
  were semantic source cleanup (use the real token), not visual fixes.
- Now that no `text-white` classNames remain (verified: only the `globals.css`
  rule itself and one comment), the `.text-white` override is dead code. Removing
  it completes the cleanup the reviewer described (stop leaning on the override).
- The hub page comment still asserts "text-white is invisible," which is false
  and would mislead a future reader.

## Scope (this PR)

1. Remove the dead `.text-white { color: var(--text-strong) !important }` block
   from `globals.css`. Leave the still-used `.text-black` / `.bg-primary
   .text-black` overrides (buttons use `text-black`).
2. Correct the misleading comment in the Content Ops hub page.
3. Log the diagnosis lesson in `PATTERNS.md`.

### Files touched

- `web/plans/PR-Remove-Dead-Text-White-Override.md` — this plan doc (new)
- `web/src/app/globals.css` — remove the dead `.text-white` override
- `web/src/app/systems/ai-content-ops/page.tsx` — fix the misleading comment
- `PATTERNS.md` — log the lesson

## Mechanism

- Delete the three-line `.text-white` rule (no `text-white` classNames reference
  it any more, so it matches nothing — pure dead-code removal, no visual change).
- Rewrite the hub comment to say headings use `text-foreground` (the real token)
  rather than the old `text-white` + `!important` remap, dropping the false
  "invisible" claim.
- `PATTERNS.md` records: don't diagnose a CSS-visual bug from utility classes
  alone — render it and/or check `globals.css` for overrides first.

## Intentional

- **Keep the `.text-black` overrides** — they're still used (`text-black` on
  buttons renders white via `.bg-primary .text-black` → `--primary-contrast`).
  Only `.text-white` is dead.
- **No revert of #52/#60/#61** — their end state (real tokens, no `!important`
  band-aid) is the coherent target; this PR finishes it.

## Deferred

- The Content Ops route-nesting decision (contradicts a logged decision + churns
  outreach links) — awaiting operator steer; tracked separately.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` + `build` pass (no `text-white` classNames exist,
  so removing the rule is a no-op at runtime).
- `grep -n "\.text-white" web/src/app/globals.css` returns nothing.
- `grep -rn "text-white" web/src` returns nothing (the hub comment is corrected).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `globals.css` (remove 3-line rule + blank) | ~4 |
| hub comment fix | ~4 |
| `PATTERNS.md` lesson | ~12 |
| this plan doc | ~85 |
| **Total** | ~105 |

Well under the 400-LOC soft cap.
