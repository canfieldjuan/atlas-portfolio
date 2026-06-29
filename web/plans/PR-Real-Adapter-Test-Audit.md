## Why this slice exists

The real-adapter migration removed the old deflection smoke harness stubs, but
nothing prevents the same fake-local-module pattern from coming back in a later
test. Issue #415 asks for a CI guard that blocks tests which fabricate or mock
modules that already exist under `web/src`.

This slice also removes the one current local-module mock from the rate-limit
tests so the new guard can run cleanly on the existing tree.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a real-adapter test audit that scans migrated test files and `web/scripts`
   harnesses for local `@/` module mocks, fabricated `node_modules/@/` stubs,
   and `ts.transpileModule(`.
2. Add fixture tests proving the audit fails on fabricated local modules and
   TypeScript transpile shims, passes on external mocks, and reports explicit
   allowlist markers.
3. Enroll the audit in CI and local review so future fake-local-module tests are
   visible before merge.
4. Update the audit route rate-limit test to exercise the real audit-intake
   file fallback instead of mocking `@/lib/audit-intake`.

### Files touched

- `.github/workflows/pre_push_audit.yml` - enrolls the audit and audit tests in CI.
- `scripts/local_pr_review.sh` - runs the real-adapter audit locally with the review bundle.
- `web/package.json` - adds the audit and fixture-test npm scripts.
- `web/plans/PR-Real-Adapter-Test-Audit.md` - plan for this slice.
- `web/scripts/audit-real-adapter-tests.mjs` - scans tests for local-module stubs and transpile shims.
- `web/scripts/test-real-adapter-test-audit.mjs` - fixture tests for the new audit.
- `web/src/lib/deflection-rate-limit.test.ts` - removes the local intake mock and uses real fallback output.

## Mechanism

`audit-real-adapter-tests.mjs` walks `web/scripts/*.mjs` and `web/src/**/*.test.*`
files. It resolves `@/foo` specifiers against `web/src/foo` with the normal TS/JS
extensions and `index.*` fallbacks. A local mock such as `vi.mock('@/lib/foo')`
fails when that specifier points at a real source file. A fabricated
`node_modules/@/lib/foo.js` stub also fails if it maps back to a real source
module. Any `ts.transpileModule(` use in scanned test files fails because it
lets a test reshape source code instead of exercising the real module adapter.

Rare exceptions require an inline or previous-line `real-adapter-audit-allow:
<reason>` marker. Allowlisted findings are printed so the exception stays
visible instead of silently disappearing.

The existing rate-limit route test now points audit intake at a per-test temp
NDJSON fallback file and clears the network/database/email delivery env vars.
That keeps the test deterministic while still exercising the actual route and
intake modules.

## Intentional

- External SDK mocks remain allowed. A mock such as `vi.mock('@vercel/blob')`
  does not resolve under `web/src`, so the audit does not block it.
- The allowlist marker exists for rare cases, but this slice does not add any
  allowlisted production tests.
- The audit is intentionally regex-and-path based rather than a full TS AST
  parser; the blocked patterns are narrow and testable.

## Deferred

- Blocking every possible alias fabrication shape is deferred; this slice covers
  the known `@/` mock and `node_modules/@/` stub shapes that created the issue.
- Broader adapter conversions outside the already-migrated smoke tests remain in
  the real-adapter epic.

Parked hardening: none.

## Verification

- `npm --prefix web run check:real-adapter-tests` - passed; scanned 74 files.
- `npm --prefix web run test:real-adapter-test-audit` - passed; fixture tests cover clean external mocks, local mocks, transpile shims, fabricated `node_modules/@/` stubs, and allowlist reporting.
- `npm --prefix web run test:deflection-rate-limit` - passed; 7 tests.
- `node web/scripts/audit-test-enrollment.mjs` - passed; all 40 `test:*` scripts are enrolled.
- `npm --prefix web run lint` - passed.
- `rg -n "vi\\.mock\\('@/|vi\\.mock\\(\\\"@/|mock\\('@/|mock\\(\\\"@/|ts\\.transpileModule\\(" web/src web/scripts --glob '*test*' --glob '*.mjs' --glob '*.ts' --glob '*.tsx'` - passed; no stale direct local mocks or transpile shims remain.
- `bash scripts/local_pr_review.sh` - passed; advisory overlap with Dependabot workflow PRs only.

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~82 |
| Audit script | ~210 |
| Audit fixture tests | ~170 |
| Rate-limit test update | ~75 |
| CI/local/package enrollment | ~18 |
| Total | ~555 |

This is over the 400-LOC soft cap because the slice includes both the guard and
the negative-test fixtures that prove the guard catches the class, not just the
current instance.
