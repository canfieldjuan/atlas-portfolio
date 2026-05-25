# Plan: Deflection demo — wire mapAtlasMatch to the locked Atlas contract + close the go-live gate

The Atlas `faq-deflection-search` contract is now locked. This slice rewrites
`mapAtlasMatch` to it, reshapes the demo's signal model + panel to what the
contract actually returns (less than the 3a panel assumed), and closes the
4-item `DEFLECTION-GOLIVE-1` gate — so the env-flip is later a pure config step.

## Why this slice exists

- The Atlas dev locked the compact search projection (`{ query, results:[…], count }`,
  item fields: `topic / question / answer_summary / source_ids / ticket_count /
  score / faq_id / rank / status …`) and answered the semantics: `score` is **text
  relevance** (not opportunity, not 0–100); `answer_summary` is the body; no
  `opportunity_score` / `failure_risk_signals` / `evidence_quotes` / `summary` in
  the search result; no-match = `{ results: [], count: 0 }`.
- The 3a `SignalsPanel` renders `opportunityScore` + risk tags + customer quote +
  summary — none of which the contract returns. Wiring as-is would render a literal
  "Opportunity score: 0" + empty blocks (the fabricated-signal problem #69 fixed, in
  reverse). So finalizing means aligning the model + panel to the contract.

## Scope (this PR)

Slice phase: Production hardening

1. Rewrite `mapAtlasMatch` for the `{ results }` envelope (`results[0] ?? null`),
   with full field validation, mapping the contract → `DeflectionIssue`.
2. Close the rest of `DEFLECTION-GOLIVE-1`: generic outer-catch message (no upstream
   host leak), `q` length cap, `AbortController` timeout; send `limit=5`.
3. Reshape `DeflectionIssue` + `DEMO_ISSUES` + `SignalsPanel` + the `ReportCard`
   label to the contract: keep ticket volume, add source-ticket count, drop
   `opportunityScore` / `riskSignals` / `customerQuote` / `summary`.

### Files touched

- `web/plans/PR-Deflection-Atlas-Wiring.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — reshape `DeflectionIssue` + `DEMO_ISSUES` (drop 4 signals, add `sourceCount`, widen `id`)
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — lean `SignalsPanel` (volume + source tickets) + `ReportCard` "Relevance" label; drop `humanizeSignal`
- `web/src/app/api/demo/deflection-search/route.ts` — `mapAtlasMatch` rewrite + the go-live gate
- `HARDENING.md` — close `DEFLECTION-GOLIVE-1`; park the static-badge follow-up

## Mechanism

- **Contract → `DeflectionIssue` map** (top result of `results`):
  `intent` ← Title-cased `topic`; `improved.title` ← `question`; `improved.body` ←
  `answer_summary`; `improved.matchScore` ← `score` **normalized within the returned
  set** (top = full bar — score is unbounded relevance, so a raw value can't be a
  %); `improved.matchLabel` ← bucket of the normalized value; `improved.format` ←
  `"Report FAQ answer"`; `improved.hasSolution` ← `answer_summary` non-empty;
  `improved.actions` ← two fixed labels (search has none); `ticketVolumeInSample` ←
  `ticket_count`; `sourceCount` ← `source_ids.length`; `id` ← `faq_id`.
- **Validation:** the top result must have string `faq_id/topic/question/answer_summary`,
  number `ticket_count`, array `source_ids` — else `mapAtlasMatch` throws → 502.
- **Gate close:** `q` truncated to 256 chars; the upstream `fetch` runs under an
  `AbortController` (8s) → abort/timeout → 504; non-2xx → 502; adapter throw → 502;
  unexpected → 500 — all with **generic** client messages (`console.error` keeps the
  real cause server-side, so the upstream host never leaks). `limit=5` sent; we
  render `results[0]`.
- **Reshape:** `SignalsPanel` shows two always-present metrics (ticket volume,
  source tickets) — no conditional empty blocks (also closes the 3a `grid-cols-2`
  partial-cell NIT). `ReportCard`'s bar label changes "Intent match" → "Relevance"
  (`score` is relevance, not intent-match). `DEMO_ISSUES` reshaped to match, so the
  local demo shows exactly what live search returns — no fabricated signals.
- **Still inert:** the Atlas branch only runs when `DEFLECTION_SEARCH_ATLAS_BASE_URL`
  is set (it isn't), so the demo keeps answering from `matchLocal` and this ships
  safe; the env-flip is a later config step.

## Intentional

- **Reshape to the contract, not optional fields** — keeping
  `opportunityScore`/risk/quote/summary as optional would let the local demo show
  signals the live search can't, re-introducing the #69 fabrication. The dev said
  not to wire those blocks until a projection expansion; removing them keeps local
  and live identical. Re-add when/if Atlas expands the projection.
- **`score` → normalized relevance, never `opportunityScore`** (per the dev): it's
  `ts_rank_cd × 1000`, unbounded, relevance-only. We render the single top match, so
  the normalized bar reads full — honest ("top match"), and it differentiates if we
  ever render the list.
- **`answer_summary` as a one-line body** — the search projection doesn't expose the
  stepwise `answer`/`steps`; the body renders as a single line until/unless the
  projection expands.

## Deferred

- **2c-go-live (config, operator):** set `DEFLECTION_SEARCH_ATLAS_BASE_URL` +
  `DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN` to a deployed Atlas host + a B2B-growth JWT
  whose account has approved `ticket_faq_search_documents` rows. Until then the
  route returns local/no-match.
- Projection expansion (steps/risk/quote/summary/opportunity) → richer panel, if Atlas adds it.

Parked hardening: `HARDENING.md` → `DEFLECTION-BADGE-1` (the result badge is a static
"Illustrative · sample dataset"; when the env is live + returning real rows it should
reflect the real source — needs a `source` flag on the response).

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles — both
  demo + calculator pages prerender.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  5 == 5 + diff-size).
- Browser spot-check (env unset → local data): search/chips still return the Report
  answer + the lean signals panel (ticket volume + source tickets); no
  opportunity/risk/quote blocks; bar reads "Relevance"; error/no-match states intact.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `route.ts` (mapAtlasMatch + gate rewrite) | ~154 |
| `deflection-demo.ts` (type + 5× DEMO_ISSUES reshape) | ~48 |
| `DeflectionDemo.tsx` (SignalsPanel + label, drop humanizeSignal) | ~77 |
| `HARDENING.md` (close gate + park badge) | ~15 |
| this plan doc | ~115 |
| **Total** | ~409 |

Modestly over the 400-LOC soft cap (~409) — one cohesive contract-wiring + reshape
(the route rewrite is ~154, the bulk). Splitting the adapter from the panel reshape
would ship a half-wired demo (a real-signals panel rendering fields the contract
doesn't return); the drift FAIL threshold sits well above this.
