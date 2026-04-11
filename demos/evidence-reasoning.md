# Demo: Evidence Explorer & Reasoning Transparency

This demo shows how ATLAS makes AI reasoning transparent and auditable. Every claim has a witness, every witness has a source, and every reasoning step is traceable.

## Why This Demo Matters

- Most AI systems are black boxes. ATLAS shows its work — from raw review text through witness extraction to reasoning synthesis.
- This is the trust layer that makes the intelligence actionable. Sales teams won't act on signals they can't verify.
- It demonstrates a production pattern for grounded AI: deterministic evidence pools as the canonical intermediate layer between raw data and downstream artifacts.

## What You'll See

### Witnesses Tab
- Individual evidence excerpts extracted from reviews, each tagged with:
  - Witness type (pain point, displacement, strength, pricing, churn intent)
  - Source (G2, Capterra, Reddit, Gartner, TrustRadius, etc.)
  - Signal tags (explicit dollar mention, workflow substitution, active migration)
  - Salience and specificity scores
- Faceted filtering by pain category, source, and witness type
- Click any witness to see full review context in the Evidence Drawer

### Evidence Vault Tab
- Aggregated weakness and strength claims per vendor
- Each claim shows: label, mention count, confidence score, best supporting quote, trend direction, and affected roles/segments
- Metric snapshot with review counts and signal distribution
- This is the deterministic evidence pool that feeds battle cards, reports, and campaigns

### Reasoning Trace Tab
- Full provenance chain: what the system synthesized, what evidence it used, and how the reasoning evolved
- Evidence diff showing confirmed, contradicted, novel, and missing signals between reasoning runs
- Synthesis metadata and validation status

## Screenshots

| | |
|---|---|
| ![Witnesses](../screenshots/screenshot-evidence-witnesses.png) | ![Vault](../screenshots/screenshot-evidence-vault.png) |
| Witness excerpts with signal tags | Evidence vault with weakness/strength claims |
| ![Trace](../screenshots/screenshot-evidence-reasoning-trace.png) | |
| Reasoning trace with evidence diff | |

## Demo

![Demo](../recordings/gifs/evidence-explorer-demo.gif)

## What To Notice

- The three tabs represent three levels of abstraction: raw evidence (witnesses), aggregated claims (vault), and synthesized reasoning (trace)
- Every downstream artifact — battle cards, campaigns, reports — pulls from the same evidence vault, ensuring consistency
- The "View reports" link connects evidence directly to the intelligence reports that cite it
