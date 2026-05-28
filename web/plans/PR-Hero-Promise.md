# Plan: Rework the hero headline into an explicit, ticket-specific promise

The new wedge landing's hero led with a vague "Stop answering the same questions."
Operator wants a promise that is explicit about **support tickets** and the
**customer-search-language** mechanism. New headline (operator-picked option):
the reframe + the mechanism, distributed across the hero's title/intro/body.

## Why this slice exists

- "Same questions" is vague and doesn't name the asset (tickets) or the
  differentiator (the words customers actually search). The reframe — *your repeat
  tickets ARE search queries your help center can't answer* — is the concrete,
  defensible claim only ticket-mining can make.

## Scope (this PR)

Slice phase: Product polish

`landingConfig-v2.tsx`, `hero`:
1. **title** → "Your repeat support tickets are search queries your help center
   can't answer." (the reframe hook — explicit about tickets).
2. **intro** → "We surface them in your customers' own words — and draft the FAQs
   you publish." (the mechanism / promise, sits right under the hook).
3. **body** → the existing "upload 3–6 months / 24 hours / ranked / gaps / drafted"
   specifics (moved down from intro as the supporting "how").
4. Dropped the old body ("the answers are already in your queue…") — the new title
   already carries that idea (help center can't answer = the answer isn't findable).

### Files touched

- `web/plans/PR-Hero-Promise.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero copy

## Mechanism

- Copy-only, same three hero slots the component already renders (title H1 →
  prominent intro subhead → supporting body). No component/structure change.

## Intentional

- **Defensible promise, not a numeric one** (D-028): promises what we *deliver* —
  the repeat questions in the customers' own search language, drafted to publish —
  and frames the outcome as the mechanism's effect ("can't answer" = the findability
  gap we close). No deflection **%** and no Google-ranking guarantee in the headline.
- **Explicit about support tickets + search language** per operator direction.
- **Reframe over feature-list** (Schwartz-style): the insight ("tickets = search
  queries") does the selling; the mechanism line delivers the promise.

## Deferred

- Further hero/section copy passes as the operator works down the page.

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean (double-quoted strings handle the
  apostrophes); `npm run build` green.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig-v2.tsx` hero copy | ~8 |
| this plan doc | ~58 |
| **Total** | ~66 |

Well under the 400-LOC soft cap.
