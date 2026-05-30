# Plan: Deflection results page — free-state render against the snapshot contract

The first increment of the snapshot→buy funnel: a per-request **results page** that
shows the buyer their own ranked repeat questions (the free snapshot) and presents
the $1,500 unlock. This slice builds the **free-state UI against the merged ATLAS
contract** (rendering a `DeflectionSnapshot` from a fixture); the live data fetch +
Stripe + paid-gate probe are the gated follow-up.

## Why this slice exists

- At the $1,500 entry the free snapshot carries the de-risking weight, so the
  results page (real ranked questions, drafts withheld) is the load-bearing
  conversion surface. The ATLAS snapshot contract is merged and frozen
  (#1156/#1150/#1154/#1157), so the UI can be built against it now without guessing.

## Scope (this PR)

Slice phase: Vertical slice

1. **`lib/deflection-snapshot.ts`** — the `DeflectionSnapshot` / `…Question` types
   (typed exactly to the ATLAS contract), the `deflectionSnapshotPath()` endpoint
   helper, and a labeled preview fixture (`DEMO_DEFLECTION_SNAPSHOT`).
2. **`components/landing/DeflectionResultsPage.tsx`** — presentation only: renders a
   `DeflectionSnapshot` (hook counts, top-N ranked questions + customer wording +
   frequency bars), the locked-state block (drafts/`no proven answer yet`/source IDs
   withheld), the $1,500 unlock CTA, the trust strip, and the soft $500/mo line.
3. **`results/[requestId]/page.tsx`** — the route (Next-15 `await params`), noindex,
   feeds the component via `getSnapshot(requestId)` (returns the fixture for now; the
   live `GET /snapshot` fetch + shape-validate is stubbed with the exact call).
4. **`SiteChrome.tsx`** — strip the global menu/footer on the results subtree
   (`BARE_PREFIXES`), like the focused landing.

### Files touched

- `web/plans/PR-Deflection-Results-Page.md` — this plan doc (new)
- `web/src/lib/deflection-snapshot.ts` — types + endpoint helper + preview fixture (new)
- `web/src/components/landing/DeflectionResultsPage.tsx` — free-state presentation (new)
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — route (new)
- `web/src/components/SiteChrome.tsx` — bare-chrome prefix for the results subtree

## Mechanism

- The component is pure presentation over a `DeflectionSnapshot`, so it renders
  identically from the fixture today and the live payload later — no rework when the
  fetch is wired. The route is the only thing that changes (fixture → live `fetch`).
- The snapshot payload contains **no drafts/evidence/source IDs** by contract, so the
  locked state isn't a CSS blur over real data — the paid deliverable is never sent
  to the browser. The full report is unlocked server-side by ATLAS after payment.

## Intentional

- **Free-state only.** The unlock CTA is present but its action is stubbed
  (`handleUnlock` TODO) — Stripe Checkout Session creation + the `/artifact`
  paid-probe are the gated follow-up (need ATLAS host + B2B JWT + Stripe acct).
- **Claims doctrine:** copy asserts only snapshot facts ("{N} drafts already
  drafted", "{M} no proven answer yet" — both from `summary`), the deterministic/
  no-AI trust strip (true, the moat), and links the calculator instead of inventing
  a $ figure. The $500/mo line stays on writeback (built); no "what changed" claim.
- **Fixture is labeled NOT real data** and is the realistic 5-question shape; the
  byte-faithful 2-item contract example stays in ATLAS docs.

## Deferred

- **Gated follow-up slice:** wire `getSnapshot` to the live `GET /snapshot` (ATLAS
  host + B2B JWT, validate upstream shape, 404→notFound); build the Stripe Checkout
  Session (metadata `source/account_id/request_id`, `mode:payment`, ≥150000, usd);
  probe `GET /artifact` on return (200 unlock → render full report / 403 keep CTA).
- The full-report (unlocked) render — a separate component once the artifact shape
  is consumed.
- Linking the results route from the intake success flow (today it still emails).

Parked hardening: none. (Pre-existing #117 PII intake item is unrelated.)

## Verification

- `tsc --noEmit` = 0; `npm run lint` = 0 (clean); `npm run build` green — the route
  compiles as dynamic (`ƒ /systems/support-ticket-deflection/results/[requestId]`).
- Component renders the fixture; locked block shows withheld items; chrome stripped
  on the results subtree (SiteChrome prefix).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  5 == 5 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| lib (types + helper + fixture) | ~75 |
| results component | ~165 |
| route | ~30 |
| SiteChrome prefix | ~8 |
| this plan doc | ~85 |
| **Total** | ~363 |

Under the 400-LOC soft cap.
