# PR-Security-Disclosure-Baseline

## Why this slice exists

Issue #313 tracks the portfolio security baseline. The next unblocked,
no-cost item is the disclosure surface: the repo has no root `SECURITY.md`,
no public `/.well-known/security.txt`, and the `/security` page has buyer
trust copy but no direct vulnerability-reporting instructions.

That means a researcher or buyer who finds a vulnerability has no clear
private reporting path. The absence is small but real security/process debt,
especially because this repo handles Stripe checkout and uploaded customer CSV
flows.

## Scope (this PR)

Slice phase: Production hardening

1. Add a root `SECURITY.md` with supported scope, private reporting guidance,
   and safe-reporting expectations.
2. Add `web/public/.well-known/security.txt` so the deployed site exposes a
   standard machine-readable disclosure pointer.
3. Add a "Report a vulnerability" section to `/security` that points to the
   same private contact and avoids public-issue disclosure.

### Files touched

- `web/plans/PR-Security-Disclosure-Baseline.md` - this plan.
- `SECURITY.md` - repository disclosure policy.
- `web/public/.well-known/security.txt` - public security.txt metadata.
- `web/src/app/security/page.tsx` - buyer-facing vulnerability disclosure section.

## Mechanism

The root policy keeps the supported surface broad enough for this public repo:
the public website, serverless API routes, Stripe checkout/unlock surfaces,
admin intake surfaces, and customer CSV upload/report flows. It routes reports
to the existing published contact `juan@juancanfield.com`, asks reporters to
avoid public issues and sensitive data, and states that no paid bounty or fixed
response SLA is offered.

`security.txt` lives under `web/public/.well-known/`, which Next serves as
`/.well-known/security.txt` after deployment. It points both `Contact` and
`Policy` at stable public surfaces and uses the same email contact.

The `/security` page gets a disclosure section near the existing data-safety
content so buyers and researchers can find it without reading the repo.

## Intentional

- No new paid service, hosted Sentry, bounty platform, or managed disclosure
  tool. #313 explicitly requires free / already-owned infrastructure.
- No claim of SOC 2, bug bounty, response SLA, or complete security program.
- No attempt to port the full security CI suite here; that is a separate #313
  item with larger workflow blast radius.
- No new form endpoint. Email is enough for this baseline slice and avoids
  creating another unauthenticated intake surface.

## Deferred

- Security CI: gitleaks, dependency audit, SAST, Dependabot, and action
  pinning remain separate #313 work.
- Admin hardening, immutable access ledger, brute-force controls, and
  end-to-end deletion remain separate #313 / ATLAS#1656 work.
- A dedicated `security@juancanfield.com` alias can replace the current contact
  later if that mailbox is provisioned and monitored.

Parked hardening: none

## Verification

- `test -f SECURITY.md && test -f web/public/.well-known/security.txt` - passed.
- `rg -n "Report a Vulnerability|Report a vulnerability|juan@juancanfield.com|/.well-known/security.txt" SECURITY.md web/public/.well-known/security.txt web/src/app/security/page.tsx` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Security-Disclosure-Baseline.md` | ~95 |
| `SECURITY.md` | ~50 |
| `web/public/.well-known/security.txt` | ~5 |
| `web/src/app/security/page.tsx` | ~45 |
| Total | ~195 |

Under the 400 LOC soft cap.
