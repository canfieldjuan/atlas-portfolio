# PR-Calculator-Channel-Plumbing

## Why this slice exists

Issue #480, final slice. The two calculator landers now exist (#482, #483)
but the channel plumbing does not: both routes share the site-wide generic
OG card, so the link unfurl — the only thing most feed-scrollers ever see on
LinkedIn or Reddit — says "AI Solutions Architect" instead of making the
cost claim; and there is no way to tell whether visitors who arrive actually
touch the calculators or click the CTAs. This slice ships per-route OG
images carrying each channel's claim and headline number, and calculator
engagement/CTA events with traffic-source attribution.

The estimate lands over the 400 LOC soft cap (~500); ~120 is this plan doc
and ~190 is the two OG image routes, which are deliberately verbatim-style
mirrors of the root `opengraph-image.tsx` boilerplate. The behavioral diff
(analytics wrappers, tests, component wiring) is ~170 LOC, and splitting the
OG cards from the events would ship two PRs that each fail to make the
landers measurable-and-shareable on their own.

## Scope (this PR)

Slice phase: Product polish

1. Per-route `opengraph-image.tsx` for `/systems/support-ticket-deflection/calculator`
   (LinkedIn claim: the leaky bucket and the ~$268K/yr default total) and
   `/systems/support-ticket-deflection/support-tax` (Reddit claim: repeat
   tickets at $108K/yr defaults, assumptions adjustable) — the first
   page-specific OG images in the repo, mirroring the root
   `opengraph-image.tsx` conventions (`ImageResponse`, edge runtime,
   1200x630).
2. Two analytics wrappers in `analytics.ts` following the existing `trackX`
   shape: `trackCalculatorEngaged` (fires once per session per calculator
   via a sessionStorage guard, with `calculator` and `traffic_source`
   dimensions read from `?src=`/`?utm_source=`) and
   `trackCalculatorCtaClicked` (`calculator` + `cta` + `traffic_source`).
3. Wire both calculator components: engagement fires on the first input
   change; CTA clicks fire on the intake CTA (both calculators) and the
   email-breakdown mailto (leaky bucket).
4. Test cases for the new wrappers in the already-enrolled
   `analytics.test.ts` (`test:deflection-ga-path-redaction`) — no
   enrollment edits needed this slice.
5. Park personalized-per-share-link OG cards in `HARDENING.md`: the
   `opengraph-image` file convention receives route params only, never
   `searchParams`, so a share-link-personalized card needs a different
   mechanism.

### Files touched

- `web/src/app/systems/support-ticket-deflection/calculator/opengraph-image.tsx` — new LinkedIn OG card.
- `web/src/app/systems/support-ticket-deflection/support-tax/opengraph-image.tsx` — new Reddit OG card.
- `web/src/lib/analytics.ts` — calculator engagement + CTA-click wrappers.
- `web/src/lib/analytics.test.ts` — cases for the new wrappers.
- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` — wire events.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — wire events.
- `HARDENING.md` — park personalized OG cards.
- `web/plans/PR-Calculator-Channel-Plumbing.md` — document the slice.

## Mechanism

Each OG route exports the same `runtime`/`size`/`contentType`/`alt` shape as
the root card and renders the channel claim with the default-inputs headline
number as static copy (a comment points at `support-tax-math.ts` and the
pinned defaults the number derives from). Next serves them at
`<route>/opengraph-image` and wires the `og:image` meta automatically; the
`generatePageMetadata` images pointing at the site-wide card are overridden
by the route-level file per the file-convention precedence.

`trackCalculatorEngaged` checks `canTrack()` first (so an unavailable gtag
does not burn the once-per-session flag), then a
`sessionStorage` guard keyed by calculator id, then emits through the
existing `trackEvent` (which attaches redacted page context). A try/catch
around storage access degrades to always-track in private-mode browsers.
`traffic_source` prefers `?src=` and falls back to `?utm_source=`, both via
`safeDimension`. Components wrap their slider `onChange` setters with a
small `withEngagement` helper so any input touch marks engagement; CTA
handlers call `trackCalculatorCtaClicked` with `cta: 'intake'` or
`cta: 'email_breakdown'`.

## Intentional

- The OG headline numbers are static copy, not computed at request time:
  they are the pinned test-suite defaults, and a comment names the source.
  If the model changes, `test:support-tax-math` fails first and the copy
  gets updated in that slice.
- Engagement is once per session per calculator (not per page view) because
  the question it answers is "did arrivals touch the tool at all";
  per-interaction volume would be noise.
- The share-state keys stay out of tracked page paths (shipped in #482);
  these explicit events are how calculator context reaches analytics. The
  same route-scoped strip now applies inside `currentAnalyticsPageParams`,
  so event `page_path`/`page_location` match page-view redaction instead of
  leaking slider state through the event side channel (review finding).
- No new test suite: `analytics.test.ts` is already enrolled as
  `test:deflection-ga-path-redaction`, and the new cases live with the
  existing wrapper tests.
- The two parked calculator-math entries were scanned per the `HARDENING.md`
  workflow and remain parked: nothing here changes the model or its
  rendering.

## Deferred

- Personalized per-share-link OG cards — parked as
  SUPPORT-TAX-OG-PERSONALIZED-1 (the file convention has no `searchParams`
  access; needs a `route.tsx` ImageResponse handler + `generateMetadata`).
- Post creative itself (screen-recording GIF, static result images) — not a
  repo artifact.
- Resolving SUPPORT-TAX-MATH-1 / SUPPORT-TAX-MATH-2 — still a product
  decision; unchanged by this slice.

Parked hardening: SUPPORT-TAX-OG-PERSONALIZED-1; SUPPORT-TAX-MATH-1;
SUPPORT-TAX-MATH-2

## Verification

- `npm --prefix web run test:deflection-ga-path-redaction` — existing +
  new wrapper cases pass (session-once dedupe, src/utm fallback, CTA dims).
- `npm --prefix web run test:support-tax-math` — untouched math still
  pinned (source of the OG headline numbers).
- `npm --prefix web run test:deflection-public-reachability-smoke` —
  guarded CTA strings intact after the component wiring.
- `npm --prefix web run lint` — clean.
- `bash scripts/local_pr_review.sh` — full local gate; the Next build
  compiles both OG routes and lists them in the route output.
- Manual: dev-server GET `/systems/support-ticket-deflection/calculator/opengraph-image`
  and `/systems/support-ticket-deflection/support-tax/opengraph-image`
  return PNG cards with the channel claims.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/src/app/systems/support-ticket-deflection/calculator/opengraph-image.tsx` | ~95 |
| `web/src/app/systems/support-ticket-deflection/support-tax/opengraph-image.tsx` | ~95 |
| `web/src/lib/analytics.ts` | ~55 |
| `web/src/lib/analytics.test.ts` | ~90 |
| `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` | ~15 |
| `web/src/components/deflection-demo/SupportTaxCalculator.tsx` | ~20 |
| `HARDENING.md` | ~10 |
| `web/plans/PR-Calculator-Channel-Plumbing.md` | ~120 |
| Total | ~500 |
