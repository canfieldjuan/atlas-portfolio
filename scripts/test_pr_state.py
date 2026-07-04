#!/usr/bin/env python3
"""Unit tests for scripts/pr_state.py."""

from __future__ import annotations

from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parent))

from pr_state import classify, is_no_pr_message, text  # noqa: E402


HEAD = "a" * 40
URL = "https://github.com/canfieldjuan/atlas-portfolio/pull/486"


def check(name: str, status: str, conclusion: str | None) -> dict[str, str | None]:
    return {"name": name, "status": status, "conclusion": conclusion}


def pr(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "number": 486,
        "url": URL,
        "state": "OPEN",
        "headRefOid": HEAD,
        "mergeStateStatus": "CLEAN",
        "reviewDecision": "APPROVED",
        "statusCheckRollup": [check("pre-push-audit", "COMPLETED", "SUCCESS")],
    }
    payload.update(overrides)
    return payload


class PrStateTests(unittest.TestCase):
    def state(self, *, dirty: bool = False, payload: dict[str, object] | None = None) -> str:
        return classify(dirty=dirty, local_head=HEAD, pr=payload)["state"]

    def test_dirty_worktree_wins(self) -> None:
        self.assertEqual(self.state(dirty=True, payload=pr(state="MERGED")), "LOCAL_DIRTY")

    def test_no_pr_or_unpushed_head_is_committed(self) -> None:
        self.assertEqual(self.state(payload=None), "COMMITTED")
        self.assertEqual(self.state(payload=pr(headRefOid="b" * 40)), "COMMITTED")

    def test_merged_pr_reports_merged(self) -> None:
        self.assertEqual(self.state(payload=pr(state="MERGED")), "MERGED")

    def test_closed_pr_is_not_merge_ready(self) -> None:
        self.assertEqual(self.state(payload=pr(state="CLOSED")), "REVIEW_PENDING")

    def test_failed_or_unknown_conclusion_reports_ci_red(self) -> None:
        self.assertEqual(
            self.state(payload=pr(statusCheckRollup=[check("audit", "COMPLETED", "FAILURE")])),
            "CI_RED",
        )
        self.assertEqual(
            self.state(payload=pr(statusCheckRollup=[check("audit", "COMPLETED", "WEIRD")])),
            "CI_RED",
        )

    def test_status_context_rows_are_not_skipped(self) -> None:
        self.assertEqual(
            self.state(
                payload=pr(
                    statusCheckRollup=[
                        check("check-run", "COMPLETED", "SUCCESS"),
                        {"context": "external/status", "state": "FAILURE"},
                    ]
                )
            ),
            "CI_RED",
        )
        self.assertEqual(
            self.state(payload=pr(statusCheckRollup=[{"context": "external/status", "state": "PENDING"}])),
            "PUSHED_CI_PENDING",
        )

    def test_pending_or_missing_checks_report_ci_pending(self) -> None:
        self.assertEqual(
            self.state(payload=pr(statusCheckRollup=[check("audit", "IN_PROGRESS", None)])),
            "PUSHED_CI_PENDING",
        )
        self.assertEqual(self.state(payload=pr(statusCheckRollup=[])), "PUSHED_CI_PENDING")

    def test_null_check_rows_are_ignored(self) -> None:
        self.assertEqual(
            self.state(
                payload=pr(
                    statusCheckRollup=[
                        {"name": None, "status": None, "conclusion": None},
                        check("audit", "COMPLETED", "SUCCESS"),
                    ]
                )
            ),
            "GREEN_MERGE_READY",
        )

    def test_green_ci_needs_review_and_clean_merge_state(self) -> None:
        self.assertEqual(self.state(payload=pr(reviewDecision="")), "REVIEW_PENDING")
        self.assertEqual(self.state(payload=pr(mergeStateStatus="DIRTY")), "REVIEW_PENDING")
        self.assertEqual(self.state(payload=pr()), "GREEN_MERGE_READY")

    def test_text_renderer_includes_useful_context(self) -> None:
        rendered = text(classify(dirty=False, local_head=HEAD, pr=pr()))

        self.assertIn("State: GREEN_MERGE_READY", rendered)
        self.assertIn("PR: #486", rendered)
        self.assertIn(URL, rendered)
        self.assertIn(HEAD, rendered)

    def test_only_specific_no_pr_message_is_treated_as_no_pr(self) -> None:
        self.assertTrue(is_no_pr_message("no pull requests found for branch"))
        self.assertFalse(is_no_pr_message("HTTP 404: Not Found"))


if __name__ == "__main__":
    unittest.main()
