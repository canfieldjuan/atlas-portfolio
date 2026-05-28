# Plan: Sharpen the deflection claim to the bold-via-fact form (count, not percentage)

The deflection claim was already doctrine-compliant — frequency-ranking shows up
across hero/CTA/proof-card, and pricing already states "No guaranteed deflection
percentage." The gap was the opposite of an over-claim: it was stated *softly*
("how often"). This makes the deflection benefit bold the only way the doctrine
allows — as a **countable fact** (the exact recurrence count from the buyer's own
tickets), with the percentage left explicitly as something we do not promise.

## Why this slice exists

- "How often each question reaches support" is vague. The strongest *provable*
  deflection claim is the count: we tally exactly how many times each question
  recurred in the buyer's CSV, so the size of the repeat-work pile is a hard
  number they can see — not a deflection % we'd have to guarantee (and can't).

## Scope (this PR)

Slice phase: Product polish

`landingConfig-v2.tsx`, `offer` section only:
1. **New bold lead-in line** above the deliverable bullets: "You do not have to
   guess how much of your queue is repeat work. The report counts it — the exact
   number of times each question recurred in your own tickets — so the opportunity
   is a number you can see, not a percentage we promise."
2. **Offer bullet 1** → adds "— highest-volume first" so the ranked list names its
   ordering (ties to the lead-in's count without repeating the phrase).

### Files touched

- `web/plans/PR-Deflection-Claim.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — offer lead-in + bullet 1

## Mechanism

- Copy-only, `offer.content` ReactNode. No component change.

## Intentional

- **Fact, not guarantee** (claims doctrine [[claims-doctrine-fact-not-guarantee]]):
  the line asserts only a count ("the exact number of times each question
  recurred") and explicitly disclaims the percentage ("not a percentage we
  promise"). Deflection size = the buyer's inference from a real number; deflection
  % stays unpromised. This is the doctrine's deflection rule stated almost verbatim.
- **Ogilvy** — specific (a count from their own data), no hype.
- **Did not touch** the already-fine frequency mentions (hero/CTA/proof-card) — no
  churn on passable copy; the operator chose "bullet + one line," not a full sweep.

## Deferred

- The cost fact-claim pass ($1.84 vs $13.50 × their volume) — separate slice.
- A full sweep of every "how often" mention to "exact count" — operator declined.

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green.
- Deflection claim reads as a count, not a %; pricing's "no guaranteed deflection
  percentage" still consistent with it.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| offer lead-in + bullet | ~5 |
| this plan doc | ~70 |
| **Total** | ~75 |

Well under the 400-LOC soft cap.
