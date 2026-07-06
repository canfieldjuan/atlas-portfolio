# PR-Support-Tax-Share-Button

## Why this slice exists

The Reddit lander `/systems/support-ticket-deflection/support-tax` already
encodes the configured result in the URL (`?v=&c=&r=&t=`), but nothing tells the
visitor that. Most of this traffic is mobile, where no one thinks to copy the
address bar. A "Share your results" button makes the share loop explicit: a
visitor tunes their numbers and hands a link to the exact result back into a
thread. That is the highest-credibility thing on this page — someone else's
numbers, not a pitch — and it fits the no-sell posture (the page has no CTA).
This is the copy-to-clipboard share button deferred in
`PR-Support-Tax-Reddit-Lander`.

## Scope (this PR)

Slice phase: Product polish

1. Add a "Share your results" button to the 30-second calculator that copies an
   absolute link to the currently-configured result to the clipboard and
   confirms with a "Copied!" state.
2. Add a `trackCalculatorShared` analytics wrapper and fire it on share, so the
   button's usage is measurable alongside the existing engagement/CTA events.

### Files touched

- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` — share button, copy handler, imports.
- `web/src/lib/analytics.ts` — `trackCalculatorShared` wrapper.
- `web/src/lib/analytics.test.ts` — case for the new wrapper.
- `web/plans/PR-Support-Tax-Share-Button.md` — document the slice.

## Mechanism

The button builds its link from **live component state**, not the address bar:
the URL mirror is written on a 250 ms debounce, so reading `window.location`
could hand out a link one drag stale. The handler calls
`buildSupportTaxShareQuery({ monthlyTickets, costPerTicket, repeatPct,
touchMinutes })` (from `@/lib/support-tax-share-state`, which already omits
default-valued params) and composes `SITE_URL` (`@/lib/seo`) + `SUPPORT_TAX_ROUTE`
+ the query, so the copied URL is absolute (`https://juancanfield.com/...`) and
canonical (bare defaults → no query string).

Copy uses `navigator.clipboard.writeText` in a try/catch. On success the button
swaps to a `Check` icon + "Copied!" for 2 s via a `useRef`-held timeout cleared
on unmount; on failure (blocked clipboard / insecure context) it renders the URL
in a read-only, auto-selecting input so the visitor can copy it by hand.
Production is HTTPS (secure context), so the happy path dominates. Each share
fires `trackCalculatorShared({ calculator: 'thirty_second' })`, a new wrapper
mirroring `trackCalculatorEngaged`/`trackCalculatorCtaClicked` (same
`traffic_source` dimension via the private `currentTrafficSource` helper).

## Intentional

- Copy-link with a "Copied!" confirmation, not a native share sheet
  (`navigator.share`) — operator's call; it behaves identically on desktop and
  mobile with no browser-support branching.
- The link is built from live state to avoid the debounce race; `SITE_URL`
  makes it absolute so a pasted link resolves off-site.
- `trackCalculatorShared` is in scope because it measures the button this slice
  adds; it rides the already-enrolled `analytics.test.ts`
  (`test:deflection-ga-path-redaction`) with one new case — no enrollment edit.
- Placed directly under the results hero / formula line so "here's your number"
  and "share it" sit together.

## Deferred

- Personalized per-share-link OG cards remain parked as
  `SUPPORT-TAX-OG-PERSONALIZED-1`: a shared `?v=&c=&r=&t=` link still unfurls
  with the default-numbers preview card. Per the operator, ship the button now
  and leave that for later; the shared link itself carries the correct state.
- Adding the same button to the leaky-bucket calculator is not requested; that
  page keeps its email-breakdown micro-conversion.

Parked hardening: SUPPORT-TAX-OG-PERSONALIZED-1

## Verification

- `npm --prefix web run test:deflection-ga-path-redaction` — new
  `trackCalculatorShared` case passes (calculator + traffic_source dims; share
  params stripped from the event page path).
- `npm --prefix web run test:support-tax-share-state` — the reused
  `buildSupportTaxShareQuery` behavior is unchanged/pinned.
- `npm --prefix web run test:deflection-public-reachability-smoke` — guarded
  copy intact; the new button strings add no banned wording.
- `npm --prefix web run lint` — clean (escaped copy, no unused imports).
- `npm --prefix web run check:dead-code` — knip baseline unchanged; the new
  wrapper export is consumed by the component.
- `bash scripts/local_pr_review.sh` — full local gate incl. the Next build.
- Manual: on `/support-tax`, tune the sliders, click "Share your results",
  confirm the clipboard link is absolute and reproduces the configured state,
  and the button shows "Copied!" for ~2 s.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` | ~70 |
| `web/src/lib/analytics.ts` | ~8 |
| `web/src/lib/analytics.test.ts` | ~22 |
| `web/plans/PR-Support-Tax-Share-Button.md` | ~95 |
| Total | ~195 |
