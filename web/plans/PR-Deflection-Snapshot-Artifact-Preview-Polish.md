## Why this slice exists

The merged hero now sells the free Snapshot as the one offer. The next public
landing-page slice needs the artifact preview below the hero to feel like a
concrete deliverable rather than a generic report screenshot. The current panel
shows ranked repeats and locked rows, but it hides the sourced draft sample and
does not summarize the Snapshot's value in one scan.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the representative artifact header around what the free Snapshot
   hands over: repeat volume, Support Tax estimate, one sourced draft, and locked
   backlog depth.
2. Make the top-repeat rows more concrete by showing ticket counts beside the
   priority score.
3. Show the bounded sourced draft sample inside the artifact preview so the page
   demonstrates answer quality before asking for any paid next step.
4. Preserve the route, CTA, smoke markers, intake, checkout, pricing, results,
   partner routing, monitor/runbook docs, and payload contracts.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Artifact-Preview-Polish.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

`SnapshotArtifact` already receives `DEMO_DEFLECTION_SNAPSHOT`, including
summary counts, `top_questions[].ticket_count`, `locked_questions`, and the
bounded teaser draft. This slice changes only the public-page rendering of that
existing fixture: it derives the same benchmark Support Tax estimate from
`snapshotCostProof(snapshot)`, renders a four-card summary row, changes the
question-row metric from score-first to ticket-count-first, and lets the
existing `AnswerTeaser` render in the lower representative artifact.

`AnswerTeaser` remains bounded to the already-allowed teaser answer body and its
step list. No evidence quotes, source IDs, Markdown, or non-teaser answer bodies
are introduced.

## Intentional

- This is public landing-page presentation only, not the uploaded results-page
  redesign from issue #196.
- The Support Tax value remains benchmark-based and representative; copy keeps
  the existing no-guaranteed-savings disclaimer.
- The lower artifact repeats the one sourced draft after the hero on purpose so
  the "Picture" section reads as an inspectable deliverable.
- No smoke marker changes are needed because the monitored hero, CTA, and
  Snapshot-first markers stay intact.

## Deferred

- Section-order and redundancy cuts remain the next planned public-page slice.
- Results-page positioning, payload-backed locked rows, and paid-report
  presentation remain separate work.
- Entry-link and CTA consistency across other pages waits until the public page
  copy settles.
- Parked hardening: none.

## Verification

- `rg -n "Repeat-question diagnostic" web/src/components/landing/DeflectionSnapshotLandingPage.tsx -S` -
  passed; no stale old artifact title remains in the component.
- `rg -n "What the free Snapshot hands you\\.|Included free draft|ticket hits|Support Tax estimate" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Artifact-Preview-Polish.md -S` -
  passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` at
  `127.0.0.1:3108` desktop 1440x1100 and mobile 390x844 - passed; the artifact
  title, included draft, step list, `Support Tax estimate`, and CTA rendered, no
  framework error overlay appeared, and mobile reported no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Snapshot artifact polish | ~70 |
| Total | ~150 |
