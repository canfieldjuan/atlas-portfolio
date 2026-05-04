// Per-artifact version map. Bump only the type whose producer schema actually
// changed; everything else keeps its current version so unrelated artifacts (e.g.
// preflight, status) are not invalidated by a tightening that only affects one type.
//
// History:
// - CREATE_PAUSED v2: success artifact records `campaign.id` (PR #28)
// - CREATE_PAUSED v3: `preflightResult` is an embedded provenance object
//   (`{ path, ok, targetCustomerFingerprint, apiVersion }`) instead of a path string,
//   so the readiness gate can verify the create result was produced from a preflight
//   run against the same customer (PR #29)
// - ADVERTISING_FUNNEL v1: introducing versioning + required `campaignId`. Funnel
//   reports produced before this change do not advertise a version and are rejected
//   on purpose — they can also lack `campaignId`, which the readiness gate requires
//   to defend against duplicate-name campaign collisions (PR #29)
export const GOOGLE_ADS_ARTIFACT_VERSIONS = Object.freeze({
  PREFLIGHT: 2,
  CREATE_PAUSED: 3,
  STATUS: 2,
  READINESS: 2,
  ENABLE: 2,
  ADVERTISING_FUNNEL: 1,
});

export const GOOGLE_ADS_ARTIFACT_TYPES = Object.freeze(
  Object.fromEntries(Object.keys(GOOGLE_ADS_ARTIFACT_VERSIONS).map((key) => [key, key])),
);

function versionForType(type) {
  if (!Object.prototype.hasOwnProperty.call(GOOGLE_ADS_ARTIFACT_VERSIONS, type)) {
    throw new Error(`Unknown Google Ads artifact type: ${type}`);
  }
  return GOOGLE_ADS_ARTIFACT_VERSIONS[type];
}

export function artifactVersionFields(type) {
  return {
    artifactVersion: versionForType(type),
  };
}

export function validateArtifactVersion(payload, label, type) {
  const expected = versionForType(type);
  if (payload?.artifactVersion !== expected) {
    return [`${label} artifactVersion must be ${expected}`];
  }
  return [];
}
