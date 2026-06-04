## Why this slice exists

PR-Deflection-Snapshot-Smoke-CI enrolled the mocked Snapshot landing smoke in
PR CI. That catches parser and marker regressions in code review, but it still
does not prove the deployed production route is serving the Snapshot-first offer
after Vercel deploys.

This slice closes the live-monitoring half of the earlier deferred work: a
scheduled/manual GitHub Actions workflow fetches the public production Snapshot
landing page and fails if the route stops rendering the free Deflection Snapshot
promise, intake CTA, or paid-report-first regression guards.

## Scope (this PR)

Slice phase: Production hardening

1. Add a scheduled and manually dispatchable GitHub Actions workflow for the
   production Snapshot landing smoke.
2. Run the existing `smoke:deflection-snapshot-landing` script against
   `https://juancanfield.com` by default.
3. Preserve the mocked PR CI test, smoke script, package scripts, landing page,
   intake route, checkout, and results behavior.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Live-Monitor.md`
- `.github/workflows/deflection_snapshot_landing_monitor.yml`

## Mechanism

The workflow checks out the repo, sets up Node 20, and runs the existing public
page smoke:

```bash
npm --prefix web run smoke:deflection-snapshot-landing -- \
  --base-url "$base_url" \
  --json \
  --output "$RUNNER_TEMP/deflection-snapshot-landing-smoke.json"
```

Scheduled runs use `https://juancanfield.com`. Manual `workflow_dispatch` runs
can override the base URL to inspect a production-like host without changing the
workflow.

## Intentional

- No secrets are added. The smoke fetches one public HTML page and does not call
  ATLAS, Stripe, Vercel Blob, or private APIs.
- The workflow does not run on every pull request. PR coverage stays in the
  mocked `pre_push_audit.yml` test added by PR-Deflection-Snapshot-Smoke-CI;
  this workflow is for deployed-route monitoring.
- The workflow does not run `npm ci` because the smoke script uses Node built-ins
  and local repo files only.

## Deferred

- External alert routing beyond a failed GitHub Actions run remains an
  operations follow-up.
- Visual regression screenshots for the Snapshot landing route remain out of
  scope.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url https://juancanfield.com --json --output /tmp/deflection-snapshot-live-monitor.json` - passed; returned `ok: true` for `https://juancanfield.com/systems/support-ticket-deflection/snapshot` with all eight Snapshot landing markers present.
- `bash scripts/pre_push_audit.sh origin/main` - passed; plan shape passed for
  this plan.
- `bash scripts/local_pr_review.sh` - initially failed in this fresh `/tmp`
  worktree because `web/node_modules` was missing (`eslint` and `next` not
  found).
- `npm --prefix web ci` - passed; added 378 packages, audited 379 packages, and
  reported the existing 3 dependency audit findings already parked in
  `HARDENING.md`.
- `bash scripts/local_pr_review.sh` - passed after dependency install; plan
  audits, drift advisory, ESLint, Next build, and `git diff --check` all passed.
- `gh pr view 230 --repo canfieldjuan/atlas-portfolio --json title,headRefName,files --jq '{title, headRefName, files: [.files[].path]}'` - inspected the only open PR after local review; no file overlap with this workflow-monitor slice.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~90 |
| Monitor workflow | ~47 |
| Total | ~137 |
