export const GOOGLE_ADS_ARTIFACT_VERSION = 1;

export function artifactVersionFields() {
  return {
    artifactVersion: GOOGLE_ADS_ARTIFACT_VERSION,
  };
}

export function validateArtifactVersion(payload, label) {
  if (payload?.artifactVersion !== GOOGLE_ADS_ARTIFACT_VERSION) {
    return [`${label} artifactVersion must be ${GOOGLE_ADS_ARTIFACT_VERSION}`];
  }
  return [];
}
