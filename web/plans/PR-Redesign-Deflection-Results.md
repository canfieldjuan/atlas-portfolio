## Why this slice exists

The free snapshot page acts as the primary B2B acquisition funnel to sell the $1,500 Full Backlog Report. Currently, the page layout and design are flat and resemble a text report rather than a high-value, mouthwatering SaaS dashboard. Visual elements such as calculator metrics, locked backlog lists, teaser answers, and checkout offers require design upgrades to increase their perceived value, readability, and conversion rate. This slice is slightly over the 400-LOC soft cap because the useful unit is one cohesive results-page presentation pass; splitting summary, locked-depth, answer-preview, and checkout-offer polish would leave the sales surface visually inconsistent across adjacent sections.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the free snapshot results page as a polished sales surface for the $1,500 Full Backlog Report.
2. Keep the existing data contract, checkout state, and result gating unchanged.
3. Improve perceived value with stronger metric hierarchy, visible locked depth, a more concrete answer preview, and a clearer paid unlock panel.

### Files touched

- `web/plans/PR-Redesign-Deflection-Results.md` - plan contract for this slice.
- `web/src/components/landing/DeflectionResultsPage.tsx` - Redesign components to enhance layout structure, dashboard visuals, locked-depth cues, and checkout CTA presentation.

## Mechanism

We will redesign the following sections in `web/src/components/landing/DeflectionResultsPage.tsx`:
1. **Hero Summary Widget**: Replace the plain summary text with a styled distribution bar showing Drafted vs. Unresolved questions as a clean segmented CSS bar.
2. **Support Tax Calculator & Metrics**:
   - Modernize the metric cards with glassmorphic styling, enhanced shadows, and larger typography.
   - Apply a glowing border highlight to the 12-month run-rate card to emphasize the support-tax projection.
3. **Keyword targeting pill grid**: Group mined customer phrases into structured tag cards.
4. **Ranked Questions**: Enhance progress bar gradients and clean up list alignment.
5. **Locked Questions**: Add a bottom gradient mask to fade the locked list out, visually signaling an extensive backlog, and style scrollbars.
6. **Teaser Answer**: Style the sample drafted answer as a help-desk answer preview, complete with a "Draft ready for review" header status tag and locked source-ticket cue.
7. **Final Offer Checkout Card**: Rebuild the card into a modern two-column layout on desktop:
   - Left side: Clean value checklist detailing exactly what the buyer receives in the Full Backlog Report.
   - Right side: Clean pricing checkout widget with Stripe security indicator and a large action button.

## Intentional

- **No New API Calls / State**: We modify strictly presentation and layout logic. All interactive state (slider cost value, checkout loading state) remains identical to prevent regressions.
- **Client-Side Tailored styling**: Instead of external charting libraries, we construct responsive CSS bar graphs and flex-based grids to keep page load times fast and dependencies low.
- **Payment copy remains bounded**: The checkout CTA says Stripe unlocks the full report after payment confirmation rather than promising instant delivery regardless of webhook timing.

## Deferred

Parked hardening: none

## Verification

1. `npm --prefix web run lint` - passed.
2. `npm --prefix web run build` - passed.
3. `rg -n "Ready to Sync|Instant Delivery|p-4\\.5|View source tickets|3.?6 month" web/src/components/landing/DeflectionResultsPage.tsx web/src/app/systems/page.tsx web/src/app/systems/ai-content-ops/page.tsx` - passed with no matches.
4. Review fix grep: `rg --pcre2 -n "repeat-ticket insights|complete ranked backlog \\x{2014}|proven resolution \\x{2014}|Ready to Sync|Instant Delivery|p-4\\.5|View source tickets|3.?6 month" web/src/components/landing/DeflectionResultsPage.tsx web/src/app/systems/page.tsx web/src/app/systems/ai-content-ops/page.tsx` - passed with no matches.
5. Browser check with `agent-browser` on `/systems/support-ticket-deflection/results/00000000-0000-4000-8000-000000000000` using local demo fixture fallback - passed; desktop and 390px mobile renders had no framework overlay, no horizontal overflow, visible summary/support-tax/locked-answer/offer sections, and visible `$1,500` checkout CTA/security copy.
6. `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Section | Size |
|---|---|
| web/src/components/landing/DeflectionResultsPage.tsx | ~400 lines modified |
| web/plans/PR-Redesign-Deflection-Results.md | ~55 lines added |
| Total | ~470 |
