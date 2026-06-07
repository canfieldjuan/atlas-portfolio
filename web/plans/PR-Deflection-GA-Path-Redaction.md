## Why this slice exists

Issue #272 documents that Google Analytics receives opaque deflection report
request IDs through `page_path` and `page_location`. The #270 comeback events
omit request IDs from their own payloads, but GA events inherit the current page
context, so fixing only those event params would leave the page-view leak open.

This slice closes the root analytics path leak for the deflection results route
and the related admin gap-report request-id route shape.

## Scope (this PR)

Slice phase: Production hardening

1. Redact sensitive dynamic request-id segments before GA receives
   `page_path` or `page_location`.
2. Apply the same sanitized page context to analytics events so inherited event
   page metadata does not reintroduce the raw ID.
3. Disable Google Ads' automatic raw page view and emit the same redacted page
   context to the Ads property when an Ads ID is configured.
4. Preserve route-level analytics by reporting the route shape, not dropping the
   page view or event.
5. Add focused regression coverage that exercises page-view and event tracking
   with a real `gtag` stub.
6. Enroll the focused regression test in the pre-push audit workflow.

### Files touched

- `.github/workflows/pre_push_audit.yml` - CI enrollment for the focused GA
  path-redaction test.
- `web/plans/PR-Deflection-GA-Path-Redaction.md` - plan for this slice.
- `web/package.json` - focused test script entry.
- `web/src/components/GoogleAnalytics.tsx` - disables Google Ads' automatic raw
  page view during bootstrap.
- `web/src/lib/analytics.ts` - shared GA path redaction and event page context.
- `web/scripts/test-deflection-ga-path-redaction.mjs` - focused regression
  coverage for redacted page views and events.

## Mechanism

`trackPageView(path)` will pass the incoming path through a small route-shape
redactor before calling `gtag('config', ...)`. The redactor maps:

```ts
/systems/support-ticket-deflection/results/<requestId>
// to
/systems/support-ticket-deflection/results/[requestId]
```

and similarly maps `/admin/intake/gap-report/<requestId>` to the route shape.
Query strings are preserved so conversion-level route analytics still works
without retaining the opaque ID.

`trackEvent(...)` will add sanitized `page_path` and `page_location` derived from
the current browser location. Those sanitized page fields override any caller
provided page context, because the privacy boundary belongs in the shared
analytics helper rather than each event caller.

`GoogleAnalytics.tsx` will initialize both GA and Google Ads with
`send_page_view: false`. `trackPageView(...)` then emits the explicit redacted
page-view config to GA and, when configured, Google Ads. That prevents the Ads
property from firing a raw `document.location` hit on direct results-page loads.

## Intentional

- The `GoogleAnalytics.tsx` change is limited to disabling Ads' automatic page
  view. Script loading and the client pathname/query collection stay unchanged.
- Public slugs, such as `/resources/[slug]`, are not redacted because the issue
  is opaque request IDs, not public content URLs.
- Query strings are preserved. The current results-page query values are
  checkout/price-variant state, and preserving them keeps route-level conversion
  analytics useful while removing the sensitive path segment.

## Deferred

- No broader analytics taxonomy cleanup is included. This slice only closes the
  request-id leak named in #272.
- No admin analytics opt-out is added. If GA runs on an admin route, this slice
  redacts the request-id segment; broader admin tracking policy is separate.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-ga-path-redaction` - PASS; printed
  `Deflection GA path redaction tests passed.`
- `node web/scripts/audit-test-enrollment.mjs` - PASS; printed
  `All 24 test:* scripts are enrolled in .../.github/workflows/pre_push_audit.yml.`
- `npm --prefix web run lint -- src/components/GoogleAnalytics.tsx src/lib/analytics.ts scripts/test-deflection-ga-path-redaction.mjs`
  - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `rg -n "page_path|page_location|redactAnalyticsPath|send_page_view: false|GOOGLE_ADS_ID|/systems/support-ticket-deflection/results/\\[requestId\\]|/admin/intake/gap-report/\\[requestId\\]" web/src/components/GoogleAnalytics.tsx web/src/lib/analytics.ts web/scripts/test-deflection-ga-path-redaction.mjs`
  - PASS; output showed the redaction helper, both redacted route shapes, and
  assertions for redacted page-view/event `page_path` and `page_location`. The
  old bare Ads config string appears only in the negative `assertNotIncludes`
  fixture.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Workflow enrollment | +3 / -0 |
| Plan doc | +110 |
| Package script | +1 / -0 |
| Google Analytics bootstrap | +1 / -1 |
| Analytics helper | +42 / -5 |
| Focused test | +156 / -0 |
| Total | ~320 changed |
