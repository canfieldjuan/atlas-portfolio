export function jsonLdScriptPayload(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
