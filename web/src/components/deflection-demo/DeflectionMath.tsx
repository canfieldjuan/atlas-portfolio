import { Banknote, PiggyBank, ShieldCheck, Ticket } from 'lucide-react';
import { estimateDeflectionTotals } from '@/lib/deflection-demo';

// Static, server-rendered "the math" section: aggregate sample totals from
// `estimateDeflectionTotals` (the same illustrative dataset the search uses, so
// these can't drift from the per-search numbers). Monthly framing, to match the
// per-issue volume block. Labelled illustrative in the UI — not a guaranteed result.

export function DeflectionMath() {
  const totals = estimateDeflectionTotals();
  const metrics: { icon: typeof Ticket; tone: 'cost' | 'primary'; value: string; label: string; sub: string }[] = [
    {
      icon: Ticket,
      tone: 'cost',
      value: totals.ticketsPerMonth.toLocaleString(),
      label: 'Tickets / mo',
      sub: 'Across the sample issues',
    },
    {
      icon: Banknote,
      tone: 'cost',
      value: `$${totals.monthlyCost.toLocaleString()}`,
      label: 'Current cost / mo',
      sub: 'Agent time on repeat questions',
    },
    {
      icon: ShieldCheck,
      tone: 'primary',
      value: `~${totals.deflectedPerMonth.toLocaleString()}`,
      label: 'Could self-serve / mo',
      sub: 'Questions a good FAQ answers',
    },
    {
      icon: PiggyBank,
      tone: 'primary',
      value: `~$${totals.monthlySavings.toLocaleString()}`,
      label: 'Potential savings / mo',
      sub: 'At the sample cost per ticket',
    },
  ];

  return (
    <section>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono uppercase tracking-widest">
          Across the sample issues in this demo · illustrative
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mt-4">
          Same help desk. A fraction of the cost.
        </h2>
        <p className="text-foreground/60 leading-relaxed mt-2 max-w-xl">
          Your agents still handle the hard problems. The Report just stops the same easy
          questions from becoming tickets in the first place.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ icon: Icon, tone, value, label, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <Icon className={`w-5 h-5 mb-4 ${tone === 'primary' ? 'text-primary' : 'text-foreground/40'}`} />
            <div className={`text-2xl font-semibold tabular-nums ${tone === 'primary' ? 'text-primary' : 'text-foreground'}`}>
              {value}
            </div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mt-1">{label}</div>
            <p className="text-xs text-foreground/45 mt-2 leading-relaxed">{sub}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-foreground/45 leading-relaxed">
        Illustrative, from a public complaint dataset — not a guaranteed result. The Report ranks{' '}
        <em>your</em> repeat questions by real volume and drafts answers your team reviews.
      </p>
    </section>
  );
}
