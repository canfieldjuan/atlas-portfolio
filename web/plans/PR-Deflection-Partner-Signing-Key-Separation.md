## Why this slice exists

PR-Deflection-Partner-Signed-Token added expiring HMAC `partnerToken` links for
the $1,000 partner checkout path, but it intentionally reused
`DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` as both the direct raw-token allowlist and
the HMAC key ring. That kept the slice small, but it leaves a trust-boundary
footgun: a signing secret also works forever as a raw bearer token if someone
pastes it into `partnerToken=<secret>`.

This production-hardening slice separates the two credentials. Direct partner
bearer tokens stay on `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN`; signed expiring
tokens are minted and verified with a dedicated signing-secret env. The partner
price path still fails closed when no valid direct or signed token is present.

## Scope (this PR)

Slice phase: Production hardening

1. Add a dedicated comma-separated signing-secret env for HMAC partner tokens:
   `DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS`.
2. Keep direct raw bearer-token verification scoped to
   `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN`.
3. Verify signed `partner_v1...` tokens against signing secrets when configured,
   with legacy fallback to the direct-token list only when no signing env exists
   so already-minted #244 links do not break abruptly.
4. Change the token-minting CLI to sign from
   `DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS`, not the direct-token allowlist.
5. Update checkout env preflight so the partner variant is considered configured
   when either a direct token or signing secret exists.
6. Make the shared token verifier fail closed when callers omit an explicit
   signing-secret ring.
7. Enroll the partner access regression test in the pre-push audit workflow.
8. Update README/runbook docs to tell operators to provision direct tokens and
   signing secrets separately.
9. Add focused regression tests proving the signing secret is not accepted as a
   raw bearer, signed-token rotation/removal behavior, CLI signing source, and
   preflight acceptance/missing cases.

### Files touched

- `web/plans/PR-Deflection-Partner-Signing-Key-Separation.md` -- plan contract.
- `.github/workflows/pre_push_audit.yml` -- CI enrollment for the partner
  access trust-boundary test.
- `web/src/lib/deflection-partner-token.js` -- token parsing, signing-secret env
  helper, and separated direct/signed verification.
- `web/src/lib/deflection-partner-access.ts` -- runtime access helper wiring for
  direct-token and signing-secret envs.
- `web/src/lib/deflection-checkout-requirements.js` -- checkout preflight env
  classification for partner credentials.
- `web/scripts/create-deflection-partner-token.mjs` -- CLI signing source and
  missing-env message.
- `web/scripts/check-deflection-checkout-env.mjs` -- operator usage text.
- `web/scripts/test-deflection-partner-access.mjs` -- partner access and CLI
  trust-boundary regression tests.
- `web/scripts/test-deflection-checkout-env.mjs` -- preflight credential
  regression tests.
- `web/README.md` -- production env/docs update.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` --
  go-live runbook update.

## Mechanism

`deflection-partner-token.js` remains the CommonJS boundary shared by runtime and
Node scripts. It will expose a new
`DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS_ENV` constant and
`configuredDeflectionPartnerSigningSecrets(env)` parser. The verifier keeps the
existing two-leg shape:

```js
directTokenMatches(candidate, directTokens) ||
  signedTokenMatches(candidate, signingSecrets, options)
```

The important change is that `directTokens` and `signingSecrets` are no longer
the same list once the signing env is configured. A raw signing secret does not
match the direct-token leg, and it is not a `partner_v1...` token, so it fails.

For compatibility, runtime verification uses the direct-token list as the signed
key ring only when the signing-secret env is empty. That keeps any #244-style
tokens alive until operators add the new env. The CLI does not use that fallback:
new signed tokens are minted only from `DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS`
so future outreach moves onto the separated trust model.

The compatibility fallback lives in `deflection-partner-access.ts`, not the
shared token verifier. The shared verifier defaults omitted `signingSecrets` to
an empty ring so direct calls cannot accidentally recreate the raw-bearer/HMAC
dual-use boundary.

Checkout preflight reports both envs in `keyModes` and requires partner
credentials as "direct token or signing secret" when the partner Price ID is
configured for production.

## Intentional

- No Stripe Checkout API changes. This slice only changes partner-link
  credential handling before checkout; it does not touch session creation,
  amount validation, webhooks, or `payment_method_types`.
- Legacy signed-token verification fallback is runtime-only. The CLI requires
  the new signing env so operators cannot keep minting expiring links from the
  raw bearer allowlist.
- The shared token verifier fails closed by default. Runtime code passes an
  explicit fallback ring only for legacy signed-link compatibility.
- Direct raw partner tokens remain supported for old outreach links, but they
  are no longer required when signed-token access is configured.
- The signing env is comma-separated for rotation, matching the existing direct
  token parser and keeping key order `old,current` for the CLI's active last
  entry.

## Deferred

- Active-key naming instead of positional `old,current` order remains deferred;
  this slice removes the raw-bearer/signing-secret dual-use first.
- Automated Vercel env migration is deferred; operators still set env values
  outside the repo.
- Parked hardening: none.

## Verification

- Command: npm --prefix web run test:deflection-partner-access -- PASS;
  `Deflection partner access tests passed.` This test is now enrolled in
  `.github/workflows/pre_push_audit.yml`.
- Command: npm --prefix web run test:deflection-checkout-env -- PASS;
  `Deflection checkout env tests passed.`
- Command: npm --prefix web run test:deflection-checkout -- PASS;
  `Deflection checkout tests passed.`
- Command: npm --prefix web run lint -- src/lib/deflection-partner-access.ts
  src/lib/deflection-checkout-requirements.js
  src/lib/deflection-partner-token.js
  scripts/create-deflection-partner-token.mjs
  scripts/check-deflection-checkout-env.mjs
  scripts/test-deflection-partner-access.mjs
  scripts/test-deflection-checkout-env.mjs -- PASS.
- Command: if rg -n 'last/current `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN`|signs
  with the last token|configure at least one rotation secret' web/src
  web/scripts web/README.md
  web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md; then
  echo 'stale direct-signing wording found' >&2; exit 1; else echo 'no stale
  direct-signing wording found'; fi -- PASS; no stale direct-signing wording
  found.
- Command: git diff --check -- PASS.
- Command: bash scripts/local_pr_review.sh -- PASS.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~130 |
| Token/access/preflight/CLI | ~90 |
| Tests | ~125 |
| CI workflow | ~5 |
| Docs | ~35 |
| Total | ~385 |
