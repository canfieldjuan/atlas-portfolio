# Plan: Re-anchor the deflection hero + strip em dashes (copy sweep)

Copy-only pass over the Support Ticket Deflection surfaces ahead of the outbound
push: fix the drifted hero headline, and remove em dashes site-wide because they
read as machine-generated and undercut a human outreach voice.

## Why this slice exists

- The hero H1 had drifted into an SEO / "search terms" frame and no longer named
  the recurring-ticket problem the wedge is about; the page's own body sections
  still carried the right framing, so the hero was out of step with its own page.
- Em dashes across the deflection copy read as "AI slop" (an obvious generated
  tell). With outbound LinkedIn + email starting, the landing copy a prospect
  clicks into needs to read human.

## Scope (this PR)

Slice phase: Product polish

1. **Hero** (`landingConfig-v2.tsx`) — new H1 "Is your Help Center deflecting
   tickets, or quietly creating more work?", intro re-pointed to answer it, CTA
   de-em-dashed.
2. **Em-dash sweep** — remove every em dash from user-facing deflection copy
   (v1 + v2 configs, intake, playbook, demo, partner, calculator, and the SEO
   layout meta), recast to commas/colons.
3. **Ticket window** — "3-6 months" → "3 months" everywhere it appears.
4. Left the `15-75-person` range and `results/*` (a parallel session's files,
   post-conversion) untouched.

### Files touched

- `web/plans/PR-Deflection-Copy-Sweep.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero re-anchor + sweep
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — sweep (v1, shared with partner funnel)
- `web/src/app/systems/support-ticket-deflection/layout.tsx` — SEO title/description
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` — SEO meta
- `web/src/app/systems/support-ticket-deflection/intake/page.tsx` — submit label
- `web/src/app/systems/support-ticket-deflection/playbook/layout.tsx` — SEO meta
- `web/src/app/systems/support-ticket-deflection/playbook/page.tsx` — body copy
- `web/src/app/systems/support-ticket-deflection/demo/layout.tsx` — SEO title
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — body + CTA
- `web/src/app/systems/support-ticket-deflection/partner/layout.tsx` — SEO meta
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — partner note
- `web/src/app/systems/support-ticket-deflection/calculator/layout.tsx` — SEO title
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — intake body copy + platform dropdown placeholder
- `web/src/components/deflection-demo/HowItWorks.tsx` — demo step copy
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — calculator copy + CTA label
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — demo empty/error-state copy

## Mechanism

- Global, exact-string recast of `" — "` → `", "` (a handful of SEO titles read
  as "X, Y", which is acceptable) and `"3-6 month"` → `"3 month"`. Copy and
  JSX-text only: no logic, no links/CTAs (hrefs unchanged), no behavior changes.
- Scope follows the import graph, not just the route directory: the deflection
  routes render shared components in `web/src/components/landing/` and
  `web/src/components/deflection-demo/`, so those are swept too. `//` code
  comments and `results/*` are left as-is.
- The `15-75-person` en-dash is a real numeric range, not a stylistic dash, so it
  is intentionally preserved.

## Intentional

- Commas for most recasts rather than reworking each sentence; the goal is
  removing the em-dash tell, not a full copy rewrite.
- `results/*` is excluded: those files are owned by a parallel session and are
  post-conversion (not outreach-facing).
- v1 `landingConfig.tsx` is swept even though it also feeds the `$1,000` partner
  funnel; the change is pure punctuation, so no funnel-specific behavior shifts.

## Deferred

- No copy rewrite beyond punctuation and the ticket-window number.
- The actual outreach copy (LinkedIn + cold email) is separate work.
- Non-deflection surfaces with their own "3-6 months" (`systems/page.tsx`,
  `ai-content-ops/page.tsx`) are out of scope for this deflection sweep.

Parked hardening: none.

## Verification

- `npm run lint` = 0; `npm run build` compiles.
- `grep` confirms 0 em dashes and 0 "3-6" remaining in the deflection copy
  (excluding `results/*`), and both `15-75-person` occurrences intact.
- `bash scripts/pre_push_audit.sh origin/main` + python files-touched and
  diff-size audits green (committed diff).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| em-dash + 3-6 sweep (11 route files) | ~136 |
| shared rendered components (4 files) | ~26 |
| hero re-anchor (v2) | ~26 |
| this plan doc | ~75 |
| **Total** | ~263 |
