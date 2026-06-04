## Why this slice exists

PR-Deflection-Partner-Price-Variant closed the immediate partner-price trust
holes, but review found the same class repeatedly: runtime checkout, production
preflight, and partner persistence each re-derived part of the pricing trust
model. The fixes were real, but point-patching every satellite layer is fragile.

This slice consolidates the Stripe checkout deploy/runtime requirements into one
shared decision module so the next price variant does not need separate edits in
runtime and preflight. The diff exceeds the 400 LOC soft cap because the
preflight's full validator moves into a shared helper while the runtime deletes
its forked parser/config branch. Splitting that move would temporarily leave two
authoritative trust models, which is the exact failure mode this slice closes.

## Scope (this PR)

Slice phase: Production hardening

1. Add one shared checkout-requirements module consumed by both runtime checkout
   and the production preflight.
2. Move env keys, Stripe key-mode classification, Price ID validation, allowed
   amount parsing, and selected-variant runtime config resolution into that
   module.
3. Keep current checkout behavior: production requires a live restricted key,
   non-production may use a test restricted key or test secret fallback, selected
   variant amounts must be allowlisted, and Stripe-returned amounts still must
   exactly match the selected variant.
4. Keep current preflight behavior: production requires account id, live RAK,
   standard/legacy Price ID, partner Price ID, partner access token, and both
   standard/partner allowed amounts.
5. Preserve the partner persistence trust-anchor behavior from #232; this slice
   does not alter intake persistence semantics.

### Files touched

- `web/plans/PR-Deflection-Checkout-Trust-Config-Consolidation.md`
- `web/src/lib/deflection-checkout-requirements.js`
- `web/src/lib/deflection-checkout.ts`
- `web/scripts/check-deflection-checkout-env.mjs`
- `web/scripts/test-deflection-checkout.mjs`

## Mechanism

`deflection-checkout-requirements.js` becomes the shared source for checkout
configuration decisions:

```js
validateDeflectionCheckoutEnv(env, { environment })
resolveDeflectionCheckoutRuntimeConfig(env, priceVariant, { environment })
```

The Node preflight imports `validateDeflectionCheckoutEnv` instead of defining
its own parser/classifier. Runtime checkout imports
`resolveDeflectionCheckoutRuntimeConfig` and logs that helper's bounded reason
when configuration is incomplete. Stripe secrets are never included in messages,
logs, PR output, or JSON artifacts.

The checkout session response gate remains in `deflection-checkout.ts` because
it validates Stripe's returned session, not deploy configuration. The helper
only decides whether the environment can create the intended session for the
selected price variant.

## Intentional

- The shared helper is plain CommonJS `.js`, not `.ts`, so both Next runtime and
  Node scripts can import the same implementation without a build step, loader,
  or package-wide `"type": "module"` change.
- Production still requires `DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN` because the
  partner URL is active once the partner-price PR is merged. This slice does not
  defer that requirement to live smoke.
- Runtime still does not require the partner token for creating checkout. Token
  eligibility is enforced before variant persistence; checkout trusts the saved
  variant.
- No `payment_method_types` is added to Stripe calls, preserving dynamic payment
  methods.

## Deferred

- Signed/per-partner token generation and rotation remains deferred to #194.
- Live standard/partner checkout smoke remains deferred to
  PR-Deflection-Partner-Price-Live-Smoke after production envs are provisioned.
- Parked hardening considered: `HARDENING.md` has resolved intake rate-limit and
  private-CSV items plus unrelated dependency audit findings; none are required
  for this checkout-config consolidation.

Parked hardening: none.

## Verification

- `npm --prefix web ci` -> pass; installed 378 packages, audited 379 packages,
  reported the existing npm audit state: 3 vulnerabilities (2 moderate, 1 high).
- `npm --prefix web run test:deflection-checkout` -> pass;
  `Deflection checkout tests passed.`
- `npm --prefix web run test:deflection-checkout-env` -> pass;
  `Deflection checkout env tests passed.`
- `npm --prefix web run lint -- src/lib/deflection-checkout.ts
  src/lib/deflection-checkout-requirements.js
  scripts/check-deflection-checkout-env.mjs
  scripts/test-deflection-checkout.mjs` -> pass.
- `npm --prefix web run build` -> pass; compiled successfully, TypeScript
  finished, static generation completed `44/44`, and postbuild copied
  `routes-manifest-deterministic.json`.

## Estimated diff size

| File | LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Checkout-Trust-Config-Consolidation.md` | +113 / -0 |
| `web/src/lib/deflection-checkout-requirements.js` | +446 / -0 |
| `web/src/lib/deflection-checkout.ts` | +13 / -102 |
| `web/scripts/check-deflection-checkout-env.mjs` | +12 / -255 |
| `web/scripts/test-deflection-checkout.mjs` | +16 / -0 |
| Total | 957 changed (+600 / -357 across 5 files) |
