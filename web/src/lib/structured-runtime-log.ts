export type StructuredRuntimeLogFields = Record<string, unknown>;

const SENSITIVE_KEY_RE =
  /(authorization|cookie|password|secret|token|api[_-]?key|stripe[_-]?key|bearer|session)/i;
const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 50;

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Error) {
    return {
      name: value.name,
    };
  }
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return '[MaxDepth]';
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeLogValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    let count = 0;
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (count >= MAX_OBJECT_KEYS) {
        sanitized.truncated = true;
        break;
      }
      count += 1;
      if (SENSITIVE_KEY_RE.test(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      const safeValue = sanitizeLogValue(nested, depth + 1);
      if (safeValue !== undefined) sanitized[key] = safeValue;
    }
    return sanitized;
  }
  return String(value);
}

function sanitizeLogFields(fields: StructuredRuntimeLogFields | undefined) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (SENSITIVE_KEY_RE.test(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    const safeValue = sanitizeLogValue(value);
    if (safeValue !== undefined) sanitized[key] = safeValue;
  }
  return sanitized;
}

export function structuredRuntimeError(
  event: string,
  fields?: StructuredRuntimeLogFields,
) {
  console.error(JSON.stringify({
    level: 'error',
    event,
    timestamp: new Date().toISOString(),
    ...sanitizeLogFields(fields),
  }));
}
