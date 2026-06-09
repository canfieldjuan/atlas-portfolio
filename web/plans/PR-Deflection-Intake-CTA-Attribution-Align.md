# PR-Deflection-Intake-CTA-Attribution-Align

## Why this slice exists

PR #300 intentionally left the intake submit CTA text unchanged to avoid
analytics churn while shipping deterministic messaging + trust badge work for
#1367. That follow-up is now due: the intake submit CTA should align with the
current "Get my free Deflection Snapshot" offer language, and analytics should
preserve stable machine attribution while also capturing the visible CTA label.

## Scope (this PR)

Slice phase: Product polish

1. Update the intake submit CTA copy to match the current deflection offer
   voice.
2. Keep canonical `sourceOffer` tracking stable, and add a distinct
   human-readable `source_offer_label` analytics dimension sourced from the
   visible submit CTA label.
3. Update deflection public reachability smoke markers/tests to enforce the new
   submit CTA string.
4. Keep upload mechanics, backend submit payload shape, source-offer slug, and
   deflection report processing behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Intake-CTA-Attribution-Align.md` - plan contract for
  this slice.
- `web/src/app/systems/support-ticket-deflection/intake/page.tsx` - submit CTA
  label value passed into the intake component copy contract.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - pass visible
  CTA label to analytics tracking while preserving source-offer slug.
- `web/src/lib/analytics.ts` - extend `trackFaqReportCsvSubmitted` params with
  optional `sourceOfferLabel` and emit `source_offer_label`.
- `web/scripts/smoke-deflection-public-reachability.mjs` - submit CTA marker
  update.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - fixture/source
  assertions updated for the new submit CTA marker.

## Mechanism

The runtime contract remains stable at the machine level (`sourceOffer` stays
`support-ticket-deflection-intake`). The only funnel-language change is the
submit button label in the intake route copy object. The analytics helper gains
an optional `sourceOfferLabel` field so the event carries both stable slug and
human-facing CTA wording.

Reachability smoke marker strings are updated so the hosted smoke fails if the
submit CTA regresses.

## Intentional

- No backend schema or intake database contract changes; this slice is
  frontend copy + analytics event payload shape only.
- No landing/snapshot/partner CTA changes; this slice targets the intake submit
  button only.
- No event-name changes (`faq_report_csv_submitted` remains unchanged).

## Deferred

- Extending persisted intake records to store a dedicated offer-label column for
  the deflection route remains out of scope in this slice.

Parked hardening: none.

## Verification

- `cd /home/juan-canfield/Desktop/atlas-portfolio/web && node scripts/test-deflection-public-reachability-smoke.mjs` - pass.
- `cd /home/juan-canfield/Desktop/atlas-portfolio && rg -n "Upload CSV, get your free Deflection Snapshot" web/src web/scripts || true` - no stale runtime/smoke marker usage after update.
- `cd /home/juan-canfield/Desktop/atlas-portfolio && bash scripts/local_pr_review.sh` - pass.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Intake-CTA-Attribution-Align.md` | ~85 |
| `web/src/app/systems/support-ticket-deflection/intake/page.tsx` | ~1 |
| `web/src/components/landing/SupportTicketCsvIntakePage.tsx` | ~6 |
| `web/src/lib/analytics.ts` | ~8 |
| `web/scripts/smoke-deflection-public-reachability.mjs` | ~1 |
| `web/scripts/test-deflection-public-reachability-smoke.mjs` | ~6 |
| Total | ~107 |
