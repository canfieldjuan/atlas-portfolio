'use client';

import { useId, useState } from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import Link from 'next/link';
import { clampToStep, computeQuickSupportTax } from '@/lib/support-tax-math';

const TICKET_VOLUME = { min: 100, max: 10000, step: 50, default: 1500 };
const COST_PER_TICKET = { min: 10, max: 30, step: 1, default: 15 };

const usd = (value: number) => `$${Math.round(value).toLocaleString()}`;
const count = (value: number) => Math.round(value).toLocaleString();

function MiniInput({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  prefix,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  prefix?: string;
}) {
  const id = useId();

  const commit = (input: HTMLInputElement) => {
    const parsed = Number(input.value);
    if (input.value.trim() !== '' && Number.isFinite(parsed)) {
      const nextValue = clampToStep(parsed, { min, max, step });
      onChange(nextValue);
      input.value = String(nextValue);
    } else {
      input.value = String(value);
    }
  };

  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label htmlFor={id} className="block">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="mt-1 block text-xs text-foreground/50">{hint}</span>
        </label>
        <div className="relative w-full sm:w-40">
          {prefix && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/45">
              {prefix}
            </span>
          )}
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            key={value}
            defaultValue={value}
            onBlur={(event) => commit(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className={`w-full rounded-lg border border-border bg-background px-3 py-2.5 text-right text-base font-semibold text-foreground outline-none transition focus:border-primary/70 focus:shadow-[0_0_0_4px_rgba(60,111,143,0.14)] ${prefix ? 'pl-7' : ''}`}
            aria-label={`${label} numeric input`}
          />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} slider`}
        style={{
          accentColor: 'var(--primary)',
          background: `linear-gradient(90deg, var(--primary) 0%, var(--primary) ${fill}%, rgba(23,35,31,0.12) ${fill}%, rgba(23,35,31,0.12) 100%)`,
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full"
      />
      <div className="flex justify-between text-xs font-medium text-foreground/42">
        <span>{prefix ? `${prefix}${min}` : count(min)}</span>
        <span>{prefix ? `${prefix}${max}` : count(max)}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-foreground/50">{detail}</p>
    </div>
  );
}

export function SupportTaxMiniCalculator() {
  const [ticketVolume, setTicketVolume] = useState(TICKET_VOLUME.default);
  const [costPerTicket, setCostPerTicket] = useState(COST_PER_TICKET.default);

  const {
    monthlyRepeatVolume,
    monthlyTax: monthlySupportTax,
    annualTax: annualSupportTax,
    monthlyHours: monthlyHoursWasted,
  } = computeQuickSupportTax({ monthlyTickets: ticketVolume, costPerTicket });

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_18px_50px_rgba(31,45,39,0.08)] sm:p-5 lg:p-6">
      <div className="mb-6 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
          <Calculator className="h-3.5 w-3.5" />
          30-Second Calculator
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          The Support Tax Calculator
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/62 sm:text-base">
          Estimate how much repeat Tier-1 work is quietly costing you each month, because your help center
          doesn&apos;t use the words your customers actually search with.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-xl border border-border bg-background/45 p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-foreground">Tune the inputs</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/52">
              Move the sliders or type exact numbers. The math updates as you go.
            </p>
          </div>

          <div className="space-y-6">
            <MiniInput
              label="Monthly Ticket Volume"
              hint="Range: 100 to 10,000 tickets"
              value={ticketVolume}
              min={TICKET_VOLUME.min}
              max={TICKET_VOLUME.max}
              step={TICKET_VOLUME.step}
              onChange={setTicketVolume}
            />
            <MiniInput
              label="Fully Loaded Cost per Tier-1 Ticket"
              hint="Range: $10 to $30 per ticket"
              value={costPerTicket}
              min={COST_PER_TICKET.min}
              max={COST_PER_TICKET.max}
              step={COST_PER_TICKET.step}
              onChange={setCostPerTicket}
              prefix="$"
            />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground">Industry average assumptions</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <StatCard label="Repeat tickets" value="40%" detail="Simple, repetitive Tier-1 how-to questions." />
              <StatCard label="Avg. touch time" value="12 min" detail="Equivalent to 0.2 support hours per ticket." />
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
                Your Monthly Support Tax
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Manual repeat tickets are not free.
              </h3>
            </div>
            <div className="w-fit rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-red-300">Repeat-ticket cost</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-red-300">
                {usd(monthlySupportTax)}/mo
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-red-300">
                Annual spend on repeat tickets
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums text-red-300 sm:text-5xl">
                  {usd(annualSupportTax)}
                </span>
                <span className="pb-1 text-sm font-semibold text-foreground/60">
                  / year on repeat questions
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                Monthly time sink
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">
                  {count(monthlyHoursWasted)}
                </span>
                <span className="pb-1 text-sm font-semibold text-foreground/60">
                  hours / month re-answering the same questions
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatCard label="Repeat volume" value={count(monthlyRepeatVolume)} detail="tickets / month" />
            <StatCard label="Monthly cost" value={usd(monthlySupportTax)} detail="spent on repeats" />
            <StatCard label="Modeled rate" value="40%" detail="repeat Tier-1" />
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface p-4">
            <h3 className="text-base font-semibold text-foreground">Why is this happening?</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/62">
              Because your help center speaks your product&apos;s language, but your customers speak their own.
              Your team loses hours re-answering questions because the FAQ doesn&apos;t use the{' '}
              <span className="font-semibold text-primary">words customers reach for</span> when they get stuck.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/systems/support-ticket-deflection/intake"
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-primary/90"
              aria-label="Start Your Forensic Audit"
            >
              Start Your Forensic Audit
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/systems/support-ticket-deflection/calculator"
              className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-center text-sm font-medium text-foreground transition hover:border-primary/45 hover:text-primary"
            >
              See the full calculator
            </Link>
          </div>

          <p className="mt-3 text-center text-xs leading-relaxed text-foreground/50">
            Deterministic parsing of your own ticket export. No AI guesswork, and you won&apos;t wait days for it.
          </p>
          <p className="mt-2 text-center text-xs leading-relaxed text-foreground/45">
            This sizes current spend. It is not a forecast of what the Resolution Audit will save.
          </p>
        </aside>
      </div>
    </section>
  );
}
