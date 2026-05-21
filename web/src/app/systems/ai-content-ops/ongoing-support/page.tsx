'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  HelpCircle,
  LayoutTemplate,
  Megaphone,
  Repeat,
  ScrollText,
  ShieldCheck,
  Workflow,
  Gauge,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';
import { generateFaqJsonLd } from '@/lib/seo';

const monthlyScope = [
  {
    icon: <LayoutTemplate className="w-5 h-5" />,
    title: 'New content templates',
    desc: 'As your offers and audiences shift, new content types come into scope. New templates get scoped, drafted, and added to the workflow.',
  },
  {
    icon: <Workflow className="w-5 h-5" />,
    title: 'Prompt and workflow tuning',
    desc: 'Existing prompts, signal extractors, and synthesis steps get tuned against current customer language. Outputs stay sharp instead of drifting toward generic.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Monthly performance review',
    desc: 'A short written report each month: what shipped, what worked, what did not, what is next. Includes cost trends, output volume, and quality observations.',
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: 'Integration updates',
    desc: 'When CRMs, review platforms, or content destinations change shape, the integration layer keeps working without you re-coordinating it.',
  },
  {
    icon: <Megaphone className="w-5 h-5" />,
    title: 'Campaign expansion',
    desc: 'New angles surface from new signal. The workflow gets extended to handle them — new sequence variants, new comparison pages, new social formats.',
  },
  {
    icon: <Gauge className="w-5 h-5" />,
    title: 'Quality gate improvements',
    desc: 'Approval criteria evolve as you learn what is working. Quality checks and human-review gates get tightened or relaxed in response.',
  },
  {
    icon: <ScrollText className="w-5 h-5" />,
    title: 'Reporting and support',
    desc: 'Async support throughout the month for questions, decisions, or requests. Plus the optional 30-minute monthly review call if you want one.',
  },
];

const monthOneSteps = [
  {
    title: 'Discovery',
    timing: 'Week 1',
    detail:
      'Audit of your current AI content stack: workflows, prompts, templates, integrations, output samples, cost data. Identify what is drifting and what is working.',
  },
  {
    title: 'Baseline',
    timing: 'Weeks 1–2',
    detail:
      'Capture metrics that matter: cost per asset, time-to-publish, output volume, quality score, customer feedback. Sets the reference point for monthly reviews.',
  },
  {
    title: 'Quick wins',
    timing: 'Weeks 2–3',
    detail:
      'Two or three immediate improvements ship in month one. Usually prompt tuning + one template refresh + one cost optimization. Tangible value before the first invoice clears.',
  },
  {
    title: 'Roadmap',
    timing: 'Week 4',
    detail:
      'Written plan for months two and three covering planned tuning, expansion, and reporting cadence. Aligned with what you actually need, not a fixed checklist.',
  },
];

const fitAudiences = [
  {
    title: 'Teams running an AI Content Ops Station',
    detail:
      'You finished a pilot or full build with ATLAS. You want continuity rather than a one-shot project. Ongoing Optimization keeps your system aligned with the business it is now operating against.',
  },
  {
    title: 'Teams who built their own AI content workflow',
    detail:
      'Your team built something internally — prompts, templates, automation — but no one owns the ongoing tuning. Engineers move to other priorities. Marketing inherits a system they cannot maintain. Ongoing Optimization is the expert maintenance layer.',
  },
  {
    title: 'Teams coming off a pilot or full build',
    detail:
      'A pilot ($7,500+) or full build ($15,000+) is the build itself. Ongoing Optimization is what keeps it useful past month one — without re-scoping a new project every time the business shifts.',
  },
];

const engagementTerms = [
  'Month-to-month — no annual commitment',
  'Cancel with 30 days notice',
  'Pause for a month if you have a slow stretch',
  'Scope adjustments reviewed quarterly',
  'No surprise overages — heavy months even out',
];

const ongoingFaqs: { q: string; a: string }[] = [
  {
    q: 'Do I need to be an existing ATLAS customer to qualify?',
    a: 'No. Ongoing Optimization works for any team running an AI content workflow that needs expert ongoing tuning. Teams who built their own internal AI content systems are a common fit.',
  },
  {
    q: 'What counts as in-scope work in a month?',
    a: 'Anything that keeps the workflow aligned with the business: prompt tuning, template updates, integration fixes, new content angles, quality gate refinements, reporting. Out-of-scope work — a brand-new pipeline, a new data integration, a major rebuild — is scoped separately as a project.',
  },
  {
    q: 'Can I pause or cancel the ongoing optimization retainer?',
    a: 'Yes. The retainer is month-to-month. Cancel with 30 days notice. Pausing for a month is also fine if you have a slow stretch.',
  },
  {
    q: 'How do hours and scope adjustments work?',
    a: 'The $2,500/month floor implies roughly 10–15 hours of focused work. If your stack regularly needs more, the retainer scope adjusts at the next quarter boundary. No surprise overages — if a month runs hot, the next month evens out.',
  },
  {
    q: 'What if I do not have an AI content workflow yet?',
    a: 'Start with the Content Ops Audit instead. Ongoing Optimization is the maintenance layer for systems already running. Trying to use it as the build phase will produce poor value for both sides.',
  },
];

