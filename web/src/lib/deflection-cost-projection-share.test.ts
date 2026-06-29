import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { DEMO_DEFLECTION_SNAPSHOT } from './deflection-demo-example';

describe('deflection cost projection sharing guard', () => {
  it('keeps the shared Support Tax projection wired across Snapshot surfaces', async () => {
    const [
      projectionSource,
      resultsSource,
      landingSource,
      snapshotSource,
    ] = await Promise.all([
      readFile(new URL('../components/landing/DeflectionSupportTaxProjection.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/landing/DeflectionResultsPage.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/landing/DeflectionSnapshotLandingPage.tsx', import.meta.url), 'utf8'),
      readFile(new URL('./deflection-snapshot.ts', import.meta.url), 'utf8'),
    ]);

    const snapshotArtifactIndex = landingSource.indexOf('function SnapshotArtifact');
    const projectionMarkerIndex = landingSource.indexOf(
      'data-smoke="supportTaxProjection assistedContactCost valueAnchor"',
      snapshotArtifactIndex,
    );
    const topResolutionsIndex = landingSource.indexOf('Top Proven Resolutions', snapshotArtifactIndex);

    expect(projectionSource).toContain('export function DeflectionSupportTaxProjection');
    expect(projectionSource).toContain('Assisted-contact cost slider');
    expect(projectionSource).toContain('30-day pace');
    expect(projectionSource).toContain('12-month run-rate');
    expect(projectionSource).toContain('3-year run-rate');
    expect(projectionSource).toContain('valueAnchor');

    for (const [label, source] of [
      ['results page', resultsSource],
      ['snapshot landing page', landingSource],
    ]) {
      expect(source, `${label} should import the shared projection.`).toContain(
        "import { DeflectionSupportTaxProjection } from './DeflectionSupportTaxProjection';",
      );
      expect(source, `${label} should render the shared projection.`).toContain(
        '<DeflectionSupportTaxProjection',
      );
    }

    expect(resultsSource).not.toMatch(/function\s+SupportTaxProjection/);
    expect(landingSource).not.toContain('Annualized pace');
    expect(landingSource).not.toContain('Snapshot action');
    expect(landingSource).toContain('const [assistedContactCost, setAssistedContactCost] = useState');
    expect(landingSource).toContain('DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD');
    expect(landingSource).toContain('assistedContactCost={assistedContactCost}');
    expect(landingSource).toContain('onAssistedContactCostChange={setAssistedContactCost}');
    expect(landingSource).not.toContain('function CostProofBand');
    expect(snapshotArtifactIndex).toBeGreaterThanOrEqual(0);
    expect(projectionMarkerIndex).toBeGreaterThanOrEqual(0);
    expect(topResolutionsIndex).toBeGreaterThanOrEqual(0);
    expect(projectionMarkerIndex).toBeLessThan(topResolutionsIndex);
    expect(landingSource).toContain('function snapshotCostBasisLabel');
    expect(landingSource).toContain("'At the Gartner benchmark'");
    expect(landingSource).toContain(
      'At your selected ${formatAssistedContactCost(assistedContactCost)} per assisted contact',
    );
    expect(landingSource).toContain('valueAnchor={snapshotValueAnchor(snapshot, assistedContactCost)}');
    expect(landingSource).toContain('a queue this size runs about');
    expect(landingSource).toContain('answering the same repeat questions by hand');
    expect(snapshotSource).toContain("from './deflection-demo-example'");

    expect(DEMO_DEFLECTION_SNAPSHOT.summary.repeat_ticket_count).toBeGreaterThanOrEqual(300);
    expect(DEMO_DEFLECTION_SNAPSHOT.top_questions[0]?.ticket_count).toBeGreaterThanOrEqual(90);
    expect(DEMO_DEFLECTION_SNAPSHOT.top_questions[0]?.weighted_frequency).toBe(
      DEMO_DEFLECTION_SNAPSHOT.top_questions[0]?.ticket_count,
    );
  });
});
