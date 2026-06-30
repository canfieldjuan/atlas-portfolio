# Deflection Snapshot Metric Card Alignment

## Why this slice exists

The Snapshot landing page showed two different metric-card vocabularies for the
same example data. The hero proof strip used `Estimated Support Tax`, `Repeat
Contacts`, and `Draft + Gap`, while the lower Snapshot artifact used
`Repeat-ticket hits`, `Support Tax estimate`, `Included draft`, and sometimes an
extra `Remaining backlog` card.

Root cause: the hero proof strip and lower artifact metric row are separate
arrays, so the lower row drifted after the hero copy was tightened.

## Scope (this PR)

Slice phase: Visual consistency

1. Align the lower Snapshot artifact metric row with the hero proof strip.
2. Keep the same three labels, order, values, and explanatory copy.
3. Add a small support-deflection header trust strip with scoped, code-backed
   claims.
4. Add smoke-test guards against the old metric labels, the extra fourth card,
   and unproven header security claims.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Metric-Card-Alignment.md` - slice contract.
- `web/src/app/systems/support-ticket-deflection/layout.tsx` - add the header trust strip.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - align lower Snapshot metric cards.
- `web/src/lib/deflection-snapshot-landing-smoke.test.ts` - guard metric-card label/order drift.

## Mechanism

`SnapshotArtifact` now derives the same three metric cards as `HeroProofStrip`:

1. `Estimated Support Tax`
2. `Repeat Contacts`
3. `Draft + Gap`

The lower artifact row no longer appends `Remaining backlog`; the backlog
preview remains available in the locked-question section below the metric row.

The support-ticket-deflection layout adds a small top strip with a scoped trust
message: `ZERO Generative AI Models - Private encrypted storage + browser and
backend PII controls`.

## Intentional

- No intake, pricing, checkout, or ATLAS contract changes.
- No copy change to the hero H1, intake copy, or proof sections.
- No `AES-256` or `VPC isolated` header copy. Those are intentionally excluded
  until there is a repo-owned proof path for them.
- The lower row now matches the hero row rather than introducing a shared helper;
  the diff stays narrow and avoids refactoring the landing page during a visual
  polish slice.

## Deferred

- A future cleanup can extract a shared metric builder if these cards drift
  again or gain more variants.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - 4 passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Snapshot-Metric-Card-Alignment.md` | ~58 |
| `web/src/app/systems/support-ticket-deflection/layout.tsx` | ~8 |
| `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` | ~16 / -24 |
| `web/src/lib/deflection-snapshot-landing-smoke.test.ts` | ~16 / -1 |
| Total | ~123 |
