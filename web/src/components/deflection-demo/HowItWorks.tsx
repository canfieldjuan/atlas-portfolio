import { FileDown, PenLine, TrendingDown } from 'lucide-react';

// Static, server-rendered "how it works" section, re-voiced to the Report offer:
// a CSV analysis you act on, not an integration or managed service. Dropped from
// the GLM source: the desk vendor list (offer is desk-agnostic), the "we build
// your self-service center" managed-service framing, and the guaranteed
// "30–60% of repeat questions never become tickets" claim.

const STEPS: { icon: typeof FileDown; n: number; title: string; body: string }[] = [
  {
    icon: FileDown,
    n: 1,
    title: 'Export your tickets',
    body: 'Most help desks export to CSV in a click. Send us your last 30 days of closed tickets, no integration, no new platform to adopt.',
  },
  {
    icon: PenLine,
    n: 2,
    title: 'We surface the repeat questions',
    body: 'We cluster tickets by intent, rank them by volume and cost, and draft answers in your customers’ language, not internal jargon, for your team to review and publish.',
  },
  {
    icon: TrendingDown,
    n: 3,
    title: 'The easy questions stop becoming tickets',
    body: 'Once the answers are published, customers self-serve the repeat questions, and your agents spend their time on the problems that actually need a human.',
  },
];

export function HowItWorks() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Three steps to fewer tickets
        </h2>
        <p className="text-foreground/60 leading-relaxed mt-2 max-w-lg">
          No new platform. No migration. No training your team on yet another tool.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STEPS.map(({ icon: Icon, n, title, body }) => (
          <div key={n} className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm">
                {n}
              </span>
              <Icon className="w-4 h-4 text-foreground/40" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
