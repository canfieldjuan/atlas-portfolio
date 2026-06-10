# PR-PR-Body-Contract-Gate

## Why this slice exists

The AGENTS.md section 1b PR-body contract (Plan lead line, Slice phase line,
then Intentional / Deferred / Parked hardening / Verification / Diff size)
has no mechanical enforcement in this repo: the plan-doc audits validate the
plan file, but nothing validates the PR body itself. PR #303 shipped with a
non-conforming body on 2026-06-10 and drew a reviewer BLOCKER that only
human review caught. This slice adds the same CI gate just added to ATLAS
(canfieldjuan/ATLAS PR #1479): every pull_request event audits the PR body
against the section contract, so a non-conforming body fails checks
regardless of which tool or session opened the PR.

## Scope (this PR)

Slice phase: Production hardening

1. Add `scripts/audit_pr_body.py` (adapted from the ATLAS version, plan
   prefix `web/plans/`): validates the Plan lead line (and that the named
   plan doc exists in the checkout), a Slice phase line before the first
   section, and the five required sections in order.
2. Add `.github/workflows/pr_body_contract.yml`: on pull_request
   opened/edited/reopened/synchronize, write the event payload body to a
   file (no GitHub API call) and run the audit.

### Files touched

- `.github/workflows/pr_body_contract.yml` - the gate workflow.
- `scripts/audit_pr_body.py` - the body audit (ATLAS adaptation).
- `web/plans/PR-PR-Body-Contract-Gate.md` - plan contract for this slice.

## Mechanism

`audit_pr_body(body, root)` is a pure function over the body text: the
first non-empty line must be a Plan lead line naming a doc under
`web/plans/`, and that doc must exist under the repo root; a `Slice phase:`
line must appear before the first `##` heading; the five required `##`
sections must all be present and in relative order (other sections may be
interleaved). Failures are listed one per line; exit 1 on any failure, 2 on
usage errors.

The workflow materializes the PR body via an `env:` binding of the event
payload written with printf - the body never passes through shell
interpolation, and no GitHub API call is made, so the gate cannot fail for
token-auth reasons. The `edited` trigger means fixing the body re-runs the
gate without a new push.

## Intentional

- Presence and order only, not content quality; the reviewer owns judgment.
- No waiver mechanism - a waiver marker reintroduces the silent bypass this
  gate exists to close.
- No local unit tests in this repo: the script is a line-for-line
  adaptation of the ATLAS version (only the plan-prefix regex differs), and
  the failure-mode unit tests live with the canonical copy in ATLAS
  (tests/test_audit_pr_body.py there), matching how this repo's other
  audit scripts were adopted from Atlas.
- Heading matching is case-sensitive and exact, mirroring AGENTS.md.

## Deferred

- Bringing existing open PR bodies into conformance is per-PR cleanup
  (PR #303's body was already corrected during review).

Parked hardening: none.

## Verification

- Passed: `python3 scripts/audit_pr_body.py` against the bodies of merged
  PRs #300 and #301 (both PASS) and the corrected #303 body (sections pass;
  plan-existence correctly reports the not-yet-merged plan file when run
  from main).
- Passed: the same body fixtures fail when a required section is removed
  (covered by the canonical ATLAS test suite for the shared logic).

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/pr_body_contract.yml` | 24 |
| `scripts/audit_pr_body.py` | 110 |
| `web/plans/PR-PR-Body-Contract-Gate.md` | 85 |
| **Total** | **~219** |
