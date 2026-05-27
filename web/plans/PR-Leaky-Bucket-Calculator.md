# Plan: Track the Leaky Bucket calculator + reframe it for the deterministic / internal-docs story

Commits the GTM "Leaky Bucket" support-cost calculator
(`SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html`) into the repo
and lands two changes that align it with the product: drop the "AI-native
deflection" framing (the product is deterministic, no models) and add an
**Internal Knowledge Ops** mode (the internal-docs wedge, where loss is overhead).

## Why this slice exists

- The calculator quantifies the loss from bad help centers (context-assembly leak,
  burnout/attrition tax, reclaimable budget) — it's the willingness-to-pay anchor
  for the deflection pricing. Two problems: (1) Leak 3 was built on "AI-native
  deflection / $1 LLM ticket," which contradicts the deterministic, no-models
  positioning that is the product's moat; (2) it only modeled external customer
  support, but the same engine sells to **internal** knowledge ops — where the
  interrupted staff are $150k+ experts, so the loss is larger per interruption.
  It was an untracked working file; this brings it under version control + review.

## Scope (this PR)

Slice phase: Product polish

1. **Leak-3 reframe (de-AI):** `aiTicketCost` → `selfServeTicketCost` (default $0 —
   a deterministic self-serve has no per-answer inference cost); "Target AI
   Deflection Rate" → "Target Self-Serve Deflection Rate"; card subtitle + tooltips
   drop "AI-native / LLM inference." Reads as deflect-via-docs, not an AI agent.
2. **Internal Knowledge Ops mode:** third preset button alongside SaaS / E-com,
   with internal numbers (800 requests, 6 experts, $150k loaded salary, 23-min
   context-switch, $90k replacement, 10% findability), full field relabel, card
   titles ("Interruption & Context-Switch Leak", "Senior-Staff Attrition Tax"),
   and a header reframe. Preset switches rebuild inputs with the active mode's
   labels and restore external labels on switch-back.
3. **Self-test extended:** `verifyMathEngine` adds the internal preset case
   ($72.12 / $159,230.77 / $53,460 / $80,640) so the relabeled mode's headline
   numbers are locked and can't silently drift.

### Files touched

- `web/plans/PR-Leaky-Bucket-Calculator.md` — this plan doc (new)
- `SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` — newly tracked + the two reframes above

## Mechanism

- Standalone HTML/JS — **outside the Next `web/` app**, so it has zero build/deploy
  impact (Vercel builds `web/`, not this file). The math engine in `calculateMetrics`
  is **unchanged**; the only logic changes are the `selfServeTicketCost` key rename,
  the per-mode label/assumption maps (`PRESET_ASSUMPTIONS`, `MODE_LABELS`,
  `CARD_TEXT`), and a `renderInputs()` that rebuilds fields per active mode.
- The in-page `verifyMathEngine()` self-test runs on load (console) and now covers
  both the original and internal cases.

## Intentional

- **Reframe, not rebuild** — the 3-leak model + benchmarks stay; only the AI framing
  and the missing internal mode change.
- **Internal default numbers are starting points** for the operator to validate
  against their real internal ICP (esp. volume + the $150k salary).
- **Only the calculator file is committed** — the rest of
  `SEO-Ticket-Deflection-Template-Docs/` stays untracked (separate concern, not
  reviewed here).
- **Theming deferred** — it ships on its own dark theme; reconciling to the site's
  blue/light is a separate pass if/when it's embedded on-site.

## Deferred

- Embedding the calculator on the site (theme reconciliation).
- Committing the rest of the template-docs folder (operator's call).

Parked hardening: none.

## Verification

- JS syntax clean (`node --check` on the extracted script); no stray `aiTicketCost`
  refs; the `selfServeTicketCost` rename is consistent across default/preset/field/
  engine/test.
- Math re-verified out-of-band: original self-test still `33.65 / 403,846 / 270,480
  / 544,320`; internal case `72.12 / 159,230.77 / 53,460 / 80,640` (all within the
  test's 0.01 tolerance).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `leaky-bucket-calculator.html` (newly tracked — full add) | ~913 |
| this plan doc | ~80 |
| **Total** | ~993 |

Far over the 400 soft cap, but it's a **newly-tracked standalone file** — git
counts the whole 913-line file as added even though the actual change was the
reframe + internal mode (~120 lines of real edits). Indivisible: you can't track
"part" of a file. The reviewable surface is the JS (presets + reframe + self-test).
