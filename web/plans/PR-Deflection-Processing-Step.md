# Plan: Deflection processing step

## Why this slice exists

Issue #291 asks for a non-blocking product-polish improvement after CSV upload:
the current intake flow jumps directly from submit to the Snapshot results page,
which hides the meaningful ticket-analysis work happening behind the scenes. A
short intermediate step should make the flow feel more transparent and valuable
without changing the final Snapshot destination.

## Scope (this PR)

Slice phase: Product polish
Ownership lane: deflection/go-live

1. Add a post-submit processing/status state as soon as a valid intake form is
   submitted.
2. Show truthful, bounded processing steps: reading the export, grouping repeat
   questions, pulling customer wording, building the free Snapshot preview, and
   preparing ranked deflection targets.
3. Continue to the same Snapshot results URL after a short delay.
4. Include a manual Snapshot link so users are not trapped if client redirect is
   slow or blocked.
5. Preserve the existing fallback success screen when no report results URL is
   available.
6. Update source-level tests that assert the successful intake redirect path.

### Files touched

- `web/plans/PR-Deflection-Processing-Step.md` - this plan doc.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - processing
  state UI and delayed redirect.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - source-level
  assertions for the successful ATLAS submit transition.

### Review Contract

Acceptance criteria:
- A successful deflection intake with a valid `reportRequestId` renders an
  intermediate processing/status screen before navigating to results.
- The processing copy names only real Snapshot work and does not expose private
  ticket contents, source IDs, evidence, or paid-report details.
- The final destination remains the same shared `deflectionResultsPath(...)`
  results URL.
- A manual Snapshot link is available while the redirect is pending.
- The no-`reportRequestId` fallback success screen remains available.

Affected surfaces:
- Support Ticket Deflection CSV intake client.
- Source-level ATLAS submit regression test.

Risk areas:
- Replacing the immediate redirect could trap users if the timer fails.
- Copy could overpromise analysis details or leak locked paid-report concepts.
- Existing fallback handling for warning/no-results branches could regress.

Triggered reviewer rules:
- R1 Requirements match.
- R2 Test evidence.
- R7 UI/copy truthfulness.
- R11 Scope control.

## Mechanism

The existing submit handler still uploads the CSV, posts `/record`, validates the
payload, tracks the submitted event, and uses `deflectionResultsPath(...)` for
the final URL. Once validation passes, the form switches to a processing screen
while upload and record calls run. When `/record` returns a validated results
URL, the same screen keeps rendering and stores that URL.

A `useEffect` watches the ready processing state and schedules the same
`window.location.assign(resultsHref)` after a short delay. The processing screen
shows the bounded step list immediately; once the results URL exists, it also
shows a normal link to the Snapshot results URL as a fallback.

## Intentional

- No backend, ATLAS submit, Blob upload, persistence, checkout, pricing, or
  results-page changes.
- No new route or polling API; this is a thin perceived-value transition between
  an already-successful intake response and the existing results page.
- The fallback `success` state remains for cases where the CSV was received but
  no validated report results URL is available.

## Deferred

- A richer progress system backed by real server-side status events remains out
  of scope until the backend exposes per-step processing state.
- Browser-level timing assertions remain out of scope for this source-level
  slice.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run check:dead-code` - passed; Knip baseline still matches
  16 known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `rg -n "source_ids|evidence_quotes|paid report|source ticket" web/src/components/landing/SupportTicketCsvIntakePage.tsx` -
  passed; no private source/evidence or paid-report terms appear in the intake
  transition UI.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size, drift advisory, dead-code baseline, ESLint, Next build, and
  whitespace checks passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +118 |
| Intake page processing state | +131 / -21 |
| Source-level test assertions | +17 / -3 |
| Total | ~289 changed |
