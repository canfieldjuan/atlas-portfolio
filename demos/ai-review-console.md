# Demo: AI Review, QA, and Visibility Console

This demo shows how ATLAS handles generated outputs after the model responds: validation, retries, issue surfacing, provenance, and operator review.

## Why This Demo Matters

- It proves this is production AI software, not just model orchestration.
- It shows auditability, quality control, and operational maturity around LLM workflows.
- It is a strong differentiator because most AI demos stop at generation and ignore reviewability.

## Watch the Clip

- GIF preview: [`../recordings/gifs/pipeline-review.gif`](../recordings/gifs/pipeline-review.gif)
- Full recording: [`../recordings/ui/pipeline-review-demo.webm`](../recordings/ui/pipeline-review-demo.webm)

## The Flow

1. ATLAS generates a reasoning artifact or content artifact.
2. The system validates structure, citations, and quality constraints.
3. Failed or thin outputs trigger retries and issue persistence.
4. Operators can inspect quality signals, review the artifact, and understand what happened.

## What To Notice

- ATLAS tracks failures and recovered retries instead of hiding them.
- Generated artifacts carry provenance and reference data so operators can trust what they are approving.
- The same visibility model supports reasoning synthesis, reports, and content publishing workflows.

## Best Screenshots To Add

- `reports-gallery.png`
- `admin-costs.png`
- `pipeline-running.png`
- `mcp-tools.png`

If possible, capture one screen showing artifact review or quality diagnostics and one showing system-level monitoring.

See [`../screenshots/CAPTURE_GUIDE.md`](../screenshots/CAPTURE_GUIDE.md) for the current capture list.
