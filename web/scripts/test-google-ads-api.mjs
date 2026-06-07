import assert from 'node:assert/strict';
import { googleAdsSearch } from './google-ads-api.mjs';

// Minimal fetch double: enqueue responses, drain on each call. Each entry is the JSON
// body the next call should resolve with. Captures request bodies so the test can
// assert the pageToken propagation.
function createFetchDouble(responses) {
  const seen = [];
  const remaining = responses.slice();
  globalThis.fetch = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    seen.push({ url, body });
    if (remaining.length === 0) {
      throw new Error(`Unexpected extra fetch call (${seen.length}); url=${url}`);
    }
    const next = remaining.shift();
    return {
      ok: next.ok ?? true,
      status: next.status ?? 200,
      json: async () => next.json,
      text: async () => JSON.stringify(next.json ?? {}),
    };
  };
  return {
    seen,
    assertDrained() {
      assert.equal(remaining.length, 0, `Expected fetch double to be drained; ${remaining.length} responses unused`);
    },
  };
}

function teardown() {
  delete globalThis.fetch;
}

async function testMultiPageAggregation() {
  const fetchDouble = createFetchDouble([
    { json: { results: [{ campaign: { id: '1' } }, { campaign: { id: '2' } }], nextPageToken: 'tok-page-2' } },
    { json: { results: [{ campaign: { id: '3' } }], nextPageToken: 'tok-page-3' } },
    { json: { results: [{ campaign: { id: '4' } }] } }, // no nextPageToken — terminate
  ]);

  const results = await googleAdsSearch('access', 'v22', '1234567890', 'SELECT campaign.id FROM campaign', {
    pageSize: 2,
  });

  assert.equal(results.length, 4, 'all rows across pages should be aggregated');
  assert.deepEqual(
    results.map((row) => row.campaign.id),
    ['1', '2', '3', '4'],
  );
  assert.equal(fetchDouble.seen.length, 3, 'should follow nextPageToken until it stops appearing');
  // First page must NOT carry a pageToken.
  assert.equal('pageToken' in fetchDouble.seen[0].body, false);
  // Subsequent pages must carry the token returned by the previous response.
  assert.equal(fetchDouble.seen[1].body.pageToken, 'tok-page-2');
  assert.equal(fetchDouble.seen[2].body.pageToken, 'tok-page-3');
  // v22 dropped pageSize support; callers may still pass the compatibility
  // option, but googleAdsSearch must not send the deprecated request field.
  for (const call of fetchDouble.seen) {
    assert.equal('pageSize' in call.body, false);
  }
  fetchDouble.assertDrained();
  teardown();
}

async function testIdenticalNextPageTokenThrows() {
  // Defensive: if the API ever returns the same token it received, the function
  // must FAIL CLOSED rather than silently return whatever rows it accumulated so
  // far. Returning would re-introduce the silent truncation bug this loop is here
  // to eliminate.
  const fetchDouble = createFetchDouble([
    { json: { results: [{ campaign: { id: '1' } }], nextPageToken: 'same-token' } },
    { json: { results: [{ campaign: { id: '2' } }], nextPageToken: 'same-token' } },
  ]);

  await assert.rejects(
    googleAdsSearch('access', 'v22', '1234567890', 'SELECT campaign.id FROM campaign', {
      pageSize: 1,
      errorLabel: 'token-loop test',
    }),
    /returned the same nextPageToken twice in a row/,
  );
  fetchDouble.assertDrained();
  assert.equal(fetchDouble.seen.length, 2, 'should detect the repeat after the second response');
  teardown();
}

async function testMaxPagesCap() {
  // Build a fetch double that returns a fresh nextPageToken indefinitely. With
  // maxPages=3 the call must throw on the third page rather than continue.
  const responses = Array.from({ length: 3 }, (_, index) => ({
    json: { results: [{ campaign: { id: String(index + 1) } }], nextPageToken: `tok-${index + 2}` },
  }));
  const fetchDouble = createFetchDouble(responses);

  await assert.rejects(
    googleAdsSearch('access', 'v22', '1234567890', 'SELECT campaign.id FROM campaign', {
      pageSize: 1,
      maxPages: 3,
    }),
    /exceeded the 3-page safety cap/,
  );

  // The cap fires AFTER the third page response is consumed, so all three should be drained.
  fetchDouble.assertDrained();
  assert.equal(fetchDouble.seen.length, 3, 'should fetch up to maxPages before throwing');
  teardown();
}

async function testFailedResponsePropagates() {
  // Sanity check: HTTP error on first page surfaces as a thrown error, not silent truncation.
  const fetchDouble = createFetchDouble([
    { ok: false, status: 503, json: { error: { status: 'UNAVAILABLE', message: 'service unavailable' } } },
  ]);

  await assert.rejects(
    googleAdsSearch('access', 'v22', '1234567890', 'SELECT campaign.id FROM campaign', {
      pageSize: 1,
      errorLabel: 'unit-test search',
    }),
    /unit-test search failed \(503\)/,
  );
  fetchDouble.assertDrained();
  teardown();
}

async function main() {
  await testMultiPageAggregation();
  await testIdenticalNextPageTokenThrows();
  await testMaxPagesCap();
  await testFailedResponsePropagates();
  console.log('Google Ads API pagination tests passed.');
}

main().catch((error) => {
  teardown();
  console.error(error);
  process.exit(1);
});
