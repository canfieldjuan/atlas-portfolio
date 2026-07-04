#!/usr/bin/env python3
"""Print one observed PR state and exit.

Read-only helper for the Git -> CI -> review -> merge ladder. It never polls,
edits, resolves, or merges.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from typing import Any, Sequence


BLOCKING = {"ACTION_REQUIRED", "CANCELLED", "ERROR", "FAILURE", "STARTUP_FAILURE", "TIMED_OUT"}
PENDING = {"EXPECTED", "PENDING"}
PASSING = {"NEUTRAL", "SKIPPED", "SUCCESS"}
CHECK_PRIORITY = {"failed": 1, "passed": 2, "pending": 3}


def run(command: Sequence[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=False, capture_output=True, text=True)


def fail(message: str) -> None:
    raise RuntimeError(message)


def git_out(args: Sequence[str]) -> str:
    result = run(["git", *args])
    if result.returncode:
        fail(result.stderr.strip() or result.stdout.strip() or f"git {' '.join(args)} failed")
    return result.stdout.strip()


def gh_pr() -> dict[str, Any] | None:
    if shutil.which("gh") is None:
        fail("gh CLI is required to read PR state")
    result = run(
        [
            "gh",
            "pr",
            "view",
            "--json",
            "number,url,state,headRefOid,mergeStateStatus,reviewDecision,statusCheckRollup",
        ]
    )
    if result.returncode:
        detail = (result.stderr or result.stdout).strip().lower()
        if is_no_pr_message(detail):
            return None
        fail((result.stderr or result.stdout).strip() or "gh pr view failed")
    data = json.loads(result.stdout)
    if not isinstance(data, dict):
        fail("gh pr view returned non-object JSON")
    return data


def gh_merged_pr(branch: str) -> dict[str, Any] | None:
    result = run(
        [
            "gh",
            "pr",
            "list",
            "--state",
            "merged",
            "--head",
            branch,
            "--limit",
            "1",
            "--json",
            "number,url,state,headRefOid,mergeStateStatus,reviewDecision,statusCheckRollup",
        ]
    )
    if result.returncode:
        fail((result.stderr or result.stdout).strip() or "gh pr list --state merged failed")
    data = json.loads(result.stdout)
    return first_merged_pr(data)


def first_merged_pr(data: Any) -> dict[str, Any] | None:
    if not isinstance(data, list):
        fail("gh pr list returned non-list JSON")
    for item in data:
        if isinstance(item, dict) and str(item.get("state") or "").upper() == "MERGED":
            return item
    return None


def is_no_pr_message(message: str) -> bool:
    return "no pull requests found" in message.lower()


def row_verdict(raw: dict[str, Any]) -> tuple[str, str] | None:
    name = str(raw.get("name") or raw.get("context") or "").strip()
    status = str(raw.get("status") or "").strip().upper()
    conclusion = str(raw.get("conclusion") or "").strip().upper()
    state = str(raw.get("state") or "").strip().upper()
    verdict = conclusion or state
    if not name:
        return None
    if verdict in PENDING or (status != "COMPLETED" and not state):
        return name, "pending"
    if verdict in PASSING:
        return name, "passed"
    if verdict in BLOCKING:
        return name, "failed"
    return name, "failed"


def checks(pr: dict[str, Any]) -> tuple[list[str], list[str], list[str]]:
    by_name: dict[str, str] = {}
    for raw in pr.get("statusCheckRollup") or []:
        if not isinstance(raw, dict):
            continue
        verdict = row_verdict(raw)
        if verdict is None:
            continue
        name, state = verdict
        current = by_name.get(name)
        if current is None or CHECK_PRIORITY[state] > CHECK_PRIORITY[current]:
            by_name[name] = state
    failed = sorted(name for name, state in by_name.items() if state == "failed")
    pending = sorted(name for name, state in by_name.items() if state == "pending")
    passed = sorted(name for name, state in by_name.items() if state == "passed")
    return failed, pending, passed


def result(
    state: str,
    reason: str,
    *,
    pr: dict[str, Any] | None = None,
    head: str = "",
) -> dict[str, Any]:
    return {
        "state": state,
        "reason": reason,
        "pr_number": pr.get("number") if isinstance(pr, dict) else None,
        "pr_url": pr.get("url") if isinstance(pr, dict) else None,
        "head_oid": head or (pr.get("headRefOid") if isinstance(pr, dict) else None),
    }


def classify(*, dirty: bool, local_head: str, pr: dict[str, Any] | None) -> dict[str, Any]:
    if dirty:
        return result("LOCAL_DIRTY", "local worktree has uncommitted changes", head=local_head)
    if pr is None:
        return result("COMMITTED", "no pull request found for the current branch", head=local_head)

    pr_state = str(pr.get("state") or "").upper()
    pr_head = str(pr.get("headRefOid") or "")
    if pr_state == "MERGED":
        return result("MERGED", "pull request is merged", pr=pr, head=pr_head or local_head)
    if pr_state == "CLOSED":
        return result("REVIEW_PENDING", "pull request is closed and is not merge-ready", pr=pr, head=pr_head or local_head)
    if pr_head and pr_head != local_head:
        return result(
            "COMMITTED",
            "local HEAD does not match the pull request head; push or sync first",
            pr=pr,
            head=local_head,
        )

    failed, pending, passed = checks(pr)
    if failed:
        return result("CI_RED", "blocking checks failed: " + ", ".join(failed), pr=pr, head=pr_head)
    if pending or not passed:
        detail = ", ".join(pending) if pending else "no completed checks observed"
        return result("PUSHED_CI_PENDING", "checks pending: " + detail, pr=pr, head=pr_head)

    review = str(pr.get("reviewDecision") or "").upper()
    merge = str(pr.get("mergeStateStatus") or "").upper()
    if review == "APPROVED" and merge == "CLEAN":
        return result(
            "GREEN_MERGE_READY",
            "checks passed, reviewDecision is APPROVED, and merge state is CLEAN",
            pr=pr,
            head=pr_head,
        )

    parts = []
    if review != "APPROVED":
        parts.append(f"reviewDecision is {review or 'unset'}")
    if merge != "CLEAN":
        parts.append(f"mergeStateStatus is {merge or 'unset'}")
    return result("REVIEW_PENDING", "; ".join(parts), pr=pr, head=pr_head)


def read_state() -> dict[str, Any]:
    dirty = bool(git_out(["status", "--porcelain"]))
    head = git_out(["rev-parse", "HEAD"])
    branch = git_out(["branch", "--show-current"])
    pr = None if dirty else gh_pr()
    if not dirty and pr is None and branch:
        pr = gh_merged_pr(branch)
    return classify(dirty=dirty, local_head=head, pr=pr)


def text(state: dict[str, Any]) -> str:
    lines = [f"State: {state['state']}", f"Reason: {state['reason']}"]
    if state.get("pr_number"):
        lines.append(f"PR: #{state['pr_number']}")
    if state.get("pr_url"):
        lines.append(f"URL: {state['pr_url']}")
    if state.get("head_oid"):
        lines.append(f"Head: {state['head_oid']}")
    return "\n".join(lines)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print JSON")
    args = parser.parse_args(argv)
    try:
        state = read_state()
    except Exception as exc:
        print(f"pr state: error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(state, sort_keys=True) if args.json else text(state))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
