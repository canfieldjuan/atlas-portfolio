## Why this slice exists

Issue #194 remains open after partner-price selection and token rotation. Raw
long-lived partner tokens still appear in URLs; ATLAS already has the exact
allowed-amount gate, so this slice adds signed expiring `partnerToken` values.

## Scope (this PR)

Slice phase: Production hardening

1. Add an HMAC-signed partner token format with expiration.
2. Keep existing direct-token behavior for already-sent partner links.
3. Reject expired, malformed, or tampered signed tokens fail-closed to standard.
4. Add an operator CLI for generating signed partner tokens.
5. Extend focused tests for signed, expired, tampered, malformed, and
   rotated-secret cases.
6. Document the signed-token path while preserving the static-token fallback.

### Files touched

- `web/plans/PR-Deflection-Partner-Signed-Token.md`
- `web/package.json`
- `web/src/lib/deflection-partner-token.js`
- `web/src/lib/deflection-checkout-requirements.js`
- `web/src/lib/deflection-partner-access.ts`
- `web/scripts/create-deflection-partner-token.mjs`
- `web/scripts/test-deflection-checkout.mjs`
- `web/scripts/test-deflection-partner-access.mjs`
- `web/README.md`
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md`

## Mechanism

`deflection-partner-token.js` keeps the #241 comma-list parser and adds
`partner_v1.<payload>.<hmac>` tokens carrying `partner` and `exp`. Runtime keeps
direct-token matches, then checks signed tokens against every configured
rotation entry. The CLI uses the last/current configured entry and prints only the signed token.

## Intentional

- No new env var. The existing token list is both the legacy direct-token list and signing-key rotation list.
- No client trust change. Partner intake and record routes still re-check the
  submitted `partnerToken` server-side before persisting `partner`.
- The shared token module stays CommonJS because Node preflight scripts import the existing checkout requirements module directly.
- No partner management UI or database table; this is an operator CLI and
  runtime verifier slice only.

## Deferred

- Per-partner issuance tracking, revocation lists, and analytics attribution
  remain future #194 work.
- Live partner intake plus Checkout-start verification with a signed token
  remains an operator run after deployment.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-partner-access` -> pass; `Deflection partner access tests passed.`
- `npm --prefix web run test:deflection-checkout-env` -> pass; `Deflection checkout env tests passed.`
- `npm --prefix web run test:deflection-checkout` -> pass; `Deflection checkout tests passed.`
- `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN=old-unit-secret,unit-signing-secret npm --prefix web run create:deflection-partner-token -- --partner acme --ttl-days 7 --no-local-env` -> pass; printed a `partner_v1...` token.
- `npm --prefix web run lint -- src/lib/deflection-partner-access.ts src/lib/deflection-checkout-requirements.js src/lib/deflection-partner-token.js scripts/create-deflection-partner-token.mjs scripts/test-deflection-checkout.mjs scripts/test-deflection-partner-access.mjs` -> pass.
- `rg -n "partner_v1|create:deflection-partner-token|ttl-days|last/current|old-cli-secret" web/src/lib/deflection-partner-access.ts web/src/lib/deflection-checkout-requirements.js web/src/lib/deflection-partner-token.js web/scripts/create-deflection-partner-token.mjs web/scripts/test-deflection-partner-access.mjs web/README.md web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -> pass; matched implementation, CLI, tests, and docs.
- `npm --prefix web ci` -> pass; installed 378 packages, audited 379 packages, reported existing npm audit state: 3 vulnerabilities (2 moderate, 1 high). `bash scripts/local_pr_review.sh` -> pass after install; plan audits, cross-session drift, full ESLint, Next build, and git diff --check passed.

## Estimated diff size
| File | Estimated LOC |
| --- | ---: |
| Total | 399 changed (+364 / -35 across 10 files) |
