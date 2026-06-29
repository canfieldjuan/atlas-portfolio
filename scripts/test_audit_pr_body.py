#!/usr/bin/env python3
"""Focused regression tests for scripts/audit_pr_body.py."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile

from audit_pr_body import audit_pr_body, is_dependabot_author


REPO_ROOT = Path(__file__).resolve().parents[1]


VALID_BODY = """\
Plan: web/plans/PR-Test-Slice.md
Slice phase: Workflow/process

This slice proves the PR body contract accepts a complete body.

## Intentional

None.

## Deferred

None.

## Parked hardening

None.

## Verification

- Pending.

## Diff size

Small.
"""

INVALID_BODY = "Dependabot dependency bump body without the local plan contract.\n"


def test_valid_body_passes() -> None:
    with tempfile.TemporaryDirectory() as tempdir:
        root = Path(tempdir)
        plan_dir = root / "web" / "plans"
        plan_dir.mkdir(parents=True)
        (plan_dir / "PR-Test-Slice.md").write_text("# test\n", encoding="utf-8")

        assert audit_pr_body(VALID_BODY, root=root) == []


def test_invalid_body_fails_for_normal_author() -> None:
    failures = audit_pr_body(INVALID_BODY, root=REPO_ROOT)

    assert "first non-empty line must be" in "\n".join(failures)
    assert "missing 'Slice phase: <phase>'" in "\n".join(failures)


def test_dependabot_author_detection() -> None:
    assert is_dependabot_author("app/dependabot")
    assert is_dependabot_author("dependabot[bot]")
    assert not is_dependabot_author("canfieldjuan")
    assert not is_dependabot_author(None)


def test_dependabot_cli_exemption() -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as body_file:
        body_file.write(INVALID_BODY)
        body_path = Path(body_file.name)

    try:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "audit_pr_body.py"),
                "--pr-author",
                "app/dependabot",
                str(body_path),
            ],
            check=False,
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
        )
        assert result.returncode == 0
        assert "Dependabot PR body exempt" in result.stdout
    finally:
        body_path.unlink(missing_ok=True)


def test_normal_author_cli_still_fails() -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as body_file:
        body_file.write(INVALID_BODY)
        body_path = Path(body_file.name)

    try:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "audit_pr_body.py"),
                "--pr-author",
                "canfieldjuan",
                str(body_path),
            ],
            check=False,
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
        )
        assert result.returncode == 1
        assert "AGENTS.md section 1b contract" in result.stdout
    finally:
        body_path.unlink(missing_ok=True)


def main() -> int:
    test_valid_body_passes()
    test_invalid_body_fails_for_normal_author()
    test_dependabot_author_detection()
    test_dependabot_cli_exemption()
    test_normal_author_cli_still_fails()
    print("test_audit_pr_body.py: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
