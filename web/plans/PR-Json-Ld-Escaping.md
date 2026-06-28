## Why this slice exists

Issue #313 flags that several JSON-LD script sinks use bare `JSON.stringify`, which leaves a latent `</script>` footgun if any structured-data source ever becomes dynamic. Two landing components already escaped `<` locally; this slice centralizes that behavior and routes all JSON-LD script payloads through one helper.

The data is author-controlled today, so this is preventative hardening rather than an active exploit fix.

## Scope (this PR)

Slice phase: Production hardening

1. Add one shared JSON-LD serialization helper that escapes `<` as `\u003c`.
2. Replace every `application/ld+json` script payload that currently uses bare `JSON.stringify`.
3. Replace the two local landing-page JSON-LD helpers with the shared helper.
4. Add and enroll a source audit that fails if an `application/ld+json` sink uses bare `JSON.stringify` again.

### Files touched

- `.github/workflows/pre_push_audit.yml` — enroll the JSON-LD escaping test.
- `web/package.json` — add the JSON-LD escaping test script.
- `web/plans/PR-Json-Ld-Escaping.md` — plan for this slice.
- `web/scripts/test-json-ld-escaping.mjs` — test the helper and scan JSON-LD sinks.
- `web/src/app/ai-automation-consultant/page.tsx` — use the shared JSON-LD helper.
- `web/src/app/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/resources/[slug]/page.tsx` — use the shared JSON-LD helper.
- `web/src/app/resources/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/services/page.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/ai-content-ops/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/ai-content-ops/ongoing-support/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/ai-content-ops/ongoing-support/page.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/atlas-llm-gateway/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/atlas-llm-gateway/page.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/support-ticket-deflection/calculator/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/support-ticket-deflection/demo/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/support-ticket-deflection/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/support-ticket-deflection/playbook/layout.tsx` — use the shared JSON-LD helper.
- `web/src/app/systems/support-ticket-deflection/support-tax/layout.tsx` — use the shared JSON-LD helper.
- `web/src/components/landing/DeflectionLandingPage.tsx` — replace the local JSON-LD helper.
- `web/src/components/landing/DiagnosticReportLandingPage.tsx` — replace the local JSON-LD helper.
- `web/src/lib/json-ld.ts` — shared JSON-LD serialization helper.

## Mechanism

`jsonLdScriptPayload(value)` serializes the structured-data object with `JSON.stringify` and replaces every `<` with `\u003c`. That preserves valid JSON while preventing `</script>` text from terminating the script tag if a future structured-data source contains dynamic copy.

The test transpiles the helper, verifies that dangerous-looking strings serialize without raw `<` or `</script>`, and scans each `application/ld+json` script block under `web/src` for bare `JSON.stringify` usage.

## Intentional

- This only changes JSON-LD script sinks. API bodies, logs, fixtures, and test JSON remain untouched.
- The helper escapes `<`, matching the local helper behavior already used by the deflection landing components. It does not add broader HTML escaping because JSON-LD inside a script tag only needs to prevent script-tag termination for this risk.
- The source audit is intentionally specific to `type="application/ld+json"` blocks so it does not become a noisy generic `JSON.stringify` ban.

## Deferred

- No broader JSON serialization cleanup is included.
- No CSP changes are included; this slice only closes the JSON-LD script termination footgun.

Parked hardening: none

## Verification

Local checks:

```bash
npm --prefix web run test:json-ld-escaping
# PASS — JSON-LD escaping tests passed.

node web/scripts/audit-test-enrollment.mjs
# PASS — All 36 test:* scripts are enrolled in .github/workflows/pre_push_audit.yml.

npm --prefix web run test:test-enrollment-audit
# PASS — Test enrollment audit tests passed.

npm --prefix web run lint
# PASS

git diff --check
# PASS
```

Full local review before opening the PR:

```bash
bash scripts/local_pr_review.sh
# PASS — plan audits, drift advisory, dead-code baseline, landing smoke, lint, Next build, and whitespace all passed.
```

Recurring value grep:

```bash
rg -n "type=\"application/ld\\+json\"|dangerouslySetInnerHTML=\\{\\{ __html: JSON\\.stringify|function jsonLdPayload|jsonLdScriptPayload" web/src web/scripts web/package.json .github/workflows/pre_push_audit.yml
# PASS — no bare JSON.stringify JSON-LD sinks or local jsonLdPayload helpers remain; JSON-LD blocks use jsonLdScriptPayload.
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Helper and test | ~95 |
| JSON-LD sink imports/replacements | ~75 |
| Plan/package/CI | ~100 |
| Total | ~270 |
