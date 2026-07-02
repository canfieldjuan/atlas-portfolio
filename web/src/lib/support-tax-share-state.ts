import { clampToStep, type StepRange } from '@/lib/support-tax-math';

// URL share state for the 30-second support-tax calculator
// (/systems/support-ticket-deflection/support-tax). Slider state round-trips
// through short query params so a configured result can be pasted into a
// thread; defaults are omitted so the bare URL stays canonical.

export interface SupportTaxInputRange extends StepRange {
  default: number;
}

export const SUPPORT_TAX_INPUTS: Record<
  'monthlyTickets' | 'costPerTicket' | 'repeatPct' | 'touchMinutes',
  SupportTaxInputRange
> = {
  monthlyTickets: { min: 100, max: 10000, step: 50, default: 1500 },
  costPerTicket: { min: 10, max: 30, step: 1, default: 15 },
  // Same 10-70% band as the leaky-bucket calculator's repeat-share input.
  repeatPct: { min: 10, max: 70, step: 1, default: 40 },
  touchMinutes: { min: 2, max: 60, step: 1, default: 12 },
};

export interface SupportTaxShareState {
  monthlyTickets: number;
  costPerTicket: number;
  repeatPct: number;
  touchMinutes: number;
}

const PARAM_KEYS: Record<keyof SupportTaxShareState, string> = {
  monthlyTickets: 'v',
  costPerTicket: 'c',
  repeatPct: 'r',
  touchMinutes: 't',
};

// Accepts URLSearchParams or Next's read-only wrapper.
interface QueryParamsLike {
  get(name: string): string | null;
}

function parseParam(params: QueryParamsLike, key: keyof SupportTaxShareState): number {
  const range = SUPPORT_TAX_INPUTS[key];
  const raw = params.get(PARAM_KEYS[key]);
  if (raw === null || raw.trim() === '') return range.default;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return range.default;
  return clampToStep(parsed, range);
}

export function parseSupportTaxShareState(params: QueryParamsLike): SupportTaxShareState {
  return {
    monthlyTickets: parseParam(params, 'monthlyTickets'),
    costPerTicket: parseParam(params, 'costPerTicket'),
    repeatPct: parseParam(params, 'repeatPct'),
    touchMinutes: parseParam(params, 'touchMinutes'),
  };
}

export function buildSupportTaxShareQuery(state: SupportTaxShareState): string {
  return mergeSupportTaxShareQuery('', state);
}

// Writes the calculator-owned keys into an existing query string without
// touching foreign params (utm_*, experiment ids, ...), so attributed traffic
// keeps its campaign params when the calculator mirrors state into the URL.
// Default-valued keys are removed so the bare URL stays canonical.
export function mergeSupportTaxShareQuery(
  currentSearch: string,
  state: SupportTaxShareState,
): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of Object.keys(PARAM_KEYS) as Array<keyof SupportTaxShareState>) {
    const range = SUPPORT_TAX_INPUTS[key];
    const value = clampToStep(state[key], range);
    if (value !== range.default) params.set(PARAM_KEYS[key], String(value));
    else params.delete(PARAM_KEYS[key]);
  }
  return params.toString();
}

export const SUPPORT_TAX_ROUTE = '/systems/support-ticket-deflection/support-tax';

// Share-state params are calculator UI state, not navigation: page-view
// tracking strips them (on this route only) so slider movement never counts
// as traffic, while utm_*/campaign params stay in the tracked path.
export function stripSupportTaxShareParams(pathname: string, query: string): string {
  if (pathname !== SUPPORT_TAX_ROUTE || !query) return query;
  const params = new URLSearchParams(query);
  for (const key of Object.values(PARAM_KEYS)) params.delete(key);
  return params.toString();
}
