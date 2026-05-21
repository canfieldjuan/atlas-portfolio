# PR-Content-Ops-Public-FAQ-Demo

## Why this slice exists

The AI Content Ops landing page showed a mock FAQ Report artifact with fake SaaS
examples such as password resets, plan downgrades, API keys, and "12,400 tickets
ingested." That weakened the page's proof because the product is meant to turn
real support-ticket-style records into grounded FAQ output.

This slice replaces the mock sample with a static demo derived from a local CFPB
public complaint archive. It intentionally avoids a live CFPB fetch because the
endpoint returned a 504 during planning; the production-safe path is a checked-in
static artifact and static on-page excerpts.

This PR is stacked on `codex/diagnostic-landing-template` because that existing
open PR contains the shared diagnostic landing-page extraction this page now uses.

## Scope (this PR)

1. Replace the mock FAQ Report sample on `/systems/ai-content-ops` with a public
   CFPB complaint archive demo.
2. Show the local archive facts, the 46-row demo sample, and the three ranked
   issue groups.
3. Render generated-output excerpts with human question phrasing, condensed
   issue summaries, numbered action steps, contact-support guidance, and CFPB
   source IDs.
4. Add a static Markdown artifact visitors can inspect from the sample card.
5. Keep the existing landing-page structure, CTA flow, and `DiagnosticReportLandingPage`
   integration unchanged.

### Files touched

- `src/app/systems/ai-content-ops/page.tsx`
- `public/systems/ai-content-ops/public-support-ticket-faq-demo.md`
- `plans/PR-Content-Ops-Public-FAQ-Demo.md`

## Mechanism

`FAQReportSample` keeps the existing static client-rendered artifact seam, but
the local demo data now describes three CFPB-derived issue groups:

```tsx
const sampleRankedQuestions = [
  { issue: `Credit report disputes`, count: 28 },
  { issue: `Mortgage servicing issues`, count: 12 },
  { issue: `Debt collection disputes`, count: 6 },
];
```

The sample card computes the 46 sampled rows from that local data, renders the
ranked groups as source-row counts, and renders FAQ excerpts from structured
`steps` arrays as ordered lists. The card footer explains that the demo uses a
public complaint dataset and links to the static Markdown artifact under
`public/`, which Next serves at
`/systems/ai-content-ops/public-support-ticket-faq-demo.md`.

## Intentional

- No runtime CFPB fetch. The live endpoint timed out during planning, and this
  landing-page proof should not depend on a third-party request at render time.
- No new abstraction for demo data. The artifact is still small and local to one
  page, so moving it into a separate content layer would add indirection without
  reuse.
- The page remains a FAQ Report product page, not a CFPB-specific product page.
  CFPB is used only as public proof data for the sample artifact.
- The PR is stacked on `codex/diagnostic-landing-template` instead of `main` to
  avoid mixing this slice into the already-open template-extraction PR.

## Deferred

- A future PR can replace the curated static demo with a generated artifact
  pipeline if the portfolio site needs repeatable demo generation.
- A future PR can add visual regression coverage for landing-page sample cards if
  the portfolio app grows a browser test suite.

## Verification

Completed:

- `git diff --check`
- `npm run lint`
- `npm run build`
- Browser verification at `http://localhost:3000/systems/ai-content-ops`:
  no error overlay, public dataset copy visible, no `Sample / Mock` copy, no
  fake `12,400 tickets` count, CTA href remains `/systems/ai-content-ops/intake`.
- Mobile browser verification at 390px width:
  no horizontal overflow, action steps visible, support-contact guidance visible,
  CTA href remains `/systems/ai-content-ops/intake`.
- Static artifact verification:
  `curl http://localhost:3000/systems/ai-content-ops/public-support-ticket-faq-demo.md`
  returned `200 text/markdown`.

Not available in this checkout:

- `bash scripts/local_pr_review.sh` because this portfolio repo does not include
  the Atlas local PR review wrapper.

## Estimated diff size

3 files, approximately +285 / -74 lines. This is under the 400 LOC soft cap.
