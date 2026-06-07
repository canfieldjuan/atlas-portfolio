## Why this slice exists

Issue #268 documents a gap in the free-to-paid comeback path: the report URL is
the buyer's capability link, and the uploaded CSV/submission is retained for 30
days, but there is no recovery flow if the buyer loses the confirmation email.

The issue is intentionally framed as discovery rather than a recovery feature
build. It names a cheap mitigation we can ship now: tell the buyer to save the
email or bookmark the results link, and explain that the same uploaded CSV can
still be upgraded during the 30-day window.

## Scope (this PR)

Slice phase: Product polish

1. Add the #268 comeback reminder to the customer confirmation email when a
   results URL is present.
2. Extend the focused email results-link test so the reminder is pinned for the
   standard and partner result links, and absent from the no-link path.

### Files touched

- `web/plans/PR-Deflection-Comeback-Email-Copy.md` - plan for this slice.
- `web/src/lib/gap-report-intake.ts` - customer confirmation email copy.
- `web/scripts/test-deflection-email-results-link.mjs` - focused regression
  coverage for the comeback reminder.

## Mechanism

`buildCustomerConfirmationText()` already computes `resultsUrl`. This slice
adds one conditional copy block after the "What happens next" section:

```ts
...(resultsUrl ? ['', 'Tip: save this email ...'] : [])
```

That keeps the reminder tied to emails that actually include a link and avoids
telling buyers to bookmark a URL when the no-link path is still promising a
24-hour delivery.

## Intentional

- No account, lookup, recovery endpoint, or magic-link flow is added. #268 says
  those are future options only if buyer behavior proves the need.
- The reminder appears only when `resultsUrl` is present. The no-link fallback
  email still says the snapshot will be sent within 24 hours.
- The existing 30-day privacy/deletion line remains unchanged; this slice adds a
  conversion/recovery reminder, not a new retention promise.

## Deferred

- Magic-link-by-email recovery remains deferred until there is evidence that
  buyers commonly lose the email after deciding not to buy immediately.
- Analytics for "decide a week later" funnel exits remains deferred; this slice
  is copy-only.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-email-results-link` - PASS; printed
  `Deflection email results-link tests passed.`
- `npm --prefix web run lint -- src/lib/gap-report-intake.ts scripts/test-deflection-email-results-link.mjs`
  - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `rg -n "save this email|bookmark your results link|upgrade to the full report during that window" web/src web/scripts`
  - PASS; found the reminder only in `web/src/lib/gap-report-intake.ts` and
  the focused regression assertions in
  `web/scripts/test-deflection-email-results-link.mjs`.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +80 |
| Email copy | +3 / -0 |
| Email test | +6 / -0 |
| Total | ~89 changed |
