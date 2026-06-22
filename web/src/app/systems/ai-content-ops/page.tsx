'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  LayoutTemplate,
  Repeat,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';
import { DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL } from '@/lib/deflection-pricing';

// Content Ops hub — product gallery layout.
// Hero is tight; offers drive the page; coming-soon stubs signal roadmap.

type Offer = {
  icon: React.ReactNode;
  category: string;
  accent: string;         // tailwind bg class for the top accent bar
  title: string;
  tagline: string;
  summary: string;
  points: string[];
  price: string;
  href: string;
  hrefLabel: string;
  status: 'live' | 'coming-soon';
};

const offers: Offer[] = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'SUPPORT OPERATIONS',
    accent: 'bg-primary',
    title: 'Resolution Audit',
    tagline: 'Turn closed tickets into an evidence-backed self-service queue.',
    summary:
      'Audits a 30-day ticket export, ranks repeat questions in the words customers actually use, and separates review-ready answers from operational gaps.',
    points: [
      'Ranked repeat-question audit',
      'Customer wording and operational gaps',
      'Draft answers with source-ticket traceability',
    ],
    price: DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL,
    href: '/systems/support-ticket-deflection/snapshot',
    hrefLabel: 'Start Your Forensic Audit',
    status: 'live',
  },
  {
    icon: <Repeat className="w-5 h-5" />,
    category: 'ONGOING SERVICE',
    accent: 'bg-primary',
    title: 'Ongoing Optimization',
    tagline: 'Keep the system tuned as your business changes.',
    summary:
      'Monthly retainer that keeps a live Content Ops workflow aligned with new data, new offers, and shifting customer language — without re-scoping a new project every quarter.',
    points: [
      'Prompt and template tuning each month',
      'Campaign and page expansion',
      'Monthly performance review + async support',
    ],
    price: 'Starts at $2,500 / mo',
    href: '/systems/ai-content-ops/ongoing-support',
    hrefLabel: 'Explore Ongoing Optimization',
    status: 'live',
  },
];

const comingSoon: Array<{
  icon: React.ReactNode;
  category: string;
  title: string;
  tagline: string;
}> = [
  {
    icon: <Search className="w-5 h-5" />,
    category: 'SEARCH & AEO',
    title: 'Customer-Language SEO Pack',
    tagline: 'Pages ranked on the exact phrases your buyers type.',
  },
  {
    icon: <LayoutTemplate className="w-5 h-5" />,
    category: 'CONVERSION',
    title: 'Comparison & Alternative Pages',
    tagline: 'High-intent pages built from real competitive positioning.',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    category: 'CONTENT PIPELINE',
    title: 'Blog & SEO Draft Engine',
    tagline: 'Evidence-backed article drafts from your own product data.',
  },
];

const howItWorks = [
  {
    step: '01',
    icon: <Database className="w-5 h-5" />,
    label: 'Structured data in',
    detail: 'Support tickets, reviews, sales notes, product docs.',
  },
  {
    step: '02',
    icon: <Zap className="w-5 h-5" />,
    label: 'AI extraction + synthesis',
    detail: 'Signals clustered, patterns ranked, drafts generated.',
  },
  {
    step: '03',
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: 'Human review queue',
    detail: 'Your team approves before anything publishes.',
  },
];

const auditHref = buildAuditHref({
  interest: 'content-generation',
  source: 'content-ops-hub',
  offer: 'content-ops-audit',
});

export default function AiContentOpsHubPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <Sparkles className="w-3 h-3" />
            <span>AI CONTENT OPERATIONS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4 max-w-2xl">
            Productized content systems built from your own data.
          </h1>
          <p className="text-lg text-foreground/55 mb-8 max-w-xl">
            Pick a focused offer, see value fast, then expand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={auditHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Start a Content Ops Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/systems/support-ticket-deflection/snapshot"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-surface-hover transition-all text-sm text-foreground/70"
            >
              Start Your Forensic Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* ── Section label ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="text-[10px] font-mono text-foreground/35 tracking-widest">AVAILABLE NOW</div>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* ── Live product cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {offers.map((offer, i) => (
            <motion.section
              key={offer.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="glass rounded-xl border border-border flex flex-col overflow-hidden group hover:shadow-[var(--primary-glow)] hover:border-primary/25 transition-all duration-300"
            >
              {/* accent bar */}
              <div className={`h-1 w-full ${offer.accent} opacity-70`} />

              <div className="p-7 flex flex-col flex-1">
                {/* top row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {offer.icon}
                    </div>
                    <div className="text-[10px] font-mono text-primary/70 tracking-widest leading-tight">
                      {offer.category}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary/80 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* content */}
                <h2 className="text-xl font-semibold text-foreground mb-1">{offer.title}</h2>
                <p className="text-sm text-primary/80 font-medium mb-3">{offer.tagline}</p>
                <p className="text-sm text-foreground/60 leading-relaxed mb-5">{offer.summary}</p>

                {/* bullets */}
                <ul className="space-y-2 mb-6">
                  {offer.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-foreground/65">
                      <CheckCircle2 className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>

                {/* footer */}
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">{offer.price}</span>
                  <Link
                    href={offer.href}
                    className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/75 transition-colors group-hover:gap-2.5"
                  >
                    {offer.hrefLabel}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* ── Coming soon label ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex items-center gap-3 mb-6 mt-12"
        >
          <div className="text-[10px] font-mono text-foreground/35 tracking-widest">COMING SOON</div>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* ── Coming soon stub cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
          {comingSoon.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.07 }}
              className="rounded-xl border border-border bg-surface/60 p-6 flex flex-col relative overflow-hidden"
            >
              {/* subtle top accent */}
              <div className="h-px w-full bg-border absolute top-0 left-0" />

              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 text-foreground/35 flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="text-[10px] font-mono text-foreground/30 tracking-widest">
                  {item.category}
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground/50 mb-1">{item.title}</h3>
              <p className="text-sm text-foreground/35 leading-relaxed">{item.tagline}</p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-foreground/30 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                In roadmap
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── How the engine works ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mb-16"
        >
          <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-6">HOW IT WORKS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {howItWorks.map((step, i) => (
              <div
                key={step.step}
                className="relative rounded-xl border border-border bg-surface p-6 flex gap-4 items-start"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-1">STEP {step.step}</div>
                  <p className="text-sm font-semibold text-foreground mb-1">{step.label}</p>
                  <p className="text-xs text-foreground/50 leading-relaxed">{step.detail}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 text-border">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Audit CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[var(--primary-glow)]"
        >
          <FileText className="w-8 h-8 text-primary mx-auto mb-5" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Not sure which offer fits? Start with the audit.
          </h2>
          <p className="text-foreground/55 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
            The audit looks at your data sources and publishing needs, then recommends the offer that returns value fastest — before any larger build is priced.
          </p>
          <Link
            href={auditHref}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
          >
            Start a Content Ops Audit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
