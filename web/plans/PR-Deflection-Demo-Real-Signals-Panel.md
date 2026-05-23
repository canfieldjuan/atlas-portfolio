# Plan: Deflection demo — real-signals result panel (slice 3a)

The demo will be wired to Atlas's real ticket-FAQ pipeline, which provides a
genuine "improved" answer + real demand signals (ticket volume, opportunity
score, failure-risk tags, customer quotes) but **no** "today's-bad-doc" contrast
and **no** per-issue economics — those were demo narrative + business
assumptions. The operator chose to lean into the real signals. This slice
redesigns the per-search result panel accordingly, on local data, so the change
is verifiable before Atlas is wired.

## Why this slice exists

- The real backend doesn't carry the fabricated pieces the current panel leans
  on (the today-vs-Report contrast, `costPerTicket` × `deflectionShare` savings).
  Keeping them would mean presenting invented economics as if they came from the
  data — against the offer's no-over-claiming stance.
- Doing the panel redesign first, on the local dataset, de-risks the Atlas wiring
  (slice 3c): the new shape + UI land and get reviewed without depending on a
  live endpoint.

## Scope (this PR)

1. Add the real-signal fields to `DeflectionIssue` as **optional**
   (`ticketVolumeInSample`, `opportunityScore`, `riskSignals`, `customerQuote`,
   `summary`) and populate them illustratively for the 5 `DEMO_ISSUES`.
2. Rewrite the `phase === 'result'` panel in `DeflectionDemo`: drop the
   "today's doc" card and the savings block; render the Report answer beside a
   new real-signals panel (volume in sample, opportunity score, risk tags,
   customer quote + summary).

### Files touched

- `web/plans/PR-Deflection-Demo-Real-Signals-Panel.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — optional real-signal fields + populate `DEMO_ISSUES`
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — real-signals result panel

## Mechanism

- **Type migration is additive/optional** (not a rename): the new fields are
  optional, the old `traditional` / `costPerTicket` / `deflectionShare` stay
  required. So `matchLocal`, `estimateSavings`, `DeflectionMath`, and `CostTicker`
  keep compiling untouched this slice. Slice 3b flips it: redesign the aggregate
  sections, then drop the deprecated fields.
- **Panel:** the kept Report-answer card (`improved`: question, steps, format,
  actions) sits beside a `SignalsPanel` that renders the real signals —
  `ticketVolumeInSample` ("N tickets in sample", a corpus total, **not** "/mo"),
  `opportunityScore`, `riskSignals` humanised from snake_case tags, and a
  `customerQuote` + `summary`. The component reads every new field defensively
  (optional → conditional render), so a match missing a field degrades instead of
  throwing — the same no-crash discipline the Atlas adapter will need in 3c.
- **The seam is unchanged** — `searchDeflection` / the route handler / `matchLocal`
  keep their signatures, so the debounce / request-id / error-recovery paths from
  #63/#66 still hold.

## Intentional

- **My scope reading (confirm or correct here):** "lean into real signals" spans
  all three surfaces — the per-search panel (this slice), the aggregate
  `DeflectionMath`, and the `CostTicker` (slice 3b). This slice only does the
  per-search panel.
- **Transient inconsistency, one review window:** after this slice the per-search
  panel shows real signals while `DeflectionMath` still shows "$ saved / mo" and
  `CostTicker` still shows industry economics. Accepted as the cost of keeping the
  slice under the LOC cap; slice 3b reconciles them.
- **Local fabrication:** this adds 5 × ~5 illustrative signal fields to
  `DEMO_ISSUES` (volume, opportunity, risk tags, quote, summary) — the same
  illustrative-content posture the demo already uses, now shaped like Atlas's real
  fields so the Atlas mapping (3c) is a direct field map.
- **PII deferred to 3c:** local `customerQuote`s are clean illustrative strings.
  Atlas's real quotes are CFPB-sourced and PII-redacted (`XX/XXXX`), so slice 3c
  adds a "redacted for privacy" caption when rendering real quotes — not needed
  for illustrative data here.
- **`traditional` retained but unrendered** until slice 3b drops it (keeps
  `DeflectionMath`/`matchLocal` compiling).

## Deferred

- **Slice 3b:** redesign `DeflectionMath` + `CostTicker` around real aggregate
  signals; then drop `traditional` / `costPerTicket` / `deflectionShare`.
- **Slice 3c:** `mapAtlasMatch` maps Atlas's `{ query, results:[…], count }`
  envelope → the new model; close the 4-item go-live gate (`PATTERNS.md`); set the
  env to the live host + token.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles — the
  demo page prerenders.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).
- Browser spot-check: a search (e.g. "charged twice") shows the Report answer +
  the real-signals panel (volume in sample, opportunity, risk tags, quote); no
  today's-doc card, no savings block; clear returns idle.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `deflection-demo.ts` optional fields + 5× signal data | ~45 |
| `DeflectionDemo.tsx` panel rewrite (drop today-card + savings, add SignalsPanel) | ~120 |
| this plan doc | ~105 |
| **Total** | ~270 |

Under the 400-LOC soft cap.
