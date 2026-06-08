# Plan: Admin intake token export trim

## Why this slice exists

Issue #198 is draining the Knip baseline from #278 in focused, verified slices.
After #279, the baseline still lists `adminIntakeToken` in
`web/src/lib/admin-intake-auth.ts` as an unused export. Reference checks show
the helper is only called inside its own module by the public admin-intake auth
helpers, so the exported surface is unnecessary.

This trims one baseline finding without changing the admin-intake cookie or
token validation behavior.

## Scope (this PR)

Slice phase: Workflow/process

1. Convert `adminIntakeToken()` from an exported function to a local module
   helper.
2. Remove the matching `exports` finding from `web/knip-baseline.json`.
3. Verify the helper remains local-only and the Knip baseline drops to 20 known
   findings.

### Files touched

- `web/plans/PR-Admin-Intake-Token-Export-Trim.md` - this plan doc.
- `web/src/lib/admin-intake-auth.ts` - localize the admin token helper.
- `web/knip-baseline.json` - remove the resolved unused-export finding.

## Mechanism

The function body stays unchanged:

```ts
function adminIntakeToken() {
  return process.env.ADMIN_INTAKE_TOKEN?.trim() || '';
}
```

Only the `export` keyword is removed. The public auth API remains
`ADMIN_INTAKE_COOKIE`, `adminIntakeConfigured`, `verifyAdminIntakeToken`,
`adminIntakeCookieValue`, and `verifyAdminIntakeCookie`.

## Intentional

- This does not change token comparison, cookie hashing, cookie verification, or
  environment variable naming.
- This does not trim unrelated Knip findings. Each baseline reduction gets its
  own reference proof.

## Deferred

- Continue draining remaining Knip baseline findings in focused slices.
- Final legacy Blob token removal remains gated on legacy-store rows aging out.
- Legacy Stripe `sk_test_` fallback cleanup remains gated on Preview/test mode
  using an `rk_test_` restricted key.

Parked hardening: none.

## Verification

- `rg -n "adminIntakeToken" web/src web/scripts web/knip-baseline.json -S` -
  passed; the helper remains only as a local function plus same-file callers,
  with no baseline entry.
- `npm --prefix web run check:dead-code` - passed; Knip baseline now matches 20
  known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~70 |
| Auth helper export trim | ~1 |
| Knip baseline update | ~5 |
| Total | ~76 |
