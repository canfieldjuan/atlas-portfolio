# PR Reconstruction Protocol

Every serious PR review reconstructs the PR independently from the diff. Do not
review a PR against its description. The description, title, and commit message
are claims; the diff is the ground truth.

## Why

Reviewing from the author's framing makes hidden drift look intentional. The
review we want catches three separate failures:

- the diff does not match the description;
- the diff does not match a correct fix for the problem;
- the diff changes things the description never mentions.

This is also builder guidance. Build the PR so it survives this review: keep the
diff narrow, make the description exact, and do not hide behavior in vague prose.

## Protocol

Build two independent reconstructions, then compare them against the PR
description.

1. **Read the diff alone.** State what it actually does, change by change, in
   your own words. Do not infer intent from the description, title, or commit.
2. **Derive the correct fix from the problem alone.** From the issue, request, or
   plan's problem statement, identify what a correct fix would need to touch and
   change without letting the diff shape that answer.
3. **Compare all three.** Report every gap between the diff, the correct-fix
   shape, and the PR description:
   - diff does not match description;
   - diff does not match correct fix;
   - diff changes unmentioned things.
4. **Cite checkable evidence for every claim.** Use `file:line` for code or
   content claims. For non-file evidence, cite the command, CI job, generated
   artifact, or PR metadata. Sort each claim into confirmed, contradicted, or
   could-not-determine. Do not mark a claim confirmed without evidence.

Lead with gaps, not a summary. If no gaps exist, say that directly and name any
remaining test or verification risk.

