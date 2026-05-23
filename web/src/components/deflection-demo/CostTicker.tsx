import { Clock, DollarSign, Repeat, Ticket, TrendingUp, UserRound } from 'lucide-react';

// Static, server-rendered strip of illustrative support economics. These set
// context for the demo below; they are typical industry figures, not a promise.
// The GLM source's "Clarify avg. deflection rate: 58%" claim is intentionally
// dropped — the offer makes no guaranteed deflection rate.

const COST_FACTS: { icon: typeof Ticket; label: string; value: string }[] = [
  { icon: Ticket, label: 'Cost to resolve one ticket', value: '~$12–16' },
  { icon: UserRound, label: 'Blended agent hourly cost', value: '~$22' },
  { icon: Clock, label: 'Common first-response time', value: '4+ hrs' },
  { icon: Repeat, label: 'Repeat questions, share of volume', value: 'often a majority' },
  { icon: TrendingUp, label: 'Industry self-service deflection', value: '~20–30%' },
];

export function CostTicker() {
  return (
    <div className="glass rounded-2xl border border-border px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          What support tickets cost · illustrative
        </span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {COST_FACTS.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-foreground/40 shrink-0" />
            <span className="text-sm text-foreground/60">{label}</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
