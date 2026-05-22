# AI Content Ops Route Correction Log

Date: 2026-05-22

## What Happened

The `/systems/ai-content-ops` page was supposed to remain the broader AI Content Ops Station page.

During the Support Ticket Deflection work, the existing `/systems/ai-content-ops` route was rebranded in place instead of creating a separate route for the new wedge. That changed the public AI Content Ops page into a support-ticket/report-style page.

The follow-up route split restored `/systems/ai-content-ops` only to the pre-Deflection FAQ Report version. That was still not the original broad AI Content Ops Station page. It removed the Deflection name from the route, but the page still looked and behaved like the newer narrow report-style page.

## Current Issue

`/systems/ai-content-ops` is still not back to the original broad product positioning.

It currently reflects the FAQ Report / support-ticket report family:

- support-ticket CSV input
- FAQ Snapshot
- Full FAQ Report
- report artifact preview
- intake flow for support-ticket CSV upload

That is too close to the new Support Ticket Deflection page and does not represent the broader AI Content Ops Station offer.

## Intended Route Ownership

`/systems/ai-content-ops`

- Broad AI Content Ops Station page.
- Should speak to content operations across blogs, landing pages, email campaigns, comparison pages, campaign assets, and review workflows.
- Should not be primarily a support-ticket CSV report page.

`/systems/support-ticket-deflection`

- Focused Support Ticket Deflection Report wedge.
- Owns the support-ticket CSV input, Deflection Snapshot, repeat-ticket ranking, self-service answer drafts, and support-cost angle.

## Root Cause

The correction used the wrong baseline.

I treated the last pre-Deflection version as the original page. In git history, that baseline was already the FAQ Report page. The broader AI Content Ops Station page exists earlier in history, around the pre-Gap-Report commits such as `46d694a`, where the page still discussed blogs, emails, reports, landing page sections, sales briefs, and campaign outputs.

## Resolution Plan

Create a dedicated restore PR that does only this:

1. Restore `/systems/ai-content-ops` to the broader AI Content Ops Station positioning.
2. Keep `/systems/support-ticket-deflection` as the focused support-ticket wedge.
3. Preserve the shared components that are genuinely reusable.
4. Avoid forcing the broad AI Content Ops page into the diagnostic-report template if that shape is wrong for the broader product.
5. Keep PR #50 acquisition-pack work separate from this correction.

## Verification For The Restore PR

The restore is only correct if:

- `/systems/ai-content-ops` no longer leads with FAQ Report, Deflection Snapshot, or support-ticket CSV as the core offer.
- `/systems/ai-content-ops` clearly covers broader content operations: blogs, landing pages, email campaigns, comparison pages, campaign assets, and review workflows.
- `/systems/support-ticket-deflection` still renders the Support Ticket Deflection Report page.
- Both routes have distinct metadata, CTAs, and buyer promises.
- `npm run lint` and `npm run build` pass.
