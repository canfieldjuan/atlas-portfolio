## Why this slice exists

Issue #194's explicit partner-price path is now wired, and the go-live runbook
has standard/partner Checkout-start smokes. The remaining operational weakness
in that path is token rotation: `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` accepts
one static value, so rotating the token invalidates any already-sent partner
links immediately.

This slice lets the environment carry a comma-separated list of valid partner
tokens. Operators can deploy `old,new`, send new links with `new`, then remove
`old` after the outreach window closes.

## Scope (this PR)

Slice phase: Production hardening

1. Accept comma-separated `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` values in the
   partner-price access helper.
2. Preserve existing single-token behavior and whitespace trimming.
3. Keep missing/invalid tokens fail-closed to the standard price.
4. Update partner-checkout docs to describe the rotation pattern.
5. Extend the focused partner-access test for old/current/next token lists and
   blank-list rejection.
6. Align the checkout env preflight with the runtime parser so comma-only env
   values fail as missing before deploy.

### Files touched

- `web/plans/PR-Deflection-Partner-Token-Rotation.md`
- `web/src/lib/deflection-partner-access.ts`
- `web/src/lib/deflection-checkout-requirements.js`
- `web/scripts/test-deflection-partner-access.mjs`
- `web/scripts/test-deflection-checkout-env.mjs`
- `web/README.md`
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md`

## Mechanism

`configuredDeflectionPartnerAccessTokens(env)` lives in the shared checkout
requirements module and parses the configured env into trimmed non-empty
tokens:

```text
DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN=old-token,current-token,next-token
```

`hasDeflectionPartnerPriceAccessToken(value)` trims the candidate and checks it
against every parsed token, returning true only when one matches. The checkout
env preflight uses the same parser and treats an empty parsed token list as
missing, so `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN=,` fails before deploy.
`resolveIntakePriceVariantId` remains unchanged, so the server continues to
persist `partner` only when the submitted token is valid.

## Intentional

- No signed-token format is introduced in this PR. This is rotation support for
  the existing static-token gate; per-partner signed links remain a broader #194
  follow-up.
- No client-side trust change. The partner page may include whichever valid
  token was used in the URL; the intake and record routes still re-check the
  token server-side before persisting the partner variant.
- No runtime client trust change. The production preflight now rejects
  comma-only partner-token envs because those have no usable server-side token.

## Deferred

- Per-partner signed token generation/expiration remains #194.
- Live partner Checkout-start and unlock verification remains an operator run
  using the documented standard/partner smoke commands.

Parked hardening: none.

## Verification

- `npm --prefix web ci` -> pass; installed 378 packages, audited 379 packages,
  reported the existing npm audit state: 3 vulnerabilities (2 moderate, 1 high).
- `npm --prefix web run test:deflection-partner-access` -> pass;
  `Deflection partner access tests passed.`
- `npm --prefix web run test:deflection-checkout-env` -> pass;
  `Deflection checkout env tests passed.`
- `npm --prefix web run lint -- src/lib/deflection-partner-access.ts
  src/lib/deflection-checkout-requirements.js
  scripts/test-deflection-partner-access.mjs
  scripts/test-deflection-checkout-env.mjs` -> pass.
- `rg -n "comma-separated rotation|old-token,current-token|one token in|rotation list|old-partner-token|next-partner-token|configuredDeflectionPartnerAccessTokens|PARTNER_ACCESS_TOKEN_ENV\\]: ' , ,, '" web/src/lib/deflection-partner-access.ts web/src/lib/deflection-checkout-requirements.js web/scripts/test-deflection-partner-access.mjs web/scripts/test-deflection-checkout-env.mjs web/README.md web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -> pass; matched implementation, tests, and docs.
- `bash scripts/local_pr_review.sh` -> pass after local dependencies were
  installed; plan audits, cross-session drift, full ESLint, Next build, and
  `git diff --check` all passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Partner-Token-Rotation.md` | +101 / -0 |
| `web/src/lib/deflection-partner-access.ts` | +9 / -3 |
| `web/src/lib/deflection-checkout-requirements.js` | +13 / -5 |
| `web/scripts/test-deflection-partner-access.mjs` | +25 / -0 |
| `web/scripts/test-deflection-checkout-env.mjs` | +20 / -0 |
| `web/README.md` | +7 / -5 |
| `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` | +4 / -3 |
| Total | 195 changed (+179 / -16 across 7 files) |
