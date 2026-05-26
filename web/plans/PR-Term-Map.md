# Plan: Rebuild the comparison section as the real term-map (card 2)

Card 2 of the page overhaul (per `demo-card-benefit-audit.md`). The comparison
section was a generic "company language vs customer language" concept. Reframe it
as the actual `term_mappings` deliverable — the findability pillar — surfacing the
words customers search, the words the help center uses instead, the zero-result
count, and the wording fix. Operator-approved mock.

## Why this slice exists

- The audit flagged the comparison table as "the most under-used element": it's
  literally the report's `term_mappings` output (`customer_term →
  documentation_term` + `suggestion` + `zero_result_source_count`) but rendered as
  a vague concept. Surfacing it as the real deliverable is the defensible version
  of the keyword/findability value (no ranking promise — D-028).

## Scope (this PR)

Slice phase: Product polish

1. **Data** (`landingConfig.tsx`): `comparisonRows` → **`termMappings`**, reshaped
   to the real fields — `{ customerTerm, docTerm, zeroResults, suggestion }`
   (incl. the real "export → Download report" example).
2. **Component**: `HelpCenterComparison` → **`TermMap`** — a mobile-friendly list,
   each row: *a customer searches "{customerTerm}"* + *"{zeroResults}"* → *your
   help center files it under "{docTerm}"* → *↳ fix: {suggestion}*, with a footer
   ("the fix is wording, not new docs").
3. **Config**: `comparison` slot — label `THE WEDGE` → **`YOUR TERM MAP`**,
   description points at the term-map output (with an explicit "we don't promise
   rankings" line), `artifact: <HelpCenterComparison />` → `<TermMap />`. Title
   ("The answer can exist and still be invisible.") stays.

### Files touched

- `web/plans/PR-Term-Map.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — `termMappings` data + `TermMap` component + `comparison` config

## Mechanism

- Each row maps a `term_mappings` entry: `customer_term` → `documentation_term`
  → `zero_result_source_count` ("N searches → 0 results", styled with
  `--artifact-danger`) → `suggestion` (the "↳ fix" line). Illustrative B2B-SaaS
  data; structure/labels match the real output. Renaming `HelpCenterComparison`
  → `TermMap` and `comparisonRows` → `termMappings` so the names match content
  (the reviewer's standing point). `AlertTriangle`/`FileText` imports stay used by
  `reportContents`.

## Intentional

- **Findability surfaced as a mechanism, not a ranking promise** — the
  description says "we don't promise rankings — but these are the words findable
  answers are built from" (inside D-028). The zero-result count is a real signal
  (`failure_risk: zero_result_search` / `zero_result_source_count`).
- **Mobile-first row layout** (stacks cleanly; most traffic is mobile) instead of
  the old rigid 2-column grid.
- **Title kept** — still a strong hook for the section.

## Deferred

- CFPB `DeflectionReportSample` rebuild — gated on the demo-swap / B2B-SaaS
  sample-source decision (audit Part 3).
- The "what's in the report" deliverable cards + headline/benefit-ladder rewrite.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean (no dangling `comparisonRows`/
  `HelpCenterComparison` refs; icon imports still used); `npm run build` succeeds;
  the section renders on the wedge + `/partner`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `termMappings` data (reshape) | ~38 |
| `TermMap` component (rewrite — old 2-col removed + new list) | ~50 |
| `comparison` config (label/description/artifact) | ~8 |
| this plan doc | ~86 |
| **Total** | ~182 |

Well under the 400-LOC soft cap.
