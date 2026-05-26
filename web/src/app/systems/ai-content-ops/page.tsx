'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  GitCompare,
  LayoutTemplate,
  Mail,
  Megaphone,
  Repeat,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

// Content Ops hub: the umbrella over productized content offers. Cards link to
// the live wedge routes (link-first); route-nesting + the demo page are later
// slices. Headings use the real text-foreground token directly — the old
// white-text utility and its globals.css !important remap are gone.

type Offer = {
  icon: React.ReactNode;
  label: string;
  title: string;
  summary: string;
  points: string[];
  href: string;
  hrefLabel: string;
  status: string;
};

const offers: Offer[] = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    label: 'SUPPORT OPERATIONS',
    title: 'Support Ticket Deflection Report',
    summary:
      'Turns the last 3–6 months of closed support tickets into ranked repeat questions, the wording customers actually use, and self-service answers your team reviews and publishes.',
    points: [
      'Repeat-question clustering by customer intent',
      'Volume-ranked deflection opportunities',
      'Draft answers with source-ticket traceability',
    ],
    href: '/systems/support-ticket-deflection',
    hrefLabel: 'View the Deflection Report',
    status: 'Available now',
  },
  {
    icon: <Repeat className="w-6 h-6" />,
    label: 'ONGOING SERVICE',
    title: 'Ongoing Optimization',
    summary:
      'Keeps a live Content Ops system useful as your data, offers, and campaigns change — recurring refreshes instead of a one-time build.',
    points: [
      'Quarterly refreshes against new data',
      'Campaign and page expansion',
      'Review-state and quality upkeep',
    ],
    href: '/systems/ai-content-ops/ongoing-support',
    hrefLabel: 'View Ongoing Optimization',
    status: 'Available now',
  },
];

const produces = [
  { icon: <FileText className="w-5 h-5" />, label: 'SEO pages & blog drafts' },
  { icon: <GitCompare className="w-5 h-5" />, label: 'Comparison & alternative pages' },
  { icon: <Mail className="w-5 h-5" />, label: 'Email & campaign variants' },
  { icon: <LayoutTemplate className="w-5 h-5" />, label: 'Landing-page copy' },
  { icon: <Megaphone className="w-5 h-5" />, label: 'Repurposed social & briefs' },
  { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Operator review queue with claim notes' },
];

export default function AiContentOpsHubPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <Database className="w-3 h-3" />
            <span>CONTENT OPERATIONS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
            One content system. Focused offers you can start with today.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Content Ops turns your own business data — support tickets, customer wording, product docs, sales notes — into publish-ready content your team reviews and approves. Instead of one giant build, you start with a focused offer that solves a specific problem, then expand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href={buildAuditHref({ interest: 'content-generation', source: 'content-ops-hub', offer: 'content-ops-audit' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Start a Content Ops Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/systems/support-ticket-deflection"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-surface-hover transition-all text-sm text-foreground/80"
            >
              See the live offer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mb-6"
        >
          <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-1">
            START HERE
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Productized offers</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-16">
          {offers.map((offer, index) => (
            <motion.section
              key={offer.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + index * 0.08 }}
              className="glass rounded-xl p-8 border border-border flex flex-col"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {offer.icon}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                  {offer.status}
                </span>
              </div>
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                {offer.label}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{offer.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed mb-5">{offer.summary}</p>
              <div className="space-y-2 mb-6">
                {offer.points.map((point) => (
                  <p key={point} className="flex items-start gap-2 text-sm text-foreground/65 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
                    {point}
                  </p>
                ))}
              </div>
              <Link
                href={offer.href}
                className="mt-auto inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {offer.hrefLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.section>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="glass rounded-xl p-8 border border-border mb-16"
        >
          <div className="max-w-2xl mb-8">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE BROADER SYSTEM
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              The same engine produces more than one report.
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Each offer above is one shape of the same Content Ops system: structured business data in, evidence-backed and human-reviewed content out. As offers prove out, the system expands to the rest of what your team has to publish.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produces.map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-surface p-5 flex items-start gap-3">
                <span className="text-primary shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-sm text-foreground/70 leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[var(--primary-glow)]"
        >
          <FileText className="w-8 h-8 text-primary mx-auto mb-5" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Not sure which offer fits? Start with the audit.
          </h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            The audit looks at your data, your sources, and what your team has to publish, then recommends the offer that returns value fastest — before any larger build is priced.
          </p>
          <Link
            href={buildAuditHref({ interest: 'content-generation', source: 'content-ops-hub-cta', offer: 'content-ops-audit' })}
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
