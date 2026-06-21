# Deflection Uploaded Search Live Monitor

## Why this slice exists

Issue #346 tracks the manual deployed proof for uploaded-report search, and the
existing #343 smoke already verifies the customer-visible portfolio route against
a paid report. The deferred follow-up is recurring coverage after operators
provide a reusable paid report id and safe query. Without a monitor, the route can
regress after the one-time acceptance run and nobody gets a durable signal.

## Scope (this PR)

Slice phase: Production hardening

1. Add a scheduled and manually dispatchable GitHub Actions workflow for the
   uploaded-report search smoke.
2. Reuse `smoke:deflection-uploaded-search` against `https://juancanfield.com`
   by default once monitor secrets are configured.
3. Keep scheduled runs quiet until the required monitor secrets exist, so this
   follow-up can merge before the #346 paid-report inputs are available.
4. Open or update a GitHub issue if the configured smoke fails.

### Files touched

- `web/plans/PR-Deflection-Uploaded-Search-Live-Monitor.md` - this plan doc.
- `.github/workflows/deflection_uploaded_search_monitor.yml` - scheduled/manual uploaded-search monitor.

## Mechanism

The workflow runs daily and through `workflow_dispatch`. It reads the paid report
id and safe query from repository secrets named
`DEFLECTION_UPLOADED_SEARCH_MONITOR_REQUEST_ID` and
`DEFLECTION_UPLOADED_SEARCH_MONITOR_QUERY`; manual runs may override only the
base URL. If either secret is missing, the workflow writes a small skipped
artifact and exits successfully without calling the deployed route.

When configured, it runs:

```bash
npm --prefix web run smoke:deflection-uploaded-search -- \
  --base-url "$base_url" \
  --request-id "$monitor_request_id" \
  --query "$monitor_query" \
  --json \
  --output "$RUNNER_TEMP/deflection-uploaded-search-smoke.json"
```

The existing smoke prints shape/count metadata only. On failure, the workflow
uploads the artifact and opens or comments on a `Deflection uploaded search
monitor failing` issue with the run URL, base URL, and commit.

## Intentional

- No request id, query text, matched answer, evidence, source labels, or customer
  content is written into the workflow file or issue body.
- Missing monitor secrets do not create failure issues because #346 is still the
  operator-owned place to collect the paid-report inputs.
- The workflow does not run on every pull request. PR coverage remains the
  mocked uploaded-search test; this monitor is for deployed-route regression.
- The workflow does not run `npm ci` because the smoke script uses Node built-ins
  and local repo files only.

## Deferred

- A runbook for operating uploaded-search monitor failures remains a follow-up
  after this workflow exists.
- The #346 manual positive, locked-report, and no-match acceptance checks remain
  blocked on operator-provided request ids and a safe query.
- External alert routing beyond GitHub Actions/issues remains out of scope.

Parked hardening: none.

## Verification

- `python3 scripts/audit_plan_doc.py web/plans/PR-Deflection-Uploaded-Search-Live-Monitor.md` - passed.
- `node web/scripts/smoke-deflection-uploaded-search.mjs --help` - passed; confirmed the reused smoke documents the POST body and shape/count-only output contract.
- `npm --prefix web run test:deflection-uploaded-search` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory, dead-code baseline, Snapshot landing smoke tests, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Uploaded-Search-Live-Monitor.md` | ~87 |
| `.github/workflows/deflection_uploaded_search_monitor.yml` | ~116 |
| **Total** | **~203** |
