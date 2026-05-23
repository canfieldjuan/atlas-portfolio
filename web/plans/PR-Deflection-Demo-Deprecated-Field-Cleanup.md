# Plan: Deflection demo — drop the deprecated economics fields (slice 3b-cleanup)

Slice 3a added the real-signal fields as optional; slice 3b cut the two UI
sections that consumed the fabricated economics. Nothing reads
`traditional` / `ticketsPerMonth` / `costPerTicket` / `deflectionShare` or the
savings helpers anymore (the only remaining reference is `route.ts`'s
placeholder `mapAtlasMatch` validation). This slice removes the dead surface and
makes the real-signal fields required — completing the additive→required
migration the previous slices set up.

## Why this slice exists

- The deprecated fields + savings helpers are now dead weight: keeping optional
  signal fields + required-but-unused economics is the worst of both (the type
  lies about what a match carries). Flipping the migration makes the type honest.
- It's deliberately separate from 3b: that was a UI removal needing design
  review; this is a mechanical data/type cleanup needing a careful compile check.

## Scope (this PR)

1. `deflection-demo.ts`: drop `traditional` / `ticketsPerMonth` / `costPerTicket` /
   `deflectionShare` from `DeflectionIssue`; make the five signal fields required;
   remove `estimateSavings` / `DeflectionSavings` / `estimateDeflectionTotals` /
   `DeflectionTotals`; trim the four fields from each of the 5 `DEMO_ISSUES`.
2. `route.ts`: update `mapAtlasMatch`'s validation to the new required fields
   (it currently references the removed `m.ticketsPerMonth` / `m.traditional`).

### Files touched

- `web/plans/PR-Deflection-Demo-Deprecated-Field-Cleanup.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — drop deprecated fields + dead savings helpers; require signal fields
- `web/src/app/api/demo/deflection-search/route.ts` — `mapAtlasMatch` validation to new required fields

## Mechanism

- **Type:** `DeflectionIssue` loses `traditional` (a `DeflectionDoc`),
  `ticketsPerMonth`, `costPerTicket`, `deflectionShare`; the five real-signal
  fields lose their `?`. `DeflectionDoc` stays (still the type of `improved`); its
  "traditional doc" comment is corrected.
- **Dataset:** each of the 5 `DEMO_ISSUES` drops the four deprecated keys (the
  `traditional: { … }` block + the three numbers). The signal fields and
  `improved` stay, so `matchLocal` (phrase matching) and the per-search panel are
  unaffected.
- **Helpers removed:** `estimateSavings`, `DeflectionSavings`,
  `estimateDeflectionTotals`, `DeflectionTotals` — all unused since #69 deleted
  `DeflectionMath` (their only consumer). `matchLocal`, `searchDeflection`,
  `DeflectionSearchResponse`, `DEMO_CHIPS` are untouched.
- **`route.ts`:** `mapAtlasMatch` validation switches from
  `intent` + `ticketsPerMonth` + `traditional` + `improved` to `intent` +
  `ticketVolumeInSample` + `opportunityScore` + `improved`. This keeps the proxy
  path compiling against the new shape; it stays the **minimal** presence check —
  the full per-field validation (risk array, string fields, `improved.actions`
  array) plus the rest of the go-live gate is still slice 3c.

## Intentional

- **Migration completed, not extended** — the signal fields go from optional to
  required because every `DEMO_ISSUES` entry (and the Atlas mapping in 3c) supplies
  them. A match without them is now a type error, which is the point.
- **`route.ts` validation stays minimal** — this slice only keeps it compiling
  against the new required fields; the hardened validation that prevents a
  shallow-but-incomplete Atlas object from crashing the render is slice 3c (logged
  in `PATTERNS.md`). Reviewers shouldn't expect the full gate close here.
- **`DeflectionDoc.hasSolution` retained though unrendered** — it's a real Atlas
  field (`bool(steps)`); the panel doesn't show it today but 3c maps it and it may
  surface later. Not deprecated, so kept.

## Deferred

- **3c:** `mapAtlasMatch` → Atlas `{ query, results:[…], count }` envelope; the
  full `mapAtlasMatch` validation + the 4-item go-live gate (`PATTERNS.md`); set
  the env; fold in the 3a `grid-cols-2` NIT (empty half-cell on a partial match).
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles (the
  type change would surface any missed consumer; the demo page prerenders).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).
- Browser spot-check: search still returns the Report answer + real-signals panel
  (no behavior change — this is a dead-code removal).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `deflection-demo.ts` (drop 4 fields × type+5 issues, remove 4 helpers, require 5 fields) | ~115 |
| `route.ts` `mapAtlasMatch` validation | ~6 |
| this plan doc | ~95 |
| **Total** | ~216 |

Under the 400-LOC soft cap.
