# Plan: Close Resolution Audit review residue

PR #356 aligned the non-partner Resolution Audit entry CTAs, but post-merge
review found a few residue points: partner FAQ copy still inherited the public
Resolution Audit FAQ, the public quarterly refresh note still said "full
report," and the playbook CTA promised a review-ready answer without the
resolution-evidence caveat used elsewhere.

## Why this slice exists

- The partner page should remain partner-scoped until the partner offer is
  intentionally renamed.
- Shared public FAQ items now use Resolution Audit language, so the partner page
  needs its own FAQ item override just like it already has pricing tier overrides.
- Public pricing and playbook copy should stay internally consistent with the
  Resolution Audit naming and the no-proven-answer truth boundary.

## Scope (this PR)

Slice phase: Product polish

1. Add a partner FAQ override in `PartnerDeflectionLandingClient` so the partner
   funnel keeps its Deflection Snapshot / Deflection Report wording.
2. Update the public quarterly refresh tier note from "full report" to "full
   audit."
3. Qualify the playbook CTA promise so the review-ready answer appears only when
   the ticket history contains resolution evidence.
4. Extend the public reachability smoke source guard to pin the partner FAQ
   override and the corrected public copy.

### Files touched

- `web/plans/PR-Resolution-Audit-Review-Residue.md` - this plan contract.
- `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` - partner FAQ override.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` - public quarterly refresh note.
- `web/src/app/systems/support-ticket-deflection/playbook/page.tsx` - playbook CTA caveat.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - source-level guards for the review residue fixes.

## Mechanism

- The partner client keeps spreading `landingPageConfigV2`, but now overrides
  `faq.items` with partner-scoped FAQ labels and answers, mirroring the existing
  partner pricing tier override.
- The public quarterly refresh note uses "full audit" to match the public Full
  Resolution Audit tier name.
- The playbook CTA uses the same evidence-conditioned answer language as the
  pricing tier copy.
- The smoke test reads the touched files directly and asserts both the public
  fixes and partner override are present.

## Intentional

- This is not a partner rename. It preserves partner wording until a dedicated
  partner pass.
- Email/PDF, result-page, generated artifact, and security-page copy remain out
  of scope.
- The answer promise remains conditional on resolution evidence, avoiding a draft
  guarantee for uploads that only produce no-proven-answer gaps.

## Deferred

- Full partner reframe remains deferred to a partner-specific pass.
- Email/PDF artifact and result-page copy remain deferred to the generated
  artifact/report naming lane.
- PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run build` - passed.
- `rg -n "full report proves|one review-ready answer\\.|What do I get in the full Resolution Audit\\?|What do I get in the full Deflection Report\\?|partnerPricingFaqs|resolution evidence" web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx web/src/app/systems/support-ticket-deflection/landingConfig.tsx web/src/app/systems/support-ticket-deflection/playbook/page.tsx web/scripts/test-deflection-public-reachability-smoke.mjs`
  - passed; partner FAQ override is present, the public refresh note no longer says `full report proves`, and the playbook answer promise is evidence-conditioned.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Partner FAQ override | ~30 |
| Public copy residue | ~4 |
| Public reachability smoke guards | ~8 |
| this plan doc | ~78 |
| **Total** | ~120 |
