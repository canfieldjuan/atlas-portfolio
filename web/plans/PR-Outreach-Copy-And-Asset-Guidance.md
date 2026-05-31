# Plan: Outreach copy and asset guidance

## Why this slice exists

Direct outreach is moving from a single lead list to segmented account/contact
lanes. The CSVs now carry category, copy, and asset-routing fields, but the
durable strategy needs a repo-safe reference that does not commit private lead
data. This slice records which buyer categories need which message style,
calculator asset, proof asset, and copy length.

## Scope (this PR)

Slice phase: Product polish

1. Add a reusable outreach guidance doc for Support Ticket Deflection prospecting.
2. Capture the approved category copy lanes, calculator routing, partner routing,
   technical/risk routing, and long-copy versus short-copy decision.
3. Keep generated prospect CSVs outside source control because they contain lead
   data and are working artifacts, not site source.

### Files touched

- `web/plans/PR-Outreach-Copy-And-Asset-Guidance.md` - this plan doc
- `web/docs/outreach-copy-guidance.md` - category copy, asset routing, and copy-length guidance

## Mechanism

The new doc is a plain Markdown playbook under `web/docs`. It maps each
`outreach_category` and key account motion to:

- what the contact cares about
- what should move them to act
- which asset should be sent
- which copy length is appropriate
- which language should be avoided

The doc also explains how the calculators should be used without turning the
Deflection Report into a cost-ranking product claim.

## Intentional

- The private Apollo CSV outputs are not committed. They live on the operator's
  Desktop as outreach working files.
- The calculator is treated as a prospect-supplied estimate, not a promised
  savings forecast.
- Short copy remains the default first touch. Longer copy is reserved for buyers,
  budget recommenders, partners, and internal justification.

## Deferred

- No email sequence templates are added in this slice.
- No landing-page or calculator UI changes are included.
- No CRM/import automation is added for the generated CSVs.

Parked hardening: none.

## Verification

- `bash scripts/local_pr_review.sh` = PASS. This ran the plan-doc audit bundle,
  cross-session drift audit, `npm --prefix web run lint`,
  `npm --prefix web run build`, and `git diff --check`.
- `git diff --name-only origin/main...HEAD | rg -i '(apollo|\.csv$)' || true`
  = no output; no generated lead CSV files are in the committed diff.
- `git diff origin/main...HEAD | rg -n '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' || true`
  = no output; no lead email addresses are in the committed diff.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Plan doc | ~65 |
| Outreach guidance doc | ~180 |
| **Total** | ~245 |