const faqJsonLd = generateFaqJsonLd(
  ongoingFaqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

const ctaHref = buildAuditHref({
  interest: 'content-generation',
  source: 'ai-content-ops-ongoing-support',
  offer: 'ongoing-support',
});

export default function OngoingSupportPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
              <Repeat className="w-3 h-3" />
              <span>ONGOING OPTIMIZATION</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              Keep your AI content system tuned as{' '}
              <span className="gradient-text">your business changes.</span>
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed mb-4 max-w-3xl">
              AI content workflows are not set-and-forget. Prompts drift, ICPs evolve, templates age, costs creep. Ongoing Optimization is a productized monthly retainer that keeps the system aligned with the business it is supposed to serve.
            </p>
            <p className="text-sm text-foreground/45 leading-relaxed mb-8">
              Built for teams running an AI content workflow that needs expert ongoing tuning — whether you built it with ATLAS or somewhere else.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={ctaHref}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Ask About Ongoing Support
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#monthly-scope"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-border hover:bg-surface-hover transition-all rounded-md text-foreground/80 font-medium text-sm"
              >
                See What&apos;s Included
              </Link>
            </div>
          </motion.section>

          {/* Problem */}
          <section className="mt-32 max-w-4xl">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE PROBLEM
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              AI content workflows quietly stop working.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              The system that shipped three months ago was scoped against three-month-old data. Your business has moved since then. New offers. New ICPs. New objections from sales calls. New competitor moves. New customer language showing up in tickets and reviews.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-4">
              Without ongoing tuning, the prompts that worked stop matching the buyer. The templates that produced clean output start producing thin output. Costs creep as the model handles traffic that should route to a smaller one. The team quietly stops using the system because it stopped feeling useful.
            </p>
            <p className="text-foreground/55 leading-relaxed">
              Ongoing Optimization is the maintenance layer that keeps the workflow aligned with the business — not a generic AI consulting retainer.
            </p>
          </section>

          {/* Monthly Scope */}
          <section id="monthly-scope" className="mt-32 scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                MONTHLY SCOPE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                What is included every month.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Seven categories of work that keep the system tuned. Specific allocations within them flex with what your stack actually needs in any given month.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyScope.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.04 * i }}
                  className="glass rounded-xl border border-border p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Month One */}
          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                MONTH ONE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Discovery, baseline, and the first quick wins.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Month one is intentionally substantive. It is not a holding pattern.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {monthOneSteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-mono text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                      {step.timing.toUpperCase()}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Best Fit */}
          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                BEST FIT
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Built for teams running an AI content workflow that needs ongoing tuning.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Not a fit if you do not have an AI content workflow yet. Start with the{' '}
                <Link href="/systems/ai-content-ops#pricing" className="text-primary hover:text-primary/80 transition-colors">
                  Content Ops Audit
                </Link>{' '}
                instead.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fitAudiences.map((audience, i) => (
                <motion.div
                  key={audience.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="glass rounded-xl border border-border p-6"
                >
                  <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-3">
                    AUDIENCE 0{i + 1}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{audience.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{audience.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="mt-32 scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                PRICING
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Single floor. Scoped to your stack and cadence.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                One retainer shape. No tiered comparison games. The price reflects effort; the scope flexes with what your workflow actually needs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] shadow-[var(--primary-glow)] p-6 md:p-8">
                <h3 className="text-lg font-semibold text-white mb-3">Ongoing Optimization</h3>
                <div className="mb-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-white">Starts at $2,500</span>
                  <span className="text-sm text-foreground/50">per month</span>
                </div>
                <p className="text-xs text-primary/80 font-mono mb-5">~10–15 hours of focused work per month</p>
                <p className="text-sm text-foreground/65 leading-relaxed mb-5">
                  Most engagements settle at the floor. Heavier stacks — multiple data sources, multiple workflows, more output volume — scope up from there at the next quarter review.
                </p>

                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
                  WHAT YOU GET MONTHLY
                </div>
                <ul className="space-y-2 mb-6">
                  {[
                    'All 7 categories of monthly scope above',
                    'Async support throughout the month',
                    'Optional 30-minute monthly review call',
                    'Written monthly performance report',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/70 leading-snug"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={ctaHref}
                  className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-sm bg-primary text-black hover:bg-primary/90 transition-colors"
                >
                  Ask About Ongoing Support
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-4">
                  ENGAGEMENT TERMS
                </div>
                <ul className="space-y-3">
                  {engagementTerms.map((term) => (
                    <li
                      key={term}
                      className="flex items-start gap-2 text-sm text-foreground/70 leading-snug"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mt-32 scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Common questions before booking.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Quick answers to the questions that decide whether the retainer is a fit.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {ongoingFaqs.map((faq, i) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed pl-6">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-32">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 md:p-12 shadow-[var(--primary-glow)] text-center">
              <div className="max-w-2xl mx-auto">
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                  NEXT STEP
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                  Want to keep your AI content system tuned?
                </h2>
                <p className="text-foreground/60 leading-relaxed mb-8">
                  The first conversation is a 20-minute call to understand your current setup, your output cadence, and what is drifting. From there I scope the retainer to your actual stack.
                </p>
                <Link
                  href={ctaHref}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                >
                  Ask About Ongoing Support ($2,500/mo)
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* Footnote */}
          <div className="mt-12 rounded-xl border border-border bg-surface p-6 flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/55 leading-relaxed">
              Ongoing Optimization is delivered as a productized retainer, not a self-serve subscription. The first conversation defines what is in scope each month so neither side gets surprised.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
