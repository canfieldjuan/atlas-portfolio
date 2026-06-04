## Why this slice exists

PR-Deflection-Snapshot-Live-Monitor added a daily/manual production smoke for
the public Snapshot landing page, but deferred alert routing beyond a red
GitHub Actions run. A failed scheduled monitor is easy to miss if nobody is
watching the Actions tab.

This slice gives the monitor a durable operator-visible failure signal: when the
Snapshot landing smoke fails, the workflow opens or updates a single GitHub
issue with the run URL, checked base URL, workflow name, and commit SHA.

## Scope (this PR)

Slice phase: Production hardening

1. Grant the Snapshot landing monitor workflow `issues: write` in addition to
   its existing read-only checkout permission.
2. Add a failure-only GitHub Script step that creates one open monitor issue or
   comments on the existing one instead of creating duplicates.
3. Preserve the smoke command, schedule/manual triggers, artifact upload, landing
   page, intake route, checkout, results page, and PR CI workflow.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Monitor-Alert.md`
- `.github/workflows/deflection_snapshot_landing_monitor.yml`

## Mechanism

The smoke and artifact upload keep running exactly as before. A new final step
runs only when the job has failed:

```yaml
- name: Open monitor failure issue
  if: failure()
  uses: actions/github-script@v7
```

The script searches for an open issue containing the stable title
`Deflection Snapshot landing monitor failing`. If one exists, it appends a new
comment with the latest failed run context. If none exists, it creates the issue
with the same marker and context. That keeps repeated daily failures visible
without opening a new issue every day.

## Intentional

- The workflow now requests `issues: write`. This is limited to the monitor
  workflow and is required for the failure-only issue/comment step.
- No Slack/email/webhook secret is added. GitHub issue creation is the smallest
  repo-native alert path available without provisioning another service.
- The failure issue is not auto-closed on recovery. Closing it remains an
  operator action after confirming the route is healthy.

## Deferred

- External alert routing to email, Slack, PagerDuty, or another incident channel
  remains an operations follow-up if GitHub issues are not enough.
- Visual regression screenshots for the Snapshot landing route remain out of
  scope.
- The parked web dependency audit finding in `HARDENING.md` was considered but
  remains unrelated because this slice does not change dependencies.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` - passed; plan shape passed for
  this plan.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - initially failed in this fresh `/tmp`
  worktree because `web/node_modules` was missing (`eslint` and `next` not
  found).
- `npm --prefix web ci` - passed; added 378 packages, audited 379 packages, and
  reported the existing 3 dependency audit findings already parked in
  `HARDENING.md`.
- `bash scripts/local_pr_review.sh` - passed after dependency install; plan
  audits, drift advisory, ESLint, Next build, and `git diff --check` all passed.
- `gh pr view 232 --repo canfieldjuan/atlas-portfolio --json title,headRefName,files --jq '{title, headRefName, files: [.files[].path]}'` - inspected the only open PR before editing; no file overlap with this monitor-alert slice.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~87 |
| Monitor workflow alert step | ~46 |
| Total | ~133 |
