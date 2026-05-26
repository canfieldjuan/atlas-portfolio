# Plan: Add the demo-sample request doc (B2B-SaaS sample handoff to the generator dev)

Saves the request to the generator/backend session for a defensible B2B-SaaS
sample to power the landing-page demo — the open question (audit Part 3) gating
the last demo card. Docs only; no product change.

## Why this slice exists

- The demo cards were rebuilt to the real `TicketFAQItem` shape (#93–#98), but the
  on-page `DeflectionReportSample` still runs on the off-ICP CFPB consumer dataset.
  Swapping to an on-domain B2B-SaaS demo needs a defensible sample source, which
  the generator dev owns. This doc is the precise, paste-ready ask so the handoff
  doesn't round-trip on missing fields.

## Scope (this PR)

Slice phase: Workflow/process

1. **New request doc** `web/docs/landing-page-framework/demo-sample-request.md`:
   context (why CFPB is off-ICP), exactly what we need (a
   `TicketFAQMarkdownResult` with 3–6 rich SaaS `items[]` + report-level proof
   fields, field-by-field), the defensibility constraint, four questions
   (existing public set vs synthesize-and-run; what we can say publicly;
   keep-or-replace CFPB), and the ideal deliverable (one sample JSON).

### Files touched

- `web/plans/PR-Demo-Sample-Request.md` — this plan doc (new)
- `web/docs/landing-page-framework/demo-sample-request.md` — the request (new)

## Mechanism

- Pure documentation. Lists the exact fields the rebuilt cards render (so the
  returned sample fills the demo with no missing-field round-trip) and the
  claims-defensibility constraint; asks, doesn't decide (keep-vs-replace CFPB is
  the dev's call).

## Intentional

- **Request, not a decision** — the source choice (public/synthetic/anonymized)
  and keep-vs-replace-CFPB are left to the generator dev + operator.
- **Field list mirrors what ships** — `when_to_contact_support`, `action_items`,
  `term_mappings`, `failure_risk_signals`, `answer_evidence_status`, etc., so the
  sample matches the cards (the "missing field" lesson from this week).

## Deferred

- The actual demo swap — once a defensible sample lands.
- #88 deploy follow-ups (verify direct-to-blob on the deploy; remove old route;
  rate-limit endpoints).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size). Markdown only — no lint/build impact.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `demo-sample-request.md` (new) | ~75 |
| this plan doc | ~52 |
| **Total** | ~127 |

Well under the 400-LOC soft cap.
