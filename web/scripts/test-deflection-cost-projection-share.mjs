import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const webRoot = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(webRoot, path), 'utf8');

const projectionSource = read('src/components/landing/DeflectionSupportTaxProjection.tsx');
const resultsSource = read('src/components/landing/DeflectionResultsPage.tsx');
const landingSource = read('src/components/landing/DeflectionSnapshotLandingPage.tsx');
const snapshotSource = read('src/lib/deflection-snapshot.ts');
const snapshotArtifactIndex = landingSource.indexOf('function SnapshotArtifact');
const projectionMarkerIndex = landingSource.indexOf(
  'data-smoke="supportTaxProjection assistedContactCost valueAnchor"',
  snapshotArtifactIndex,
);
const topResolutionsIndex = landingSource.indexOf('Top Proven Resolutions', snapshotArtifactIndex);

assert(
  projectionSource.includes('export function DeflectionSupportTaxProjection'),
  'Shared Support Tax projection component should be exported.',
);
assert(
  projectionSource.includes('Assisted-contact cost slider') &&
    projectionSource.includes('30-day pace') &&
    projectionSource.includes('12-month run-rate') &&
    projectionSource.includes('3-year run-rate'),
  'Shared projection should own the slider and production run-rate labels.',
);
assert(
  projectionSource.includes('valueAnchor'),
  'Shared projection should own the value-anchor copy hook.',
);

for (const [label, source] of [
  ['results page', resultsSource],
  ['snapshot landing page', landingSource],
]) {
  assert(
    source.includes("import { DeflectionSupportTaxProjection } from './DeflectionSupportTaxProjection';"),
    `${label} should import the shared projection.`,
  );
  assert(
    source.includes('<DeflectionSupportTaxProjection'),
    `${label} should render the shared projection.`,
  );
}

assert(
  !/function\s+SupportTaxProjection/.test(resultsSource),
  'Results page should not reintroduce a local SupportTaxProjection component.',
);
assert(
  !landingSource.includes('Annualized pace') && !landingSource.includes('Snapshot action'),
  'Snapshot landing page should not reintroduce the old fixed cost-band metric labels.',
);
assert(
  landingSource.includes('const [assistedContactCost, setAssistedContactCost] = useState') &&
    landingSource.includes('DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD') &&
    landingSource.includes('assistedContactCost={assistedContactCost}') &&
    landingSource.includes('onAssistedContactCostChange={setAssistedContactCost}'),
  'Snapshot landing preview should share one assisted-contact cost state with the projection.',
);
assert.equal(
  landingSource.includes('function CostProofBand'),
  false,
  'Snapshot landing page should not render the Support Tax projection as a separate post-Snapshot band.',
);
assert(
  snapshotArtifactIndex !== -1 &&
    projectionMarkerIndex !== -1 &&
    topResolutionsIndex !== -1 &&
    projectionMarkerIndex < topResolutionsIndex,
  'Snapshot artifact should render the Support Tax projection inside the artifact before the resolution rows.',
);
assert(
  landingSource.includes('function snapshotCostBasisLabel') &&
    landingSource.includes("'At the Gartner benchmark'") &&
    landingSource.includes('At your selected ${formatAssistedContactCost(assistedContactCost)} per assisted contact') &&
    landingSource.includes('valueAnchor={snapshotValueAnchor(snapshot, assistedContactCost)}') &&
    landingSource.includes('a queue this size runs about') &&
    landingSource.includes('answering the same repeat questions by hand'),
  'Snapshot landing page should bridge the higher-volume representative sample to the cost value frame without mislabeling slider-adjusted costs as the Gartner benchmark.',
);
assert(
  snapshotSource.includes('repeat_ticket_count: 1700') &&
    snapshotSource.includes('ticket_count: 310') &&
    snapshotSource.includes('source_count: 310'),
  'Representative snapshot fixture should use higher support volume while keeping the benchmark contact-cost default.',
);

console.log('Deflection cost projection sharing guard passed.');
