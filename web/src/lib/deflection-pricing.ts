export const DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD = 13.5;
export const DEFLECTION_SELF_SERVICE_BENCHMARK_USD = 1.84;
export const DEFLECTION_ASSISTED_CONTACT_DELTA_USD =
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD - DEFLECTION_SELF_SERVICE_BENCHMARK_USD;
export const DEFLECTION_FULL_REPORT_PRICE_USD = 1500;
export const DEFLECTION_FULL_REPORT_PRICE_CENTS =
  DEFLECTION_FULL_REPORT_PRICE_USD * 100;

const wholeUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const benchmarkUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDeflectionWholeUsd(value: number) {
  return wholeUsdFormatter.format(value);
}

export function formatDeflectionBenchmarkUsd(value: number) {
  return benchmarkUsdFormatter.format(value);
}

export const DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL =
  formatDeflectionBenchmarkUsd(DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD);
export const DEFLECTION_SELF_SERVICE_BENCHMARK_LABEL =
  formatDeflectionBenchmarkUsd(DEFLECTION_SELF_SERVICE_BENCHMARK_USD);
export const DEFLECTION_ASSISTED_CONTACT_DELTA_LABEL =
  formatDeflectionBenchmarkUsd(DEFLECTION_ASSISTED_CONTACT_DELTA_USD);
export const DEFLECTION_FULL_REPORT_PRICE_LABEL = formatDeflectionWholeUsd(
  DEFLECTION_FULL_REPORT_PRICE_USD,
);
export const DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL = `Free snapshot · ${DEFLECTION_FULL_REPORT_PRICE_LABEL} full report`;
