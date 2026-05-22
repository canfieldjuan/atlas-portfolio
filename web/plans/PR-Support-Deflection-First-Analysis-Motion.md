# PR-Support-Deflection-First-Analysis-Motion

## Why this slice exists

PR-Support-Ticket-Deflection-Rebrand made `/systems/ai-content-ops` a focused Support Ticket Deflection Report page. The page now has a clearer offer, but the framework still leaves two operating decisions open: how to get the first five customers and whether to run the first analyses manually or build the productized workflow first.

This slice closes those decisions at the documentation/contract layer before more pages are built. The next product page should not be created until the current wedge has a clear first-analysis motion and proof collection path.

## Scope (this PR)

1. Decide D-019: first-five-customer acquisition motion for Support Ticket Deflection.
2. Decide D-020: first analyses run as a hybrid workflow, with manual learning before productization.
3. Add a first-analysis operating playbook covering target account shape, CSV requirements, manual workflow, review gates, proof collection, and claim boundaries.
4. Preserve the existing page, intake, API, and email behavior.

### Files touched

- `docs/landing-page-framework/decisions.md`
- `docs/landing-page-framework/support-deflection-first-analysis.md`
- `plans/PR-Support-Deflection-First-Analysis-Motion.md`

## Mechanism

The decisions log moves D-019 and D-020 from open to decided. A new playbook makes the manual/hybrid delivery path concrete enough that the landing-page promise has an operational counterpart without adding new app code.

The playbook uses the same offer boundaries as the landing page: ranked repeat tickets, customer-language examples, sample self-service answers, and a concrete action path. It explicitly rejects guaranteed deflection percentages, rank guarantees, churn-prevention claims, or fully automated delivery language.

## Intentional

- No new product page in this slice. The next page needs a validated wedge contract first.
- No automation build yet. First analyses should expose workflow gaps before productization.
- No new public claims. This slice documents proof collection but does not turn that proof into marketing copy before outcomes exist.
- No changes to the existing intake route or email implementation.

## Deferred

- A later PR can add outreach emails, LinkedIn scripts, or CRM tracking fields once this operating contract is reviewed.
- A later PR can add a report-rendering template after the first manual snapshots reveal the stable report shape.
- A later PR can create the next product page after a second wedge contract is selected.

## Verification

Completed:

- `git diff --check`
- Markdown/content review for D-019, D-020, and the new playbook.

## Estimated diff size

3 files, expected under 300 changed lines because this is a docs/contract slice.
