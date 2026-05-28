# Plan: Deflection broken-loop copy

Tighten the first post-hero problem section so it matches the new hero's
urgency-driven, data-backed, problem-agitation direction.

## Why this slice exists

- The hero now leads with customer keywords, but the first problem section still
  reads more explanatory than punchy.
- The buyer should feel the broken loop immediately: customers search, self-
  service misses their words, support answers manually, and the same question
  returns.
- This section should make the cost of missing customer wording obvious without
  changing the offer mechanics or adding unsupported guarantees.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the Broken Loop section title to the selected "agents as search
   engines" angle.
2. Rewrite the opening paragraph around failed self-service, 73%/14% Gartner
   data, and missing customer wording.
3. Rewrite the loop-card label and bullets to use miss/waste/repeat framing.
4. Rewrite the closing paragraph to preserve the 40% to 60% repetitive-volume
   benchmark while connecting each repeat ticket to missing customer wording.
5. Keep the section structure, stats, citations, cost section, offer, pricing,
   FAQ, intake, and layout unchanged.

### Files touched

- `web/plans/PR-Deflection-Broken-Loop-Copy.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — update Broken Loop copy

## Mechanism

- Update only `makeProblemAgitation()` in `landingConfig-v2.tsx`.
- Keep `problemCost`, `currentWayVsThisWay`, `mechanism`, `offer`, pricing, and
  FAQ config untouched.
- Preserve the existing `SectionList` component and paragraph/card structure.

## Intentional

- **Problem section only** — this does not rewrite the cost section yet.
- **No absolute deflection promise** — the copy says repeat tickets are evidence
  of missing wording, not that volume will automatically drop.
- **No SEO ranking guarantee** — the copy avoids promising Google rankings or
  search visibility outcomes.
- **Same proof points** — the 73%/14% and 40% to 60% stats remain the support for
  the argument.

## Deferred

- Rewriting the What It Costs section in the same sharper style.
- Adding proof chips or new above-the-fold UI.
- Updating the intake form with an optional "what should we look for?" field.
- Parked hardening considered but out of scope: DEFLECTION-INTAKE-PII-1.

Parked hardening: none.

## Verification

- `npm --prefix web run lint` — passed.
- `git diff --check` — passed.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` —
  verified the rewritten Broken Loop heading, miss/waste/repeat copy, 40% to 60%
  benchmark, and no framework error overlay.
- Mobile browser check at 390px — verified the rewritten section renders with no
  framework error overlay.
- `npm --prefix web run build` — passed.
- `rg -n "Repeat tickets keep coming back because the answer never reaches the next customer\.|Before a customer ever contacts you, they try to find the answer themselves|The loop support leads already know|Customer searches, fails, opens a ticket\.|Your team answers it manually\.</strong> The fix lives inside a reply thread|The same question comes back next week\.</strong> Another agent repeats the work\.|The volume is not hypothetical\. Industry benchmarks consistently put repetitive support volume" web`
  — no stale old Broken Loop section strings remain.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig-v2.tsx` Broken Loop copy | ~15 |
| this plan doc | ~85 |
| **Total** | ~100 |

Under the 400-LOC soft cap.
