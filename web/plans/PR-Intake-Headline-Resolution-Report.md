# PR-Intake-Headline-Resolution-Report

## Why this slice exists

The support-ticket-deflection intake and Snapshot landing copy described the
*engine* ("deterministic FAQ gap audit", "100% Deterministic Engine",
"Representative Snapshot", "decide what to fix", "no bot touches your
customers") rather than the *outcome* a visitor came for. This slice rewrites
that copy around the Ticket Resolution Report framing and an action-first
message: read your Snapshot, then resolve the most expensive unresolved
tickets. It also trims the cost-band value anchor and shortens the
verified-window estimates disclaimer.

## Scope

Slice phase: Product polish

Copy-only pass over the intake form and the Snapshot landing page (both the
inline hero form and the dedicated `/intake` route share one form component),
plus the smoke markers / unit-test fixtures that pin the changed strings. No
data contract, route, or form-behavior changes. The only non-copy edit is
removing the now-unused `DEFLECTION_FULL_REPORT_PRICE_LABEL` import after its
sole use was deleted from the value anchor.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` -- intake headline + trust-badge copy.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` -- Snapshot landing copy + dropped price-label import.
- `web/src/components/landing/DeflectionSupportTaxProjection.tsx` -- estimates disclaimer copy.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` -- live smoke markers (inline form, value anchor, final ask).
- `web/scripts/smoke-deflection-public-reachability.mjs` -- live smoke markers (headline, trust badge).
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` -- unit fixtures/markers + artifact heading assertion.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` -- unit fixtures/assertions.
- `web/scripts/test-deflection-cost-projection-share.mjs` -- value-anchor bridge assertion.
- `web/plans/PR-Intake-Headline-Resolution-Report.md` -- this plan doc.

## Mechanism

All visible strings are edited in place. The intake form heading becomes "Get
your ticket resolution report and start taking actionable steps to resolve
tickets today."; the first trust-badge card becomes "No LLM or Generative
models." / "Our engine does not use...". On the Snapshot landing page the
reworded regions are: the artifact eyebrow/heading/intro, the snapshot label
and lead-in heading, the proof section heading + body, the first proof-list item
("Grounded in resolved tickets"), the third proof-list item ("No LLM or Model
touches your data" / "resolution queue"), and the final CTA band heading +
paragraph. The cost-band value anchor drops its closing full-report-price
sentence (removing the only `DEFLECTION_FULL_REPORT_PRICE_LABEL` use), and the
both estimates-disclaimer branches are matched to "Estimates only. They are
not savings guarantees." (collapsing the source-window ternary for that line).

The deflection smokes assert on rendered copy as required markers, so every
changed marker string is updated in lockstep: the live-smoke marker tables
(including `valueAnchor` and `finalSnapshotAsk`, re-pointed to surviving copy),
the unit-smoke `GOOD_HTML`/`GOOD_INTAKE` fixtures and their
`replace()`/`includes()` assertions, and the cost-projection-share bridge
assertion (which previously required the full-report-price phrase).

## Intentional

- Action/resolution framing over engine-describing copy across both surfaces.
- Trust badges lead with the explicit "no LLM / generative models" guarantee.
- Value anchor no longer references the full-report price; the cost band ends on
  the recurring-cost message only (operator-requested).
- Corrected obvious autocorrect/leftover slips in requested copy ("desolation"
  -> "resolution"; "one answer drafted resolution" -> "one drafted resolution";
  singular -> plural "questions" in the CTA paragraph).
- Incorporated reviewer accuracy fixes: "unresolved tickets" -> "unresolved
  questions" (the upload ingests closed tickets, so "tickets" misread as open),
  restored the "scoped resolution" qualifier the draft gate actually requires,
  and applied minor grammar/punctuation fixes (sourced/drafted, dangling
  clause, proof-title period).
- Smoke markers/assertions re-pointed to surviving copy so the suites stay
  meaningful rather than disabled.

## Deferred

- Hero `<h1>` ("Deflect tickets by actually resolving them.") is unchanged.
- The `/intake` route metadata description is unchanged.
- The intake PII card keeps its "best-effort local scrubbing" wording; the
  stronger "never make it into the report" claim is deferred until the scrubbing
  implementation backs it and the CSV-privacy contract is updated deliberately
  (tracked in #325). The CSV-privacy contract test forbids the absolute claim.
- The "EXAMPLE RESOLUTION SNAPSHOT" eyebrow is set uppercase to match the
  existing monospace eyebrow styling; revisit if sentence case is preferred.
- Smoke suites assert on literal rendered copy (a pre-existing pattern across
  ~15 markers); refactoring them to stable identifiers is tracked in #323.
- Surfacing high-cost-but-unresolved repeat questions (vs. dropping them) is
  tracked in #324.

Parked hardening: none

## Verification

Commands run from the repo root:

- `node web/scripts/test-deflection-snapshot-landing-smoke.mjs` -- passed.
- `node web/scripts/test-deflection-public-reachability-smoke.mjs` -- passed.
- `node web/scripts/test-deflection-cost-projection-share.mjs` -- passed.
- `npm --prefix web ci` then `bash scripts/local_pr_review.sh` -- passed
  (plan-doc audits, ESLint, Next build, `git diff --check`).
- Stale-copy guard for the changed recurring strings:
  `grep -rn "Start a deterministic FAQ gap audit\.\|100% Deterministic Engine\|This intake does not use\|What the free Resolution Report hands you\.\|REPRESENTATIVE SNAPSHOT\|one-time cost against that recurring bill\|Read the Snapshot, then decide what to fix\|Built for one narrow decision\|No bot touches your customers\|The only ask on this page is the CSV upload" web/src web/scripts`
  -- no matches in active code. Remaining hits are historical plan docs
  recording prior slices, plus this plan quoting the old strings.

## Estimated diff size

| Section | Size |
|---|---|
| Total | ~190 LOC |
