## Why this slice exists

Issue #420 tracks the remaining Resolution Audit naming residue after the
cross-repo rename. The ATLAS deliverable title half is already closed in
`canfieldjuan/ATLAS#1882`, leaving the atlas-portfolio public/default strings
from #421.

This slice removes only the public/default copy residue while preserving the
partner exception and internal deflection identifiers.

## Scope (this PR)

Slice phase: Product polish

1. Rename the public `/security` CSV safety heading from Deflection Report to
   Resolution Audit.
2. Rename public/default gap-report record-route failure copy from Deflection
   report generation to Resolution Audit generation.
3. Rename the Snapshot sample `aria-label` from Representative Deflection
   Snapshot to Representative Resolution Snapshot.
4. Update tests that assert the changed customer-visible route failures.

### Files touched

- `web/plans/PR-Resolution-Audit-Public-String-Residue.md` - plan for this slice.
- `web/src/app/security/page.tsx` - public CSV safety heading.
- `web/src/app/api/gap-report-intake/record/route.ts` - public/default upload failure copy.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - Snapshot sample accessibility label.
- `web/src/lib/deflection-browser-upload-smoke.test.mjs` - updated route failure assertion.
- `web/src/lib/deflection-partner-access.test.ts` - updated route failure assertions.

## Mechanism

The change is a literal copy sweep over the three public/default strings named
in #421. The route failure messages keep the same HTTP statuses, reason values,
and fallback behavior; only the customer-visible noun changes.

Partner copy remains deliberately unchanged. The partner route metadata, the
`isPartner ? 'Deflection Report' : 'Resolution Audit'` branches, and
`SUPPORT_DEFLECTION_PARTNER_OFFER_COPY` retain the old naming because those are
the design-partner exception called out in #420.

## Intentional

- No internal identifiers, route names, component names, env names, Stripe keys,
  or contract fields are renamed.
- The system/category name Support Ticket Deflection is not changed.
- ATLAS artifact naming is not touched here because ATLAS#1882 is already closed.

## Deferred

- Any future partner funnel rename remains outside this public/default cleanup.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-browser-upload-smoke` - passed; 10 tests.
- `npm --prefix web run test:deflection-partner-access` - passed; 10 tests.
- `npm --prefix web run test:deflection-public-reachability-smoke` - passed; 18 tests.
- `rg -n "Deflection Report CSV Data Safety|Deflection report generation|Representative Deflection Snapshot" web/src web/scripts --glob '!*.map'` - passed; no matches.
- `rg -n "isPartner \\? 'Deflection Report' : 'Resolution Audit'|SUPPORT_DEFLECTION_PARTNER_OFFER_COPY|Support Ticket Deflection Report" web/src/app web/src/components web/src/lib/gap-report-intake.ts web/src/lib/*test*` - passed; remaining hits are partner exceptions or tests preserving those exceptions.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~72 |
| Public copy | ~6 |
| Test assertions | ~6 |
| Total | ~84 |
