## Why this slice exists

The Snapshot landing page copy has settled around one promise: get the free
Snapshot first, then decide whether the full report is worth unlocking. Public
entry surfaces already point at `/systems/support-ticket-deflection/snapshot`,
but their labels still vary between "View", "See", and a generic "offer"
phrasing. This slice makes those entry CTAs read like the same Snapshot-first
funnel without changing routes.

## Scope (this PR)

Slice phase: Product polish

1. Align the Support Ticket Deflection card on `/systems` to the settled
   `Get the free Snapshot first` label.
2. Align the Support Ticket Deflection offer card and hero secondary CTA on
   `/systems/ai-content-ops` to the same label.
3. Align the long `/systems/support-ticket-deflection` hero and final CTA labels
   to the same Snapshot-first wording.
4. Preserve all existing hrefs, the Snapshot page itself, intake, results,
   partner routing, checkout, pricing, smoke scripts, and monitor/runbook docs.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Entry-Cta-Consistency.md`
- `web/src/app/systems/page.tsx`
- `web/src/app/systems/ai-content-ops/page.tsx`
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx`

## Mechanism

The affected public entry surfaces already route to
`/systems/support-ticket-deflection/snapshot`. This slice changes only the
visible CTA labels from mixed `View` / `See` variants to `Get the free Snapshot
first`. The long page keeps using `SNAPSHOT_HREF`; the systems pages keep their
existing `href` values.

No route, form, checkout, or shared data contract changes are introduced.

## Intentional

- This does not touch noindex partner CTAs; those stay intake-direct by design.
- This does not change the Snapshot page primary CTA, which still says
  `Get my free Deflection Snapshot` and points to intake.
- This does not change pricing-card CTAs, checkout, results, intake metadata, or
  monitor scripts.
- The label uses `Snapshot` capitalization to stay consistent with the product
  naming rule.

## Deferred

- Broader copy changes on demo, playbook, calculator, or support-tax pages
  remain out of scope until we choose whether those routes should also route
  through the Snapshot landing page instead of intake.
- Results-page positioning and paid-report unlock presentation remain separate
  from this public entry-label sweep.
- Historical plan-doc memorials of prior labels remain by design in
  `web/plans/PR-Deflection-Long-Page-Snapshot-Bridge.md` and
  `web/plans/PR-Deflection-Snapshot-Entry-Links.md`; those files document what
  previous slices changed and verified at the time.
- Parked hardening: none.

## Verification

- `git grep -nP "View the free Deflection Snapshot|View the free Snapshot|See the free snapshot offer|See the free Deflection Snapshot" -- web` -
  passed; no `web/src` runtime source files contain the old public entry
  labels. Remaining matches are the historical plan-doc memorials named in
  Deferred and this plan's verification command.
- `rg -n "Get the free Snapshot first|support-ticket-deflection/snapshot" web/src/app/systems/page.tsx web/src/app/systems/ai-content-ops/page.tsx web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx -S` -
  passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems`, `/systems/ai-content-ops`, and
  `/systems/support-ticket-deflection` at `127.0.0.1:3110` desktop 1440x1100
  and mobile 390x844 - passed; the new label rendered with Snapshot hrefs, old
  labels were absent, no framework error overlay appeared, and mobile reported
  no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Entry CTA labels | ~5 |
| Total | ~85 |
