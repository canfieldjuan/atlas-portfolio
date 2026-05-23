#!/usr/bin/env bash
# Run mechanical plan-doc audit checks before opening or updating a PR.
#
# Adapted from Atlas (canfieldjuan/ATLAS) scripts/pre_push_audit.sh.
# This repo's plan docs live under web/plans/; the Atlas-specific MCP /
# extracted-package / ASCII-Python checks are intentionally omitted (see
# web/plans/PR-Adopt-Atlas-PR-Discipline.md). Node lint/build run from
# scripts/local_pr_review.sh and the CI workflow, not here.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

PLAN_GLOB='web/plans/PR-*.md'

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

resolve_base_ref() {
    local ref
    if ref=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null); then
        echo "$ref"
        return 0
    fi
    if git rev-parse --verify origin/main >/dev/null 2>&1; then
        echo "origin/main"
        return 0
    fi
    return 1
}

# Accept an explicit base ref as the first arg (forwarded by local_pr_review.sh);
# otherwise auto-resolve trunk. This keeps the audited diff aligned with the
# caller's chosen base instead of silently re-resolving origin/main.
base_ref="${1:-}"
if [ -n "$base_ref" ]; then
    if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
        echo "pre_push_audit.sh: base ref not found: $base_ref" >&2
        exit 2
    fi
elif ! base_ref=$(resolve_base_ref); then
    echo "pre_push_audit.sh: could not resolve trunk base ref." >&2
    echo "tried: refs/remotes/origin/HEAD, origin/main" >&2
    exit 2
fi

base="$(git merge-base HEAD "$base_ref")"

committed=$(
    git diff --name-only --diff-filter=AM "$base"...HEAD -- "$PLAN_GLOB" 2>/dev/null || true
)
uncommitted=$(
    git status --porcelain -- "$PLAN_GLOB" 2>/dev/null |
        awk 'substr($0, 1, 2) !~ /D/ {print substr($0, 4)}' || true
)
committed_plan_docs=$(printf '%s\n' "$committed" | sort -u | grep -v '^$' || true)
uncommitted_plan_docs=$(printf '%s\n' "$uncommitted" | sort -u | grep -v '^$' || true)
plan_docs=$(printf '%s\n%s\n' "$committed_plan_docs" "$uncommitted_plan_docs" | sort -u | grep -v '^$' || true)
diff_plan_docs=$(
    comm -23 \
        <(printf '%s\n' "$committed_plan_docs" | grep -v '^$' || true) \
        <(printf '%s\n' "$uncommitted_plan_docs" | grep -v '^$' || true) || true
)

if [ -n "$plan_docs" ]; then
    while IFS= read -r doc; do
        [ -z "$doc" ] && continue
        run_check "Plan shape: $doc" python3 scripts/audit_plan_doc.py "$doc"
    done <<< "$plan_docs"

    while IFS= read -r doc; do
        [ -z "$doc" ] && continue
        run_check "Plan files touched: $doc" python3 scripts/audit_plan_doc_files_touched.py "$doc" "$base_ref"
        run_check "Plan diff size: $doc" python3 scripts/audit_plan_doc_diff_size.py "$doc" "$base_ref"
    done <<< "$diff_plan_docs"
else
    echo
    echo "==> Plan docs"
    echo "    SKIP (no $PLAN_GLOB added or modified vs $base_ref or working tree)"
fi

echo
if [ "$failures" -eq 0 ]; then
    echo "all checks passed"
    exit 0
fi

echo "$failures check(s) failed"
exit 1
