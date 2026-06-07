## Why this slice exists

Issues #248 and #249 identify the same conversion moment on the short
`/snapshot` page. The hero still leads with the Snapshot artifact and internal
language before the visitor understands the pain: repeat support questions
costing the team time. The upload CTA also asks for a PII-bearing CSV with only
a low-emphasis deletion line. A stronger headline should not ship without
visible upload reassurance next to the CTA, so this slice pairs the two fixes.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the Snapshot hero eyebrow, H1, and subhead so the first screen leads
   with repeat-ticket pain and plain-language outcome, not artifact-first or
   jargon-first wording.
2. Add a visible privacy/security trust block next to the hero upload CTA that
   explains the existing data-handling contract in plain language: private CSV
   upload, limited/admin-gated access, no model training or third-party sharing,
   and 30-day deletion.
3. Preserve the public route, CTA href, intake form behavior, Blob upload
   behavior, metadata, result page, checkout, pricing, partner funnel, and the
   downstream artifact/proof sections.
4. Update the Snapshot landing smoke marker and mocked smoke fixture for the new
   visible hero badge/H1 so the monitor keeps checking rendered body copy rather
   than matching the old text through metadata.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Hero-Trust-Reframe.md`
- `web/scripts/smoke-deflection-snapshot-landing.mjs`
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

`DeflectionSnapshotLandingPage` keeps the same layout, fixture, CTA component,
and downstream sections. The hero copy changes from artifact-led wording to
plain-language repeat-ticket cost wording. The old one-line privacy note beside
the CTA is replaced by a compact `HeroUploadTrust` block that uses existing
icons and states only behavior already present in the intake path:

- the client uploads with `access: 'private'`;
- `/record` validates that the Blob belongs to this app before recording it;
- CSV retrieval is behind the authenticated admin intake route;
- existing intake copy already states no model training, no third-party sharing,
  no fine-tuning, and 30-day deletion.

No storage, API, auth, or submission behavior changes are introduced.

The smoke marker script and its local mocked fixture are updated in tandem with
the visible hero badge and H1. This keeps the live monitor aligned with the
body-rendered page text after the first-screen copy change.

## Intentional

- This closes the first-screen pieces of #248 and #249 together because the
  issue epic says a stronger upload pull should not ship without trust
  reassurance.
- This does not solve #246 disclaimer de-duplication, #247 paywall-framing
  reduction, #250 residual jargon/free/contrast cleanup, or #245 rendering
  fidelity. Those remain separate slices.
- The trust block is factual and constrained to current behavior; it does not
  claim PII redaction, SOC 2, encryption details, or broader compliance posture.
- The CTA label remains `Get my free Deflection Snapshot` so this slice avoids a
  broader CTA naming sweep.
- The smoke marker update is included here because the reviewer correctly
  flagged it as required for the slice to remain monitor-safe.

## Deferred

- #246, #247, and the remaining #250 copy/accessibility cleanup should be a
  follow-up copy-polish slice once this first-screen reframe lands.
- #245 shared rendering between the marketing preview and real results page
  remains a later structural slice.
- PII stripping before upload remains a buyer-side recommendation in intake
  copy; this slice only surfaces current private-upload handling before the
  upload decision.
- Parked hardening: none.

## Verification

- `rg -n "Get the free Snapshot that shows which support tickets to deflect first|estimates the Support Tax|CSV upload\\. No help-desk integration" web/src/components/landing/DeflectionSnapshotLandingPage.tsx -S` -
  passed; no matches, so the old artifact-led H1, first-screen Support Tax
  phrase, and low-emphasis CSV reassurance are absent from runtime source.
- `rg -n "Find the repeat support questions costing your team time|Private CSV upload|No model training or sharing|Deleted after 30 days|No help-desk integration" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Hero-Trust-Reframe.md -S` -
  passed.
- `rg -n "Free ticket analysis|Find the repeat support questions costing your team time|Free Deflection Snapshot|Get the free Snapshot that shows which support tickets to deflect first" web/scripts/smoke-deflection-snapshot-landing.mjs web/scripts/test-deflection-snapshot-landing-smoke.mjs web/plans/PR-Deflection-Snapshot-Hero-Trust-Reframe.md -S` -
  passed after the review fix; the visible smoke marker and mocked fixture use
  the new badge/H1, while the old strings only remain in this plan's
  verification commands.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3114` -
  passed after the review fix.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser spot-check of `/systems/support-ticket-deflection/snapshot` desktop
  1440x1100 and mobile 390x844 at `127.0.0.1:3113` - passed; hero copy and
  trust block render before the upload decision, old hero wording is absent, no
  framework error overlay appears, and mobile has no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~85 |
| Hero copy and trust block | ~75 |
| Smoke marker sync | ~4 |
| Total | ~170 |
