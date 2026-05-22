# PR-Support-Deflection-Route-Split

## Why this slice exists

PR-Support-Ticket-Deflection-Rebrand changed the existing `/systems/ai-content-ops` page in place. That was the wrong route shape. AI Content Ops should remain the broader content-operations product page, and Support Ticket Deflection should live as its own focused wedge page.

This slice restores the old AI Content Ops page and intake language, then creates a new Support Ticket Deflection route from the rebranded page work instead of discarding it.

## Scope (this PR)

1. Restore `/systems/ai-content-ops` and `/systems/ai-content-ops/intake` to the pre-rebrand FAQ Report copy and metadata.
2. Create `/systems/support-ticket-deflection` with the Support Ticket Deflection Report landing page.
3. Create `/systems/support-ticket-deflection/intake` for the Deflection Snapshot upload flow.
4. Update intake email copy so the same API sends offer-specific FAQ Report or Deflection Report language based on `sourceOffer`.
5. Wire the new route into `/systems` and `sitemap.xml`.

### Files touched

- `src/app/systems/ai-content-ops/page.tsx`
- `src/app/systems/ai-content-ops/layout.tsx`
- `src/app/systems/ai-content-ops/intake/page.tsx`
- `src/app/systems/ai-content-ops/intake/layout.tsx`
- `src/app/systems/support-ticket-deflection/page.tsx`
- `src/app/systems/support-ticket-deflection/layout.tsx`
- `src/app/systems/support-ticket-deflection/intake/page.tsx`
- `src/app/systems/support-ticket-deflection/intake/layout.tsx`
- `src/components/landing/SupportTicketCsvIntakePage.tsx`
- `src/app/systems/page.tsx`
- `src/app/sitemap.ts`
- `src/lib/gap-report-intake.ts`
- `public/systems/support-ticket-deflection/public-support-ticket-deflection-demo.md`
- `public/systems/support-ticket-deflection/public-support-ticket-deflection-1000-row-validated.md`
- `docs/landing-page-framework/decisions.md`
- `plans/PR-Support-Deflection-Route-Split.md`

## Mechanism

The existing AI Content Ops files are restored from the last pre-rebrand commit. The current Support Ticket Deflection page and intake are moved to the new route and patched so their CTAs, metadata, breadcrumbs, analytics payload, and source fields point at `/systems/support-ticket-deflection`.

The two intake routes share `SupportTicketCsvIntakePage`, a configurable CSV upload component. The FAQ route passes FAQ Snapshot copy and `gap-report-intake`; the deflection route passes Deflection Snapshot copy and `support-ticket-deflection-intake`.

The intake API remains `/api/gap-report-intake` to avoid a persistence/API migration. `recordGapReportSubmission` derives public email copy from `sourceOffer`, so restored AI Content Ops submissions get FAQ Report wording and new support-deflection submissions get Deflection Report wording.

## Intentional

- Keep the shared `DiagnosticReportLandingPage` template. The route owns copy/artifacts; the template owns layout rhythm.
- Do not rename internal `gap-report` env vars or database fields in this slice.
- Do not duplicate a second API route for the new intake page.
- Do not change pricing, demo links, or CSV validation behavior.

## Deferred

- A later PR can rename internal gap-report terminology after the public page split is validated.
- PR-Support-Deflection-First-Analysis-Motion remains a separate docs slice.

## Verification

Completed:

- `git diff --check`
- `npm run lint`
- `npm run build`
- Browser spot-check `/systems/ai-content-ops`, `/systems/ai-content-ops/intake`, `/systems/support-ticket-deflection`, and `/systems/support-ticket-deflection/intake` for route load, metadata titles, error overlays, and horizontal overflow.

## Estimated diff size

16 files, +1929 / -543. This intentionally exceeds the 400-line soft cap because the slice restores one full landing page, creates one full new landing-page route, extracts the shared intake component, and adds route-specific public demo artifacts. Splitting those pieces would leave either the original page still overwritten or the new page partially wired.
