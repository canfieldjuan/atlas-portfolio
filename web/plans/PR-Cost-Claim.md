# Plan: Sharpen the cost claim to the buyer's own math + surface the orphaned calculator

The cost claim cited the Gartner gap ($1.84 vs $13.50) as a flat benchmark. The
bold-via-fact form makes the math *theirs*: state the per-contact delta ($11.66)
as arithmetic, invite the multiplication against their own volume, and link the
one tool that does it — the `/calculator` route, which was built but orphaned
(reachable only via sitemap; nothing user-facing linked to it).

## Why this slice exists

- "However you cut it, more expensive" is vague. The provable cost claim is the
  delta ($13.50 − $1.84 = $11.66 per assisted contact) and the buyer's own
  multiplication; the savings stays their inference, never a promised figure.
- The `SupportTaxCalculator` page ("two numbers you already know → annual cost of
  repeat tickets") is the embodiment of "run it on your own volume," but no
  on-page link reached it. Surfacing it is free value and closes the loop.

## Scope (this PR)

Slice phase: Product polish

`landingConfig-v2.tsx`:
1. **Agitation cost line** → adds the `$11.66 more every time` delta + "Multiply
   that by your own repeat volume and the cost is a number you can run, not one we
   promise." (replaces the vague "however you cut it" sentence).
2. **New calculator link** below that line → "Run the numbers on your own volume →"
   to `/systems/support-ticket-deflection/calculator`. Imports `Link` (next/link)
   and `ArrowRight`.
3. **Partner-funnel fix (Codex P2):** the calculator link is parameterized via a
   `makeProblemAgitation(calculatorHref?)` factory. The shared `landingPageConfigV2`
   passes the public href; `partner/page.tsx` passes none — the public calculator's
   back link returns to the public $1,500 page, which would leak a design partner
   out of the noindex $1,000 funnel. Omit-on-partner (Codex's suggested option),
   not partner-aware routing (out of scope).

### Files touched

- `web/plans/PR-Cost-Claim.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — cost line + calculator link + 2 imports + `makeProblemAgitation` factory
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — override `problemAgitation` with the link-less variant + comment

## Mechanism

- `landingConfig-v2.tsx` is `'use client'`; `next/link` to an internal route is the
  same pattern the calculator page itself uses (proven in this fork). Copy + one
  internal link; no landing-component change.
- A ReactNode child can't be shallow-overridden, so the calculator link is
  parameterized at construction: the agitation section moves into an exported
  `makeProblemAgitation(calculatorHref?)` factory. Public passes the href; partner
  passes nothing. Everything else still propagates via the spread — no drift.

## Intentional

- **Fact, not guarantee** (claims doctrine [[claims-doctrine-fact-not-guarantee]]):
  $11.66 is arithmetic on the cited Gartner figures; "Multiply that by your own
  repeat volume" is the buyer's math; "a number you can run, not one we promise"
  states the doctrine outright. No dollar savings asserted.
- **Surfaced, not built** — the calculator already existed; this only links it.
- **Did not touch** the proof-stack benchmark line (259) — operator chose one
  link, not both spots; avoids two calculator links close together.

## Deferred

- Linking the calculator from the proof-stack benchmark or nav — operator declined
  the second link for now.

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green — public,
  `/partner`, and `/calculator` routes all compile.
- Cost claim reads as a delta + the buyer's multiplication; no promised savings.
- Calculator link renders on the public page, absent on `/partner` (verify on the
  preview after deploy — spacing where the link was should be clean).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| cost line + calculator link + imports | ~14 |
| `makeProblemAgitation` factory (block moved into a function + conditional link) | ~12 net |
| partner page override + comment | ~6 |
| this plan doc | ~80 |
| **Total** | ~112 |

Well under the 400-LOC soft cap.
