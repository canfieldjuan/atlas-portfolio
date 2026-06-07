## Why this slice exists

PR-Deflection-Snapshot-Monitor-Alert made the production Snapshot landing monitor
open or update a GitHub issue on failure. The workflow now produces a durable
signal, but the operator path is still implicit: how to inspect the failure
artifact, rerun the monitor, dedupe issue races, and decide when the issue can
be closed.

This slice adds the runbook for that issue lifecycle so a failed monitor run is
actionable instead of just visible.

## Scope (this PR)

Slice phase: Production hardening

1. Add a Snapshot landing monitor runbook under the existing landing-page
   framework docs.
2. Document the failure issue triage path, artifact checks, manual rerun command,
   duplicate issue handling, and close criteria.
3. Preserve the monitor workflow, smoke script, landing page, intake route,
   checkout, results page, and PR CI workflow.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Monitor-Runbook.md`
- `web/docs/landing-page-framework/deflection-snapshot-landing-monitor.md`

## Mechanism

The new runbook is operator documentation only. It describes the existing
workflow and issue marker, then gives a concrete response sequence:

```bash
gh workflow run deflection_snapshot_landing_monitor.yml \
  -f base_url=https://juancanfield.com
```

It also names the closing rule: close the monitor issue only after the latest
scheduled or manual run is green, the production route has been manually
inspected, and any duplicate failure issues have been consolidated.

## Intentional

- No workflow code changes are included. The previous slice already added the
  alert behavior; this slice documents how to operate it.
- The runbook does not prescribe external alerting. GitHub issue alerting remains
  the current repo-native path, with external services still deferred.
- The runbook keeps browser visual checks manual because this monitor is an HTML
  marker smoke, not a screenshot regression suite.

## Deferred

- External alert routing to email, Slack, PagerDuty, or another incident channel
  remains an operations follow-up if GitHub issues are not enough.
- Visual regression screenshots for the Snapshot landing route remain out of
  scope.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `gh api graphql -f owner=canfieldjuan -f name=atlas-portfolio -F number=234
  ... reviewThreads` - passed; found one unresolved Copilot thread on the
  base-url protocol guidance, fixed in this update.
- `rg -n "Use HTTPS for public hosts|http://localhost|http://127\\.0\\.0\\.1|non-HTTPS protocols for non-local hosts" web/docs/landing-page-framework/deflection-snapshot-landing-monitor.md -S` - passed; confirms the runbook now matches the smoke's public-host HTTPS requirement and local HTTP exception.
- `bash scripts/pre_push_audit.sh origin/main` - passed; plan shape passed for
  this plan.
- `rg -n "Deflection Snapshot landing monitor failing|deflection-snapshot-landing-monitor|gh workflow run deflection_snapshot_landing_monitor.yml|Close the issue only after" web/docs/landing-page-framework/deflection-snapshot-landing-monitor.md web/plans/PR-Deflection-Snapshot-Monitor-Runbook.md -S` - passed; found the issue title, marker, manual rerun command, and close criteria.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - initially failed in this fresh `/tmp`
  worktree because `web/node_modules` was missing (`eslint` and `next` not
  found).
- `npm --prefix web ci` - passed; added 378 packages, audited 379 packages, and
  reported the existing 3 dependency audit findings already parked in
  `HARDENING.md`.
- `bash scripts/local_pr_review.sh` - passed after dependency install; plan
  audits, drift advisory, ESLint, Next build, and `git diff --check` all passed.
- `gh pr view 232 --repo canfieldjuan/atlas-portfolio --json title,headRefName,files --jq '{title, headRefName, files: [.files[].path]}'` - inspected the only open PR before editing; no file overlap with this monitor-runbook slice.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~82 |
| Monitor runbook | ~121 |
| Total | ~203 |
