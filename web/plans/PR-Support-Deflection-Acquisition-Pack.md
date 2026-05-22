# PR-Support-Deflection-Acquisition-Pack

## Why this slice exists

PR-Support-Deflection-First-Analysis-Motion decided that the first-five-customer motion is 10 free Deflection Snapshots. The framework now has the operating contract, but the actual acquisition assets still live as an older draft in `voice-reference.md` and use stale FAQ/help-doc language.

This slice adds the first usable outbound and follow-up pack so the Support Ticket Deflection page can be tested without inventing copy ad hoc each time.

## Scope (this PR)

1. Add a support-deflection acquisition pack with target list rules, LinkedIn/email outreach, qualification reply, CSV handoff, snapshot delivery, paid follow-up, and proof-permission copy.
2. Update the voice reference cold DM example to match the current Deflection Snapshot offer.
3. Link the first-analysis playbook to the acquisition pack.
4. Preserve app routes, intake behavior, pricing, and report claims.

### Files touched

- `docs/landing-page-framework/support-deflection-acquisition-pack.md`
- `docs/landing-page-framework/support-deflection-first-analysis.md`
- `docs/landing-page-framework/voice-reference.md`
- `plans/PR-Support-Deflection-Acquisition-Pack.md`

## Mechanism

The acquisition pack turns D-019 into copy assets and guardrails. It separates channel language from page language: outbound can say "send me a CSV" because the prospect may not be on the site yet; page CTAs can keep "upload your CSV."

The pack uses only current safe claims: ranked repeat-ticket patterns, customer wording, one self-service answer, and a concrete action path. It does not claim guaranteed deflection, cost reduction, ranking outcomes, or fully automated delivery.

## Intentional

- No app code changes. The merged intake route already handles the upload path.
- No CRM or tracking implementation yet.
- No guaranteed deflection percentage or ROI math.
- No new wedge page in this slice.

## Deferred

- A later PR can add CRM fields or a lightweight tracker for the 10 free snapshots.
- A later PR can create a rendered snapshot template once the first manual examples settle.
- A later PR can build the next product landing page once its wedge contract is selected.

## Verification

Completed:

- `git diff --check`
- Markdown/content review for claim boundaries, route links, and consistency with the first-analysis playbook.

## Estimated diff size

4 files, +316 / -6. Under the 400-line soft cap; the size is mostly reusable outbound and follow-up copy.
