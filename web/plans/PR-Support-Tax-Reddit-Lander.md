# PR-Support-Tax-Reddit-Lander

## Why this slice exists

Issue #480: `/systems/support-ticket-deflection/support-tax` will receive
Reddit traffic, and Reddit audiences attack hidden assumptions before they
engage. Today the 30-second calculator hardcodes its two model assumptions
(40% repeat share, 12-minute touch time) as static copy, hides the formula,
and offers no way to share a configured result back into a thread. This slice
makes transparency the feature: the assumptions become editable inputs, the
formula renders in plain text, and slider state round-trips through the URL
so a commenter can paste their own numbers. Slice A extracted the math with
repeat share and touch hours already parameterized, so no model change is
needed here.

## Scope (this PR)

Slice phase: Product polish

1. Add a `support-tax-share-state` lib owning the four input ranges and the
   URL query mapping (`v`/`c`/`r`/`t`), clamped through `clampToStep`,
   defaults omitted from built queries. Unit-tested round-trip.
2. Rework `ThirtySecondCalculator`: repeat-share and touch-time sliders
   inside a collapsed "Assumptions" expander replacing the static assumption
   cards; a plain-text formula line under the headline result; state
   initialized from `useSearchParams` and written back with
   `window.history.replaceState` (the documented shallow-update pattern in
   this Next version).
3. Page shell: remove the "Back to Support Ticket Deflection" escape-hatch
   link (this is a no-chrome conversion page) and wrap the calculator in the
   `<Suspense>` boundary `useSearchParams` requires on prerendered routes.
4. Refresh the route metadata description, which currently reads "from two
   inputs" and would go stale.

### Files touched

