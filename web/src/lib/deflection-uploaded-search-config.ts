function clean(value: string | undefined) {
  return value?.trim() ?? '';
}

export function uploadedDeflectionSearchEnabled(env: NodeJS.ProcessEnv = process.env) {
  const flag = clean(env.DEFLECTION_UPLOADED_SEARCH_ENABLED).toLowerCase();
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  return Boolean(clean(env.ATLAS_API_BASE_URL) && clean(env.ATLAS_B2B_SERVICE_TOKEN));
}
