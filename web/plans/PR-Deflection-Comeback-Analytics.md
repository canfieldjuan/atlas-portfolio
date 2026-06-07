## Why this slice exists

Issue #268 asks whether we should build a lost-email recovery flow for buyers
who come back days later but no longer have their results URL. PR #269 shipped
the cheap mitigation: tell buyers to save/bookmark the confirmation email.

The next useful step is measurement, not accounts or magic links. We need to
know whether buyers actually return to locked results later and whether they
click unlock after the first day. This slice instruments that demand with
bounded, non-PII analytics.

## Scope (this PR)

Slice phase: Functional validation

1. Add GA events for locked results page views and unlock-button clicks.
2. Include only non-sensitive dimensions: submission age bucket, price variant,
   checkout return status, and aggregate snapshot counts.
3. Load the submission timestamp from the existing gap-report submission row
   when available; if the database row is missing or unavailable, analytics
   still fires with an `unknown` age bucket.
4. Add focused static regression coverage for the analytics contract.

### Files touched

- `web/plans/PR-Deflection-Comeback-Analytics.md` - plan for this slice.
- `web/package.json` - focused test script entry.
- `web/src/lib/analytics.ts` - result-view and unlock-click event helpers.
- `web/src/lib/gap-report-intake-database.ts` - report-request lookup for
  submission metadata.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx`
  - server-side age-bucket context for the client page.
- `web/src/components/landing/DeflectionResultsPage.tsx` - client-side event
  firing on locked snapshot view and unlock intent.
- `web/scripts/test-deflection-comeback-analytics.mjs` - focused regression
  coverage for event names, payload hygiene, and wiring.

## Mechanism

The results route already queries the saved price variant by `reportRequestId`.
This slice adds a sibling lookup that returns the persisted submission row for
that same report request. The server computes a coarse age bucket:

```ts
same_day | day_1_3 | day_4_7 | day_8_30 | over_30_days | unknown
```

`DeflectionResultsPage` receives that context and fires:

- `faq_report_results_viewed` once per locked-results render.
- `faq_report_unlock_clicked` when the buyer clicks the unlock CTA.

Neither event includes request IDs, email, company name, exact timestamps, blob
URLs, source IDs, answers, or free-text ticket content.

## Intentional

- No recovery endpoint, account flow, or magic-link email is added. #268 keeps
  those as future options after demand is measured.
- Analytics is best-effort and must not block results rendering. Missing database
  config or lookup errors collapse to `unknown`.
- Unlock is tracked at click intent, before checkout session creation, so the
  event still records intent even if Stripe/session creation later fails.

## Deferred

- Email-based recovery remains deferred until the analytics shows material
  late-comeback demand.
- A broader conversion funnel dashboard is deferred; this slice only emits the
  events needed to answer #268's recovery question.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-comeback-analytics` - PASS; printed
  `Deflection comeback analytics tests passed.`
- `npm --prefix web run test:deflection-hosted-results-smoke` - PASS; printed
  `Deflection hosted results smoke tests passed.`
- `npm --prefix web run lint -- src/lib/analytics.ts src/lib/gap-report-intake-database.ts src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx src/components/landing/DeflectionResultsPage.tsx scripts/test-deflection-comeback-analytics.mjs`
  - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest. First run failed on a `safeCount()` TypeScript narrowing issue; fixed
  and reran successfully.
- `rg -n "faq_report_results_viewed|faq_report_unlock_clicked|submission_age_bucket|request_id|email|company_name|csv_blob_url|requestId|companyName|csvBlobUrl|submittedAt" web/src/lib/analytics.ts`
  - PASS; output showed only `submission_age_bucket`,
  `faq_report_results_viewed`, and `faq_report_unlock_clicked`, confirming the
  analytics payload helper does not include request IDs or buyer identity fields.
- `rg -n "faq_report_results_viewed|faq_report_unlock_clicked" web/src web/scripts`
  - PASS; found only `web/src/lib/analytics.ts` event emission and
  `web/scripts/test-deflection-comeback-analytics.mjs` assertions.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +96 |
| Analytics helpers | +41 / -0 |
| Database lookup + results route | +100 / -2 |
| Results page event wiring | +25 / -1 |
| Focused test + package script | +109 / -0 |
| Total | ~373 changed |
