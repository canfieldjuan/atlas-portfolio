# PR-Dependabot-Body-Contract-Exemption

## Why this slice exists

Dependabot dependency PRs #396-#400 and #467-#471 are blocked by the
`pr-body-contract` workflow because the body audit requires a plan doc. That
contract is right for human and agent-built PRs, but Dependabot does not create
repo plan docs and should not be forced into the Atlas-style slice format before
dependency/security bumps can merge.

## Scope (this PR)

Slice phase: Workflow/process

1. Teach the PR body audit to accept Dependabot-authored PRs as an explicit
   exemption.
2. Pass the pull request author login from the workflow into the audit command.
3. Add focused coverage proving Dependabot is exempt while normal PR bodies
   still fail when they omit the plan contract.

### Files touched

- `scripts/audit_pr_body.py` -- add the Dependabot author exemption.
- `scripts/test_audit_pr_body.py` -- cover the exemption and normal failure path.
- `.github/workflows/pr_body_contract.yml` -- pass the PR author into the audit.
- `web/plans/PR-Dependabot-Body-Contract-Exemption.md` -- this plan.

## Mechanism

The workflow writes the PR body exactly as before, then calls
`scripts/audit_pr_body.py` with `--pr-author` set to
`github.event.pull_request.user.login`. The audit returns success only for known
Dependabot author logins. Non-Dependabot PRs continue through the existing
plan-line, slice-phase, why, and required-section checks.

## Intentional

- This does not relax the body contract for human or agent-authored PRs.
- This keeps the check job present and green instead of relying on a skipped
  required check.
- This does not merge any dependency bump by itself; it only unblocks their
  body-contract gate so each PR can still be reconciled against its own CI.

## Deferred

- #467 still has a real pre-push-audit failure from `eslint@10.6.0` interacting
  with the current Next ESLint stack; handle that PR separately after the body
  contract is no longer noise.
- Re-run or refresh the existing Dependabot PR checks after this lands.

Parked hardening: none.

## Verification

- `python3 scripts/test_audit_pr_body.py` -- PASS.
- `python3 scripts/audit_pr_body.py --pr-author app/dependabot web/plans/PR-Dependabot-Body-Contract-Exemption.md`
  -- PASS with the Dependabot exemption message, proving a non-contract body can
  pass only when the author is Dependabot.
- `python3 scripts/audit_pr_body.py web/plans/PR-Dependabot-Body-Contract-Exemption.md`
  -- FAIL with normal body-contract errors, proving non-Dependabot PRs still
  require the AGENTS.md section 1b body.

## Estimated diff size

| File | LOC |
|---|---:|
| `scripts/audit_pr_body.py` | ~24 |
| `scripts/test_audit_pr_body.py` | ~132 |
| `.github/workflows/pr_body_contract.yml` | ~4 |
| `web/plans/PR-Dependabot-Body-Contract-Exemption.md` | ~65 |
| Total | ~225 |
