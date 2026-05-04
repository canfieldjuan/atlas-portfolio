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
// - GOOGLE_ADS_PERFORMANCE v1 / GA4_PERFORMANCE v1: source report artifacts
//   now advertise their own versions before the combiner can produce a funnel
//   artifact. Legacy unversioned reports must be regenerated instead of silently
//   feeding enablement readiness.
export const GOOGLE_ADS_ARTIFACT_VERSIONS = Object.freeze({
  PREFLIGHT: 2,
  CREATE_PAUSED: 3,
  STATUS: 2,
  READINESS: 2,
  ENABLE: 2,
  GOOGLE_ADS_PERFORMANCE: 1,
  GA4_PERFORMANCE: 1,
  ADVERTISING_FUNNEL: 1,
});

export const GOOGLE_ADS_ARTIFACT_TYPES = Object.freeze(
  Object.fromEntries(Object.keys(GOOGLE_ADS_ARTIFACT_VERSIONS).map((key) => [key, key])),
);

export const GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS = Object.freeze({
  GOOGLE_ADS_PERFORMANCE: 48,
  GA4_PERFORMANCE: 48,
  ADVERTISING_FUNNEL: 48,
});

const DEFAULT_FUTURE_SKEW_MINUTES = 5;

function versionForType(type) {
  if (!Object.prototype.hasOwnProperty.call(GOOGLE_ADS_ARTIFACT_VERSIONS, type)) {
    throw new Error(`Unknown Google Ads artifact type: ${type}`);
  }
  return GOOGLE_ADS_ARTIFACT_VERSIONS[type];
}

export function artifactVersionFields(type, options = {}) {
  const now = options.now || new Date();
  return {
    artifactVersion: versionForType(type),
    generatedAt: now.toISOString(),
  };
}

export function validateArtifactVersion(payload, label, type) {
  const expected = versionForType(type);
  if (payload?.artifactVersion !== expected) {
    return [`${label} artifactVersion must be ${expected}`];
  }
  return [];
}

function freshnessHoursForType(type) {
  if (!Object.prototype.hasOwnProperty.call(GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS, type)) {
    throw new Error(`No freshness window configured for Google Ads artifact type: ${type}`);
  }
  return GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS[type];
}

export function validateArtifactFreshness(payload, label, type, options = {}) {
  const maxAgeHours = options.maxAgeHours ?? freshnessHoursForType(type);
  const futureSkewMinutes = options.futureSkewMinutes ?? DEFAULT_FUTURE_SKEW_MINUTES;
  const now = options.now || new Date();
  const generatedAt = payload?.generatedAt;

  if (typeof generatedAt !== 'string' || generatedAt.trim() === '') {
    return [`${label} must include generatedAt`];
  }

  const generatedAtMs = Date.parse(generatedAt);
  if (!Number.isFinite(generatedAtMs)) {
    return [`${label} generatedAt must be a valid ISO timestamp`];
  }

  const nowMs = now.getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const futureSkewMs = futureSkewMinutes * 60 * 1000;

  if (generatedAtMs > nowMs + futureSkewMs) {
    return [`${label} generatedAt is in the future; check system clocks`];
  }
  if (nowMs - generatedAtMs > maxAgeMs) {
    return [`${label} generatedAt is older than ${maxAgeHours} hours; regenerate the artifact`];
  }
  return [];
}
