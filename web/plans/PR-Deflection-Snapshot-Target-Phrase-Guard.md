## Why this slice exists

Issue #263 identifies a claims gap: the results and landing copy promise a ranked target list built from customer wording, but real Snapshots can carry an empty `customer_wording` string. The shared row renderer then shows `target phrase from your tickets: ""`, which makes the deliverable look broken and overclaims what the current backend reliably provides.

This slice hardens the portfolio frontend immediately while leaving the backend wording-extraction feature for ATLAS. Empty customer wording no longer renders as empty quotes, copy says target phrases appear when available, and the `/snapshot` demo shows the same top-5 free-tier rows as the real results page instead of masking ranks 4-5.

## Scope (this PR)

Slice phase: Product polish

1. Guard `DeflectionTopQuestionRows` so the target-phrase line renders only when `customer_wording.trim()` is non-empty.
2. Soften results-page and landing-page copy from guaranteed target phrases to ranked repeat questions with target phrases when present.
3. Remove the `/snapshot` demo `limit={3}` so all fixture top questions render, matching the real free results page's top-5 shape.
4. Update the existing row-renderer sharing guard to prove the empty-phrase guard, top-5 landing parity, and no bespoke row renderer regression.

### Files touched

- `web/src/components/landing/DeflectionSnapshotRows.tsx` - guard the target-phrase line behind non-empty customer wording.
- `web/src/components/landing/DeflectionResultsPage.tsx` - soften the target-phrase copy for real uploaded results.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - show all top questions in the demo and soften target-list copy.
- `web/scripts/test-deflection-row-renderer-share.mjs` - add static guards for the render guard and top-5 demo parity.
- `web/plans/PR-Deflection-Snapshot-Target-Phrase-Guard.md` - plan for this slice.

## Mechanism

The row renderer trims customer wording once per row and renders the phrase label only when the trimmed string is truthy:

```tsx
const customerWording = question.customer_wording.trim();
{customerWording && (
  <p>target phrase from your tickets: "{customerWording}"</p>
)}
```

This preserves the target-phrase affordance for Snapshots that provide real wording and avoids showing empty quotes for Snapshots that do not. Copy around the list now describes ranked repeat questions first and target phrases as conditional evidence, matching current backend behavior.

## Intentional

- This PR does not change the `DeflectionSnapshot` contract or ATLAS generation. Backend population of `customer_wording` remains a separate ATLAS/product decision.
- The demo fixture still contains customer wording because it is a representative idealized demo; the visible demo now renders all five top questions so ranks 4-5 are no longer orphaned.
- No checkout, pricing, upload, paid artifact, or live API behavior changes are in scope.

## Deferred

- Backend feature: populate `customer_wording` from real ticket text in ATLAS so every visible row can carry a true customer phrase when the data supports it.
- If product wants to guarantee target phrases as a paid/report deliverable, add an end-to-end fixture or live validation slice that proves non-empty wording on representative uploaded CSVs.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-row-renderer-share` - PASS; guards
  the shared row renderers, `customer_wording.trim()` guard, conditional
  target-phrase rendering, and no `limit={3}` on the landing demo.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS.
- `npm --prefix web run lint -- src/components/landing/DeflectionSnapshotRows.tsx src/components/landing/DeflectionResultsPage.tsx src/components/landing/DeflectionSnapshotLandingPage.tsx scripts/test-deflection-row-renderer-share.mjs` - PASS.
- `npm --prefix web run build` - PASS; Next build completed, including
  TypeScript and static page generation.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://localhost:3120` - PASS against the local dev server.
- `agent-browser --args "--no-sandbox" open http://localhost:3120/systems/support-ticket-deflection/snapshot && agent-browser wait --load networkidle && agent-browser eval 'JSON.stringify({hasRank4: document.body.innerText.includes("Can I export my data before downgrading?"), hasRank5: document.body.innerText.includes("My team seat is not showing up after I invited someone."), hasSoftCopy: document.body.innerText.includes("Customer wording can become the target list"), hasOldCopy: document.body.innerText.includes("Customer wording becomes the target list"), hasEmptyQuotes: document.body.innerText.includes("target phrase from your tickets: \\"\\""), title: document.title, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth})'` - PASS; returned `{"hasRank4":true,"hasRank5":true,"hasSoftCopy":true,"hasOldCopy":false,"hasEmptyQuotes":false,"title":"Free Deflection Snapshot: Find Repeat Support Tickets to Deflect First","scrollWidth":1265,"innerWidth":1280}`.
- `bash scripts/local_pr_review.sh` - PASS; plan audits, drift advisory,
  ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | ~75 LOC |
| Row renderer guard | ~80 LOC |
| Copy/demo parity | ~25 LOC |
| Static guard updates | ~20 LOC |
| Total | ~200 LOC |
