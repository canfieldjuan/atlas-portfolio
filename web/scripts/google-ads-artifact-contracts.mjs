// v2: create-paused result records `campaign.id` (parsed from the API resourceName);
//     readiness validates that statusResult campaign.id matches createResult campaign.id;
//     enable looks up the campaign by resource name (constructed from the configured
//     customer ID + readiness campaignId), not by name with LIMIT 1, so a campaign
//     name collision within the same account cannot resolve to the wrong campaign.
export const GOOGLE_ADS_ARTIFACT_VERSION = 2;

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