- `web/src/lib/support-tax-share-state.ts` — new input-range + URL-state lib.
- `web/src/lib/support-tax-share-state.test.ts` — new round-trip/clamp suite.
- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` — editable assumptions, formula line, URL state.
- `web/src/components/GoogleAnalytics.tsx` — strip calculator share params from tracked page paths.
- `web/src/app/systems/support-ticket-deflection/support-tax/page.tsx` — back-link removal, Suspense wrap.
- `web/src/app/systems/support-ticket-deflection/support-tax/layout.tsx` — metadata description refresh.
- `web/package.json` — enroll `test:support-tax-share-state`.
- `.github/workflows/pre_push_audit.yml` — enroll `test:support-tax-share-state`.
- `web/plans/PR-Support-Tax-Reddit-Lander.md` — document the slice.

## Mechanism

`support-tax-share-state.ts` exports `SUPPORT_TAX_INPUTS` (volume, cost,
repeat %, touch minutes — each `{ min, max, step, default }`),
`parseSupportTaxShareState(params)` and `buildSupportTaxShareQuery(state)`.
Parsing accepts anything with `.get()` (works for both `URLSearchParams` and
Next's read-only wrapper), treats non-numeric values as defaults, and clamps
numeric values through Slice A's `clampToStep`, so a hand-edited or hostile
query string can never render an out-of-range state. Building omits
default-valued params so shared links stay minimal and the bare URL stays
canonical. Repeat share uses the same 10-70% band as the leaky-bucket
calculator's repeat input; touch time allows 2-60 minutes around the
12-minute default.

The component reads the initial state once from `useSearchParams`, keeps the
existing `useState` flow, converts to model units at the call site
(`repeatShare: repeatPct / 100`, `touchHoursPerTicket: touchMinutes / 60` —
`computeQuickSupportTax` already takes both as parameters), and mirrors state
into the URL from a `useEffect` via `history.replaceState` — no navigation,
no scroll, no re-render loop. The URL write is debounced (250 ms) and goes
through `mergeSupportTaxShareQuery`, which edits only the four
calculator-owned keys in the existing query string — arriving `utm_*` /
campaign params survive the mirror. Because the App Router syncs native
history updates into `useSearchParams`, `GoogleAnalytics` would otherwise
log a page view per slider commit; `stripSupportTaxShareParams` (route-scoped
to this page) removes the share keys from the tracked path so slider
movement never registers as traffic while attribution params stay tracked. The static "Industry-average assumptions"
cards become a native `<details>` expander titled "Assumptions — think we're
wrong? Change them" holding two more `SliderField`s, with the old defaults
named as the industry averages in its copy. The formula line composes the
exact inputs the math consumed: `1,500 tickets x 40% repeat x $15 =
$9,000/mo -> $108,000/yr`.

## Intentional

- The `Start Your Forensic Audit` CTA string and the guarded reachability
  copy are untouched; no "Snapshot"-era phrases are introduced.
- The mini calculator keeps its fixed 40%/12-min assumption cards — it is an
  embedded teaser on the main landing page, and its job is to hand off to
  this page ("See the full calculator") where the assumptions are editable.
- `history.replaceState` (not `router.replace`) is deliberate: the docs
  endorse it for shallow query updates, and it avoids re-running the router
  on every slider tick.
- Repeat-share and touch-time state lives in this component, not in Slice A's
  math module — the model already takes them as parameters; only the page
  owns their UI ranges.
- Page-view tracking intentionally drops `v`/`c`/`r`/`t` on this route:
  share-link arrivals still register as page views of the route itself, and
  calculator-context analytics arrive as explicit events in the channel
  plumbing slice. `GoogleAnalytics` imports the strip helper from the
  share-state lib so the param keys have a single owner.
- The H1 and intro copy still lead with "two numbers in" — the two primary
  inputs are unchanged; the assumptions are optional overrides in a collapsed
  section.
- Estimated total lands over the 400 LOC soft cap (~521); ~135 is this plan
  doc and ~135 the test suite. The overage comes from review-driven
  hardening (utm preservation, page-view strip) that belongs in the same
  slice because it corrects behavior this slice introduced.

## Deferred

- The LinkedIn lander rework of the leaky-bucket page (progressive
  disclosure, email micro-conversion, its back-link removal) —
  `PR-Leaky-Bucket-LinkedIn-Lander`, next slice.
- Per-route OG images and calculator analytics events (including tracking
  shared-link arrivals) — `PR-Calculator-Channel-Plumbing`.
- A copy-to-clipboard "share your result" button; the URL bar carries the
  state for now, which is enough for Reddit paste-backs.

Parked hardening: none

## Verification

- `npm --prefix web run test:support-tax-share-state` — round-trip, clamp,
  default-omission, utm-preservation, and page-view strip cases pass.
- `npm --prefix web run test:support-tax-math` — untouched math still pinned.
- `npm --prefix web run test:deflection-public-reachability-smoke` — guarded
  CTA strings intact.
- `npm --prefix web run check:test-enrollment` — new suite enrolled in both
  `package.json` and the workflow.
- `npm --prefix web run lint` — clean.
- `rg -n "two inputs" web/src` — no stale instance after the metadata
  refresh (the calculator component's own intro says "Two numbers in", which
  remains true and intentional).
- `rg -n "Back to Support Ticket Deflection" web/src/app/systems/support-ticket-deflection/support-tax/` —
  gone from this route; the calculator page keeps its instance until the
  next slice removes it.
- `bash scripts/local_pr_review.sh` — full local gate including the Next
  build, which fails if the `useSearchParams` Suspense boundary is missing.
- Manual: load `/systems/support-ticket-deflection/support-tax?v=3000&c=20&r=55&t=8`
  on the dev server and confirm the sliders hydrate to those values and the
  URL updates as sliders move.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/src/lib/support-tax-share-state.ts` | ~105 |
| `web/src/lib/support-tax-share-state.test.ts` | ~135 |
| `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` | ~115 |
| `web/src/components/GoogleAnalytics.tsx` | ~8 |
| `web/src/app/systems/support-ticket-deflection/support-tax/page.tsx` | ~15 |
| `web/src/app/systems/support-ticket-deflection/support-tax/layout.tsx` | ~4 |
| `web/package.json` | ~1 |
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/plans/PR-Support-Tax-Reddit-Lander.md` | ~135 |
| Total | ~521 |
