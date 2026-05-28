# Plan: Make the "cost of staying here" block scannable (prose → bullets)

The rewritten wedge landing's `problemAgitation` section (#107) is the densest
block on the page — four stat-heavy paragraphs in a row. Convert the two that are
really *source → number* lists into bullets, trim the cost-spread para, and dedup
the proof list so the same numbers don't bullet twice. Faster, easier to read.

## Why this slice exists

- Operator readability pass on the new landing. The agitation block reads as a wall
  of benchmarks; the team-cost and customer-cost paragraphs are enumerations hiding
  in prose. Everything else on the page is left as prose deliberately (see Intentional).

## Scope (this PR)

Slice phase: Product polish

`landingConfig-v2.tsx`, `problemAgitation` + `proofStack`:
1. **Team-cost paragraph → bullets** (Salesforce 39% • Gorgias 5 hrs/wk • Insignia burnout).
2. **Customer-cost paragraph → bullets** (Gartner 73%/14% • CEB 94%/4%).
3. **Cost-spread paragraph trimmed** — dropped the redundant HDI second source; kept
   the punchy Gartner $1.84-vs-$13.50 hook.
4. **Proof "Industry benchmarks" list deduped** — removed the 73%/14% and 94%/4%
   bullets now carried by the agitation block (kept the cost + SQM FCR benchmarks;
   the 73%/14% is still voiced by the Gartner quote directly below).

### Files touched

- `web/plans/PR-Agitation-Bullets.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — bullets + trim + dedup

## Mechanism

- Reuses the existing module-level `SectionList` component (already used in the same
  `problemAgitation` CopyBlock for the "loop support leads know" list), so the bullets
  match the page's check-icon style with no new component or CSS.

## Intentional

- **Pushed back on the rest** (left as prose): the hero, the "you already tried the
  obvious things" rhetorical lead-in (the comparison grid already structures it), the
  "extraction not automation" positioning, the mechanism connective paragraphs (the
  3-step `stages` block already gives the scannable version), and the Klarna story.
  Bulleting those would fragment narrative or duplicate existing structured blocks.
- **Deduped, didn't relocate wholesale** — agitation now owns the cost *narrative*
  (team + customer); proof keeps the cost-per-contact + FCR citations + the Gartner
  quote. The only remaining echo is $1.84/$13.50 (agitation hook ↔ proof citation),
  which is intentional (hook vs receipt).
- **No claims changed** — same benchmarks, same sources, same numbers (D-028 intact).

## Deferred

- Routing: the new landing replaced the old wedge URL rather than being standalone —
  a separate decision the operator is parking for now (old `DiagnosticReportLandingPage`
  + `landingConfig` remain in the repo, orphaned, fully recoverable).

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green; the customer stats
  no longer appear as bullets in both sections.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig-v2.tsx` bullets + trim + dedup | ~30 |
| this plan doc | ~62 |
| **Total** | ~92 |

Well under the 400-LOC soft cap.
