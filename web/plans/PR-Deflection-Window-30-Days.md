# Plan: Simplify the deflection first-ask window to 30 days

Copy-only pass over the Support Ticket Deflection funnel: change the first-ask
ticket-export window from "3 months" to "30 days" everywhere it is shown, and
record the decision in the framework decision log. Operator-requested; closes the
upload-window mismatch flagged in the `/snapshot` landing review (#250, epic
#251).

## Why this slice exists

- The funnel asks the buyer to upload "3 months" of closed tickets, but the
  snapshot artifact it renders is built around a **30-day** source window
  (`DEMO_DEFLECTION_SNAPSHOT.summary` uses `source_window_days: 30`). The ask and
  the artifact contradicted each other.
- The operator chose 30 days for a simpler, lower-friction ask — the free
  snapshot is a fast value check, not a full export project.
- This reverses recorded decision D-027 (3–6 month window), so the change must be
  documented in `decisions.md`, not made silently.

## Scope (this PR)

Slice phase: Product polish

1. **First-ask window copy** — every visitor-facing first-ask window string
   across the deflection funnel becomes "30 days" / "last 30 days". This covers
   the plural ("3 months"), singular ("first 3 month batch"), and hyphenated
   ("your 3-month ticket export") forms across the hero, intake, demo (page +
   `DeflectionDemo` no-match state), playbook, partner, both landing configs,
   calculator, how-it-works, snapshot + route SEO metadata, systems index, and
   the deflection product card on the AI Content Ops page.
2. **Decision log** — D-027 marked `SUPERSEDED`; new D-030 records the 30-day
   decision, its rationale, and the accepted trade-off.
3. Left untouched: the **"every 90 days"** quarterly-refresh cadence and the
   **"held 90 days"** data-retention line (different concepts, not the first-ask
   window), and unrelated "three months" copy on the ContentOps churn demo and an
   ai-content-ops temporal line.

### Files touched

- `web/plans/PR-Deflection-Window-30-Days.md` — this plan doc (new)
- `web/docs/landing-page-framework/decisions.md` — D-027 superseded, D-030 added
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` — hero subhead window
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — intake body copy
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` — intake SEO meta
- `web/src/app/systems/support-ticket-deflection/layout.tsx` — deflection SEO meta
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — demo body copy
- `web/src/app/systems/support-ticket-deflection/playbook/page.tsx` — playbook body copy
- `web/src/app/systems/support-ticket-deflection/partner/layout.tsx` — partner SEO meta
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — v1 snapshot description + full-report batch line
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — v2 body copy + upload stage sub
- `web/src/app/systems/support-ticket-deflection/snapshot/page.tsx` — snapshot SEO meta
- `web/src/app/systems/page.tsx` — systems index customerData line
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — calculator copy
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — no-match empty-state copy ("3-month" → "30-day")
- `web/src/components/deflection-demo/HowItWorks.tsx` — demo step copy
- `web/src/app/systems/ai-content-ops/page.tsx` — deflection product-card summary

## Mechanism

- Per-instance exact-string copy edits: `"3 months"` / `"last 3 months"` → `"30
  days"` / `"last 30 days"`, plus the `"CSV export • 3 months • no integration"`
  upload-stage label. Copy / JSX-text and metadata strings only — no logic, no
  hrefs, no behavior, no contract or type changes.
- Scope follows the import graph, not just the route directory: the deflection
  routes render shared components in `web/src/components/landing/` and
  `web/src/components/deflection-demo/`, so those are swept too.
- The decision-log edit marks D-027's status line `SUPERSEDED by D-030`, names
  D-030 as the current source of truth, flags the remainder of D-027 as
  historical (the rationale is retained), and appends D-030 with the new
  decision, rationale, and the carve-outs that are deliberately not swept.
- The `SupportTaxCalculator` CTA gains "closed" ("Upload 30 days of **closed**
  tickets") so it matches the rest of the funnel's "closed tickets" wording — a
  review-driven consistency fix on a line this slice already touches.

## Intentional

- **Reverses D-027 on purpose.** D-027 argued a longer window clusters better and
  produces a more alarming annualized figure; that reasoning still holds. We
  accept a smaller first sample for a simpler ask and a consistent artifact — the
  snapshot annualizes from the source window, so the cost framing survives. This
  is recorded in D-030 rather than left as a silent contradiction.
- **"every 90 days" and "held 90 days" left as-is** — the refresh cadence and the
  data-retention window are not the first-ask export window (D-027's own
  carve-out).
- **ContentOps "three months" left as-is** — the churn-survey demo and the
  "shipped three months ago" line are a different product / temporal usage, not
  the deflection upload ask.

## Deferred

- No copy rewrite beyond the window value.
- Any ATLAS-side intake/CSV validation that assumes a longer window lives in the
  `canfieldjuan/ATLAS` repo and is out of scope here.
- The rest of the `/snapshot` landing review (epic #251: demo-render drift #245,
  headline #248, disclaimer de-dup #246, paywall framing #247, trust/privacy
  #249, remaining copy polish in #250) ships as separate slices.

Parked hardening: none.

## Verification

- `node scripts/test-deflection-snapshot-landing-smoke.mjs` — pass.
- `node scripts/test-deflection-teaser-rank-copy.mjs` — pass.
- **Recurring-value grep (broadened to catch singular + hyphenated forms after
  a review miss):** `rg -i "3[- ]months?|three[- ]months?|3-6 months|3–6 months"
  web/src` returns only the intentional carve-outs (ContentOps churn demo
  `ContentOpsDemo.tsx`, and the `ai-content-ops/ongoing-support` "three months
  ago / three-month-old" temporal line); no first-ask deflection window remains.
  `rg "every 90 days|held 90 days"` confirms the two carve-out lines are intact.
- Plan-doc audits (`audit_plan_doc.py`, `audit_plan_doc_files_touched.py`,
  `audit_plan_doc_diff_size.py`) green against the committed diff.
- ESLint + Next build not run locally (deps not installed in this environment);
  covered by the per-PR Vercel preview, which built green (DEPLOYED), and the
  `pre-push-audit` CI check, which passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| First-ask window copy sweep (16 files) | ~34 |
| Decision log (D-027 superseded + D-030) | ~37 |
| This plan doc | ~100 |
| **Total** | ~175 |
