#!/usr/bin/env bash
# Run the local mechanical review bundle before opening or updating a PR.
#
# Adapted from Atlas (canfieldjuan/ATLAS) scripts/local_pr_review.sh.
# Bundle for this repo: plan-doc audits (scripts/pre_push_audit.sh) + the
# Node gates (lint + build, run from web/) + whitespace check. The
# cross-session drift audit is deferred (see
# web/plans/PR-Adopt-Atlas-PR-Discipline.md) and will slot in below when ported.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

base_ref="origin/main"
base_ref_set=0
allow_dirty=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --allow-dirty)
            allow_dirty=1
            shift
            ;;
        --help|-h)
            cat <<'EOF'
Usage: bash scripts/local_pr_review.sh [--allow-dirty] [base-ref]

Run the local mechanical review bundle before opening or updating a PR.
By default, the worktree must be clean so committed-diff checks cannot
silently ignore uncommitted edits.
EOF
            exit 0
            ;;
        --*)
            echo "local_pr_review.sh: unknown option: $1" >&2
            exit 2
            ;;
        *)
            if [ "$base_ref_set" -eq 1 ]; then
                echo "local_pr_review.sh: multiple base refs supplied" >&2
                exit 2
            fi
            base_ref="$1"
            base_ref_set=1
            shift
            ;;
    esac
done

failures=0

run_check() {
    local label="$1"
    shift
    echo
    echo "==> $label"
    if "$@"; then
        echo "    PASS"
    else
        echo "    FAIL"
        failures=$((failures + 1))
    fi
}

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
    echo "local_pr_review.sh: base ref not found: $base_ref" >&2
    echo "fetch trunk first, or pass an explicit base ref" >&2
    exit 2
fi

if [ "$allow_dirty" -ne 1 ] && [ -n "$(git status --porcelain)" ]; then
    echo "local_pr_review.sh: worktree has uncommitted changes." >&2
    echo "Commit or stash them before running local review, or pass --allow-dirty for a partial/advisory run." >&2
    echo >&2
    git status --short >&2
    exit 1
fi

base="$(git merge-base HEAD "$base_ref")"

echo "local PR review"
echo "base ref: $base_ref"
echo "merge base: $base"
echo
echo "changed files:"
git diff --name-status "$base"...HEAD || true

run_check "Plan-doc audit bundle" bash scripts/pre_push_audit.sh "$base_ref"

# Node gates: our real "does it compile / lint" check. Run from web/.
run_check "ESLint (web)" npm --prefix web run lint
run_check "Next build (web)" npm --prefix web run build

run_check "git diff --check" git diff --check

echo
if [ "$failures" -eq 0 ]; then
    echo "local PR review passed"
    exit 0
fi

echo "$failures local review check(s) failed"
exit 1
