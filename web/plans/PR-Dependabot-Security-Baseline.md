# PR-Dependabot-Security-Baseline

## Why this slice exists

Issue #313 calls for Dependabot as part of the portfolio security baseline. The
repo now has a high-severity npm audit CI gate, but it still lacks automated
dependency-update PRs for the `web` npm tree and GitHub Actions workflows. This
slice adds that update visibility without bundling the larger SAST, gitleaks,
or action-pinning work.

## Scope (this PR)

Slice phase: Workflow/process

1. Add Dependabot version updates for the `web` npm package tree.
2. Add Dependabot version updates for GitHub Actions workflows at the repo root.
3. Keep Dependabot conservative: weekly cadence, bounded open PR count, no
   auto-merge, and no grouping/routing policy that could hide individual
   security-relevant updates.

### Files touched

- `.github/dependabot.yml` — add Dependabot update configuration.
- `web/plans/PR-Dependabot-Security-Baseline.md` — document the slice.

## Mechanism

Dependabot reads `.github/dependabot.yml` and opens update PRs for each
configured package ecosystem. This slice configures two ecosystems:

1. `npm` with `directory: "/web"`, matching the repo's `web/package-lock.json`
   and the existing CI install path.
2. `github-actions` with `directory: "/"`, covering workflow action references
   under `.github/workflows/`.

Both schedules run weekly in the America/Chicago timezone, and each ecosystem is
limited to five open PRs so dependency upkeep stays visible without flooding the
queue.

## Intentional

- This is version-update configuration, not auto-merge. Human review and the
  existing CI gates still decide whether a dependency PR lands.
- No labels, assignees, or reviewers are configured here; the repo does not
  currently rely on those labels as workflow contracts, and adding them would
  be process policy beyond this slice.
- The GitHub Actions ecosystem points at `/`, because workflows are repo-level
  files under `.github/workflows/`.
- This does not SHA-pin actions. Dependabot can surface action updates now;
  pinning the `uses:` references remains its own #313 hardening slice.

## Deferred

- SAST/CodeQL or Semgrep remains a separate #313 slice.
- Gitleaks secret scanning remains a separate #313 slice.
- Action SHA pinning remains a separate #313 slice.
- Branch protection / required checks remain a repo-settings decision outside
  this code slice.
- Full moderate-level dependency blocking remains deferred until Next ships a
  compatible patched dependency for the vendored PostCSS advisory.

Parked hardening: none

## Verification

- `test -f .github/dependabot.yml` — passed.
- `python3 - <<'PY' ... yaml.safe_load(open('.github/dependabot.yml')) ... PY`
  — passed; parsed `version: 2` with two `updates` entries.
- `rg -n 'package-ecosystem: "npm"|directory: "/web"|package-ecosystem: "github-actions"|directory: "/"' .github/dependabot.yml`
  — passed; confirmed `/web` npm and root GitHub Actions ecosystems.
- `bash scripts/pre_push_audit.sh origin/main` — passed; plan shape, files
  touched, and estimated diff-size audits passed for this slice.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed; plan audits, drift audit, dead
  code baseline, Deflection Snapshot landing smoke, ESLint, Next build, and
  `git diff --check` passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `.github/dependabot.yml` | ~20 |
| `web/plans/PR-Dependabot-Security-Baseline.md` | ~75 |
| Total | ~95 |
