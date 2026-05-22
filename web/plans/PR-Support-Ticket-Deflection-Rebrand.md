# PR-Support-Ticket-Deflection-Rebrand

## Why this slice exists

The current `/systems/ai-content-ops` page sells the mechanism as an FAQ Report. The stronger buyer framing is support ticket deflection: a Head of Support or support-heavy operator cares about reducing repeat ticket volume and avoiding another hire, not about generating FAQs for their own sake.

This slice rebrands the existing support-ticket wedge toward the user's requested "Support Ticket Deflection" and "Automated Cost Cutter" angle while keeping the implementation grounded in current capabilities. The page can promise ranked repeat-ticket analysis, customer-language self-service answers, and a deflection rollout plan. It should not guarantee a fixed deflection percentage before customer measurement exists.

## Scope (this PR)

1. Rebrand visible landing-page language from FAQ Report to Support Ticket Deflection Report.
2. Reframe the hero, problem, solution, pricing, and final CTA around repeat-ticket cost and self-service deflection.
3. Update the route metadata, intake page copy, and customer/internal email copy so the visible offer name is consistent after form submission.
4. Update landing-page framework docs to record that the support-ticket wedge now uses deflection language.
5. Preserve route paths, API contracts, env var names, existing uploaded CSV flow, demo artifact links, pricing numbers, and no-chrome page behavior.

### Files touched

- `src/app/systems/ai-content-ops/page.tsx`
- `src/app/systems/ai-content-ops/layout.tsx`
- `src/app/systems/ai-content-ops/intake/page.tsx`
- `src/app/systems/ai-content-ops/intake/layout.tsx`
- `src/lib/gap-report-intake.ts`
- `docs/landing-page-framework/diagnostic-report-template.md`
- `docs/landing-page-framework/decisions.md`
- `docs/landing-page-framework/voice-reference.md`
- `plans/PR-Support-Ticket-Deflection-Rebrand.md`

## Mechanism

The route keeps using `DiagnosticReportLandingPage`; only copy and local artifact labels change. The support-ticket intake path remains `/systems/ai-content-ops/intake`, and the internal persistence/email module keeps its existing exported function and env var names so no integration contracts move.

The rebrand changes the visible offer from "FAQ Report" to "Support Ticket Deflection Report" and changes the free tier from "FAQ Snapshot" to "Deflection Snapshot." FAQ entries remain part of the deliverable, but they are positioned as a self-service layer that reduces avoidable repeat tickets.

## Intentional

- No guaranteed "deflect 30%" claim. The copy can talk about a deflection target or deflectable-ticket opportunities, but not promise a fixed percentage without measured client proof.
- No route rename. `/systems/ai-content-ops` already has incoming PR history, demo links, and intake wiring.
- No internal `gap-report` env var rename. That would be an API/config migration, not a branding slice.
- No product-template abstraction. This is a copy/positioning slice against the existing template.

## Deferred

- A later PR can rename internal modules/env vars if this offer name is validated and we want config terminology to match the public brand.
- A later PR can add measured deflection-rate proof after a customer publishes the recommended answers and ticket volume can be compared.
- A later PR can create a second product page from the same template once the next wedge contract is decided.

## Verification

Completed:

- `git diff --check`
- `npm run lint`
- `npm run build`
- Browser spot-check `/systems/ai-content-ops` and `/systems/ai-content-ops/intake` with `agent-browser` for page load, visible offer naming, error overlays, and horizontal overflow.

## Estimated diff size

9 files, expected under 400 changed lines because this is copy and documentation only.
