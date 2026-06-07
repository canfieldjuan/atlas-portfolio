## Why this slice exists

After the hero and trust reframe, the short `/snapshot` page still carries
older defensive copy patterns from the earlier offer build. Issues #246, #247,
and #250 call out the same friction cluster: repeated synthetic-data and
estimate disclaimers, repeated paywall language before the visitor has seen
value, and low-contrast disclaimer text. This slice trims that friction without
removing the one honest disclosure or hiding that a paid full report can exist
after the free Snapshot.

## Scope (this PR)

Slice phase: Product polish

1. Consolidate synthetic-data and estimate-disclaimer copy so the page keeps one
   visible synthetic-example label and one clear "not a savings promise" line.
2. Reduce repeated paywall language across the page to one light optional-paid
   mention after the cost proof, while removing heavier `behind checkout`,
   `before paying`, and `worth unlocking` phrasing from marketing sections.
3. Replace the hedging proof-section headline with a more constructive
   "narrow decision" frame and remove remaining unclear jargon from the final
   CTA.
4. Raise or remove low-contrast disclaimer text where the text carries legal or
   expectation-setting weight.
5. Update Snapshot landing smoke markers and the mocked fixture for the one
   monitored copy string changed by this slice.
6. Preserve route, CTA href/label, intake, Blob handling, trust block,
   metadata, result page, checkout, pricing, partner funnel, and smoke coverage.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Copy-Friction-Trim.md`
- `web/scripts/smoke-deflection-snapshot-landing.mjs`
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

The page keeps the same component structure and fixture. Copy changes stay in
`DeflectionSnapshotLandingPage.tsx`:

- the cost band keeps the one benchmark caveat but removes extra paid-report
  pressure around the adjacent CTA;
- the hero proof panel keeps one clear synthetic-example badge and drops the
  duplicated footnote;
- the representative artifact keeps only a concise relative-score/data-origin
  note at readable contrast;
- artifact, proof, and final CTA sections remove repeated `paying`,
  `behind checkout`, `unlocking`, and `no-proven-answer list` language.

Because the smoke monitor keys on visible body copy, the `snapshotFirst` marker
is updated from the old paid-report-first sentence to the new optional-paid
expectation sentence, and the mocked smoke fixture is updated with the same
string.

## Intentional

- This is copy and smoke-marker alignment only; no runtime flow, storage,
  checkout, result, partner, pricing, route, or metadata behavior changes.
- The page still sets a light expectation that a paid full report may follow the
  free Snapshot; it does not hide the paid tier.
- The synthetic-data disclosure is not removed. It is consolidated to one
  visible badge because the rendered demo values are representative.
- Broader rendering fidelity from #245 is out of scope because it requires a
  shared component/refactor slice.

## Deferred

- #245 shared rendering between the marketing preview and real results page
  remains a later structural slice.
- Future route-level copy sweeps can revisit demo/playbook/calculator wording if
  those pages need the same paid-language trim.
- Parked hardening: none.

## Verification

- `rg -n "Representative labeled-synthetic support set|benchmark estimates are not guaranteed savings|behind checkout|before paying|worth unlocking|the artifact you inspect before paying|locked backlog depth before any paid report|no-proven-answer list|Strong claims, bounded by the data" web/src/components/landing/DeflectionSnapshotLandingPage.tsx -S` - passed; no stale defensive/paywall/jargon strings remain in runtime source.
- `rg -n "Representative synthetic example|not a savings promise|A paid full report is optional after the free results|Built for a narrow support decision|before any next step|Free ticket analysis|Find the repeat support questions costing your team time" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/smoke-deflection-snapshot-landing.mjs web/scripts/test-deflection-snapshot-landing-smoke.mjs web/plans/PR-Deflection-Snapshot-Copy-Friction-Trim.md -S` - passed; new runtime and smoke-marker copy is present.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3116` - passed against the local dev server.
- `agent-browser open http://127.0.0.1:3116/systems/support-ticket-deflection/snapshot && agent-browser wait --load networkidle && agent-browser eval 'document.body.innerText.trim().length > 0 ? "HAS_CONTENT" : "BLANK"' && agent-browser eval 'document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay") ? "ERROR_OVERLAY" : "OK"' && agent-browser snapshot -i` - passed; desktop page rendered expected headings and CTAs with content and no framework error overlay.
- `agent-browser set viewport 390 844 && agent-browser open http://127.0.0.1:3116/systems/support-ticket-deflection/snapshot && agent-browser wait --load networkidle && agent-browser eval 'document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay") ? "ERROR_OVERLAY" : "OK"' && agent-browser eval 'JSON.stringify({bodyText: document.body.innerText.trim().length, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1})' && agent-browser snapshot -i` - passed; mobile page rendered expected headings and CTAs with no framework error overlay and `hasHorizontalOverflow: false`.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~95 |
| Snapshot copy trim | ~45 |
| Smoke marker sync | ~4 |
| Total | ~145 |
