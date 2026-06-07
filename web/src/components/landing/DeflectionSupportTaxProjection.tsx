'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import type { DeflectionSnapshotSourceWindow } from '@/lib/deflection-snapshot';
import {
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL,
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
} from '@/lib/deflection-pricing';

const ASSISTED_CONTACT_COST_MIN = 5;
const ASSISTED_CONTACT_COST_MAX = 75;
const ASSISTED_CONTACT_COST_STEP = 0.5;

type ProjectionAction =
  | {
      kind: 'button';
      label: string;
      onClick: () => void;
      disabled?: boolean;
      busy?: boolean;
      helper?: string;
    }
  | {
      kind: 'link';
      label: string;
      href: string;
      helper?: string;
    };

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function usd(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function count(value: number) {
  return Math.round(value).toLocaleString();
}

function costLabel(value: number) {
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function formatSourceDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatSourceWindow(window: DeflectionSnapshotSourceWindow) {
  return `${formatSourceDate(window.source_date_start)} to ${formatSourceDate(window.source_date_end)} (${count(window.source_window_days)} days)`;
}

function ProjectionMetric({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        highlight
          ? 'border-primary/40 bg-primary/[0.03] shadow-[var(--primary-glow-tight)]'
          : 'border-border bg-surface shadow-[0_4px_20px_rgba(23,35,31,0.02)] hover:border-primary/20'
      }`}
    >
      <div
        className={`text-[10px] font-mono uppercase tracking-widest ${
          highlight ? 'font-semibold text-primary' : 'text-foreground/50'
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight md:text-3xl ${
          highlight ? 'text-primary-dark' : 'text-foreground'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-foreground/55">{sub}</div>
    </div>
  );
}

function ProjectionActionButton({ action }: { action: ProjectionAction }) {
  if (action.kind === 'link') {
    return (
      <Link
        href={action.href}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/45"
      >
        {action.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      aria-busy={action.busy}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/45 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {action.label}
      {!action.busy && !action.disabled && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function DeflectionSupportTaxProjection({
  repeatTicketCount,
  assistedContactCost,
  sourceWindow,
  onAssistedContactCostChange,
  action,
  subjectLabel = 'Your uploaded repeat tickets',
  className = '',
}: {
  repeatTicketCount: number;
  assistedContactCost?: number;
  sourceWindow?: DeflectionSnapshotSourceWindow;
  onAssistedContactCostChange?: (value: number) => void;
  action: ProjectionAction;
  subjectLabel?: string;
  className?: string;
}) {
  const [internalAssistedContactCost, setInternalAssistedContactCost] = useState(
    DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  );
  const currentCost = assistedContactCost ?? internalAssistedContactCost;
  const batchCost = repeatTicketCount * currentCost;
  const normalizedWindow = sourceWindow
    ? {
        dailyCost: batchCost / sourceWindow.source_window_days,
        days: sourceWindow.source_window_days,
      }
    : null;
  const annualRunRate = normalizedWindow === null ? batchCost * 12 : normalizedWindow.dailyCost * 365;
  const threeYearRunRate = normalizedWindow === null ? batchCost * 36 : normalizedWindow.dailyCost * 365 * 3;
  const windowLabel = sourceWindow ? formatSourceWindow(sourceWindow) : null;
  const commitCost = (value: number) => {
    if (!Number.isFinite(value)) return;
    const nextCost = clamp(value, ASSISTED_CONTACT_COST_MIN, ASSISTED_CONTACT_COST_MAX);
    if (onAssistedContactCostChange) {
      onAssistedContactCostChange(nextCost);
      return;
    }
    setInternalAssistedContactCost(nextCost);
  };

  return (
    <section
      className={`rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 shadow-[var(--primary-glow)] ${className}`}
      aria-labelledby="support-tax-heading"
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
            Support Tax projection
          </p>
          <h2 id="support-tax-heading" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {subjectLabel} size up to {usd(batchCost)} of assisted-contact work.
          </h2>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/65">
        ATLAS counted <strong className="text-foreground">{count(repeatTicketCount)}</strong>{' '}
        repeat-ticket hits {windowLabel ? `from ${windowLabel}` : 'in this snapshot'}. The
        estimate below multiplies that measured count by a configurable assisted-contact
        benchmark, defaulting to Gartner&apos;s{' '}
        <strong className="text-foreground">
          {DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL}
        </strong>{' '}
        assisted-contact figure used elsewhere on this page.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <label htmlFor="assisted-contact-cost" className="text-sm font-medium text-foreground">
              Assisted-contact cost
            </label>
            <p className="mt-1 text-xs text-foreground/45">
              Adjust this if your loaded cost per repeat ticket is higher or lower.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-foreground/50">$</span>
            <input
              id="assisted-contact-cost"
              type="number"
              inputMode="decimal"
              min={ASSISTED_CONTACT_COST_MIN}
              max={ASSISTED_CONTACT_COST_MAX}
              step={ASSISTED_CONTACT_COST_STEP}
              value={currentCost}
              onChange={(event) => commitCost(Number(event.target.value))}
              className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary/60"
            />
          </div>
        </div>
        <input
          type="range"
          min={ASSISTED_CONTACT_COST_MIN}
          max={ASSISTED_CONTACT_COST_MAX}
          step={ASSISTED_CONTACT_COST_STEP}
          value={currentCost}
          onChange={(event) => commitCost(Number(event.target.value))}
          aria-label="Assisted-contact cost slider"
          style={{ accentColor: 'var(--primary)' }}
          className="w-full cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[10px] font-mono text-foreground/40">
          <span>${ASSISTED_CONTACT_COST_MIN}</span>
          <span>{costLabel(currentCost)} / assisted contact</span>
          <span>${ASSISTED_CONTACT_COST_MAX}</span>
        </div>
      </div>

      <div className={sourceWindow ? 'mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4' : 'mt-5 grid gap-4 md:grid-cols-3'}>
        <ProjectionMetric
          label={sourceWindow ? 'Uploaded window' : 'Uploaded batch'}
          value={usd(batchCost)}
          sub={windowLabel ?? `${count(repeatTicketCount)} repeat tickets`}
        />
        {normalizedWindow !== null && (
          <ProjectionMetric
            label="30-day pace"
            value={usd(normalizedWindow.dailyCost * 30)}
            sub={`normalized from ${count(normalizedWindow.days)} source days`}
          />
        )}
        <ProjectionMetric
          label="12-month run-rate"
          value={usd(annualRunRate)}
          sub={normalizedWindow === null ? 'if this batch is monthly pace' : 'same measured daily pace'}
          highlight
        />
        <ProjectionMetric
          label="3-year run-rate"
          value={usd(threeYearRunRate)}
          sub="same pace, no reduction"
        />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <ProjectionActionButton action={action} />
        {action.helper && (
          <span className="inline-flex items-center gap-2 text-xs text-foreground/50 sm:max-w-xs">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            {action.helper}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/45">
        {sourceWindow
          ? 'Estimate only. These run-rate rows normalize from the verified source window ATLAS returned; they are not savings guarantees.'
          : 'Estimate only. This sizes the repeat work visible in your uploaded data; it is not a savings guarantee and should be adjusted to your actual reporting window.'}
      </p>
    </section>
  );
}
