# Plan: Deflection paid unlock smoke

## Why this slice exists

The deployed funnel now has live smokes for browser upload, hosted results, and
Checkout Session creation. The remaining go-live proof is the paid trust
boundary: a locked report should enter Checkout, Stripe should deliver the
verified webhook to ATLAS, ATLAS should return the artifact as unlocked, and the
portfolio results page should render the paid report.

This slice adds that smoke contract while preserving the payment safety boundary.
A live probe during planning returned a `cs_live_...` Checkout URL, so the smoke
must fail closed instead of automating or encouraging a real charge.

## Scope (this PR)

Ownership lane: ai-content-ops/support-ticket-deflection  
Slice phase: Functional validation

1. Add a no-secret paid-unlock smoke that checks `/api/deflection-report-status`,
   creates Checkout through `/api/deflection-checkout` when the report is still
   locked, polls for `unlocked`, and fetches the hosted results page.
2. Validate that the paid results page renders full-report markers and does not
   still show the locked snapshot CTA.
3. Fail closed on live-mode Checkout URLs unless the operator explicitly passes
   `--allow-live-checkout`; test-mode Checkout URLs can be used for the
   operator/browser payment leg.
4. Add focused mocked tests for unlocked, locked-to-unlocked, live-mode refusal,
   timeout, invalid input, and paid-render marker failures.
5. Enroll the focused test in package scripts and pre-push audit CI.

### Files touched

- `web/plans/PR-Deflection-Paid-Unlock-Smoke.md` - this plan doc.
- `web/scripts/smoke-deflection-paid-unlock.mjs` - hosted paid-unlock smoke.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - mocked smoke tests.
- `web/package.json` - smoke/test scripts.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the mocked test.

## Mechanism

The command is intentionally hosted-only and no-secret:

```bash
npm --prefix web run smoke:deflection-paid-unlock -- \
  --request-id content-ops-... \
  --base-url https://juancanfield.com
```

The smoke first calls:

```text
GET /api/deflection-report-status?requestId=...
```

If status is already `unlocked`, it fetches the results page and verifies paid
markers. If status is `locked`, it calls:

```text
POST /api/deflection-checkout
```

The returned Checkout URL is classified from the Session id in the URL path:
`cs_test_...` is allowed for a test-mode payment; `cs_live_...` fails closed
unless `--allow-live-checkout` is passed. After Checkout is completed by the
operator/browser, the script polls report status until it sees `unlocked`, then
fetches the results page and verifies:

- `FULL DEFLECTION REPORT`
- `Your paid report is ready to review.`
- `Report summary`
- `Drill-down cards`

It also rejects the unpaid CTA marker `Unlock your full Backlog Report`.

## Intentional

- The smoke does not use a Stripe secret key, fake a webhook, or call the
  privileged ATLAS `/paid` operator path. The verified Stripe webhook remains
  the only customer unlock path.
- Live Checkout mode is not treated as a pass because the go-live validation
  needs a test-mode payment, not a real $1,500 charge.
- The script can wait for an operator/browser-completed Checkout, but the mocked
  CI test never calls Stripe, ATLAS, or Vercel.

## Deferred

- Fully browser-automating Stripe-hosted Checkout is deferred. The first useful
  contract is a no-secret smoke that refuses live charges, waits for test-mode
  webhook unlock, and proves the paid render once unlocked.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed.
- `npm --prefix web run smoke:deflection-paid-unlock -- --request-id content-ops-e50579a505b6470c99f86f04a5184f69 --json --output /tmp/deflection-paid-unlock-smoke.json` - failed closed as expected because the deployed route returned a live-mode `cs_live_...` Checkout URL.
- `npm --prefix web run lint` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~113 |
| Smoke script | ~362 |
| Focused tests | ~219 |
| Package/CI enrollment | ~4 |
| **Total** | ~699 |

This is over the 400-LOC soft cap because the slice needs payment-mode safety,
polling, render-marker validation, and negative branch coverage in the same PR
that introduces the live paid-unlock command.
