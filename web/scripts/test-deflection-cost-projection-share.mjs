import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const webRoot = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(webRoot, path), 'utf8');

const projectionSource = read('src/components/landing/DeflectionSupportTaxProjection.tsx');
const resultsSource = read('src/components/landing/DeflectionResultsPage.tsx');
const landingSource = read('src/components/landing/DeflectionSnapshotLandingPage.tsx');

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
    landingSource.includes('assistedContactCost={assistedContactCost}') &&
    landingSource.includes('onAssistedContactCostChange={setAssistedContactCost}'),
  'Snapshot landing preview should share one assisted-contact cost state with the projection.',
);

console.log('Deflection cost projection sharing guard passed.');
