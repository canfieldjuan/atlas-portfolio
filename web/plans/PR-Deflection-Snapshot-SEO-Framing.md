## Why this slice exists

Issue #271 asks for the Snapshot landing page to name the customer wording list
as bonus long-tail SEO value after the primary support-deflection pain has
already been established. The copy should make the SEO benefit explicit without
turning the Snapshot card itself into an SEO-first pitch or making ranking
guarantees.

## Scope (this PR)

Slice phase: Product polish

1. Add long-tail SEO framing to the Snapshot preview bullet and the customer
   wording target-list subsection.
2. Extend the Snapshot disclaimer so SEO outcomes are not implied as ranking
   guarantees.
3. Keep the Snapshot card eyebrow text `Customer wording found` unchanged.
4. Add focused source-level assertions to the existing enrolled Snapshot landing
   smoke test.

### Files touched

- `web/plans/PR-Deflection-Snapshot-SEO-Framing.md` - plan for this slice.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - targeted
  Snapshot landing copy updates.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - focused copy
  contract assertions for the SEO framing and eyebrow guard.

## Mechanism

The Snapshot card keeps the discovery-first eyebrow `Customer wording found`.
The sidebar bullet names customer wording as the long-tail SEO target list
inside a parenthetical, and the later customer-wording card names the bonus SEO
value directly after the artifact has already established ranked repeats, cost,
and one sourced answer.

The disclaimer adds the no-ranking-guarantee boundary alongside the existing
closed-ticket-data and ranking-signal language.

The existing `test:deflection-snapshot-landing-smoke` script is already enrolled
in CI. This slice extends it with direct source assertions for the new copy, the
unchanged eyebrow, and removal of the old weaker target-list line.

## Intentional

- No new section, layout, or component is added. #271 is a copy-framing slice,
  not a redesign.
- The heading uses `&rarr;` in JSX so the rendered copy shows an arrow while the
  source file stays ASCII-only.
- Public SEO is framed as a byproduct of support deflection. The hero and
  Snapshot card remain support-cost/discovery first.

## Deferred

- Broader landing-page SEO strategy, metadata, and keyword research are not
  included.
- No claims are added about search ranking, traffic lift, or guaranteed
  deflection.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS;
  printed `Deflection Snapshot landing smoke tests passed.`
- `npm --prefix web run lint -- src/components/landing/DeflectionSnapshotLandingPage.tsx scripts/test-deflection-snapshot-landing-smoke.mjs`
  - PASS; no ESLint diagnostics.
- `npm --prefix web run build` - PASS; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `rg -n "Customer wording found|long-tail SEO target list|SEO outcomes|Customer wording can become the target list|Customer wording found" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/test-deflection-snapshot-landing-smoke.mjs`
  - PASS; output showed the unchanged `Customer wording found` eyebrow, the new
  long-tail SEO copy, the no-ranking-guarantee copy, and the old target-list
  string only in the negative test assertion.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +85 |
| Snapshot landing copy | +10 / -7 |
| Focused smoke assertions | +33 / -0 |
| Total | ~135 changed |
