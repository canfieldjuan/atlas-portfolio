'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  Radar,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { type AuditProjectInterest, buildAuditHref } from '@/lib/audit-routing';

type SystemEntry = {
  icon: React.ReactNode;
  label: string;
  title: string;
  summary: string;
  customerData: string[];
  builtCore: string[];
  outputs: string[];
  interest: AuditProjectInterest;
  offer?: string;
  href?: string;
  hrefLabel?: string;
};

const systems: SystemEntry[] = [
  {
    icon: <Radar className="w-6 h-6" />,
    label: 'COMPETITIVE INTELLIGENCE',
    title: 'Competitive / Vendor Intelligence Platform',
    interest: 'competitive-intelligence' as const,
    summary:
      'A reusable intelligence system for teams that need vendor, competitor, account, and market signals turned into monitored operating data.',
    customerData: [
      'Target vendors, competitors, and categories',
      'CRM account lists or customer segments',
      'Approved source list: reviews, forums, public pages, support notes, call notes, or internal docs',
      'Sales, marketing, product, or customer-success workflows that should receive the output',
    ],
    builtCore: [
      'Multi-source collection and normalization',
      'Entity matching across vendors, accounts, products, and competitors',
      'Pain-point, churn-risk, pricing, feature-gap, and switching-signal extraction',
      'Evidence-backed rollups, alerts, reports, and operator review views',
    ],
    outputs: [
      'Vendor and competitor dashboards',
      'Account-level buying or churn signals',
      'Battle cards and positioning angles',
      'Recurring intelligence reports and alerts',
    ],
  },
  {
    icon: <FileText className="w-6 h-6" />,
    label: 'CONTENT OPERATIONS',
    title: 'AI Content Ops Station',
    interest: 'content-generation',
    offer: 'content-ops-audit',
    href: '/systems/ai-content-ops',
    hrefLabel: 'View the landing page',
    summary:
      'A structured content production system for teams that need landing pages, comparison pages, blogs, email sequences, and campaign assets generated from approved evidence.',
    customerData: [
      'Brand voice, offers, service lines, ICP, and positioning',
      'Keyword targets, page types, and content calendar priorities',
      'Proof points, testimonials, product docs, sales notes, and internal examples',
      'Approval rules for claims, tone, citations, and publish readiness',
    ],
    builtCore: [
      'Brief generation from source material and SEO targets',
      'Evidence-backed outline, draft, and revision workflow',
      'Claim checks, human-review states, and reusable content components',
      'Publishing handoff for CMS, email, ads, or internal review queues',
    ],
    outputs: [
      'SEO pages and blog drafts',
      'Comparison and alternative pages',
      'Email and campaign variants',
      'Operator review queue with claim notes',
    ],
  },
];

const implementationSteps = [
  {
    title: 'Start with the proven workflow pattern',
    detail:
      'The collection, enrichment, routing, review, and output patterns already exist. Phase 1 validates where that pattern fits your business and where it should not be forced.',
  },
  {
    title: 'Customize the data layer',
    detail:
      'Your vendors, sources, CRM context, keywords, approvals, data access, and security constraints decide what gets connected.',
  },
  {
    title: 'Ship the surface your team actually uses',
    detail:
      'The final system becomes dashboards, alerts, review queues, exports, publishing handoffs, or reports that match how your team already makes decisions.',
  },
];

const fitNotes = [
  'Best when the problem matches a known operating pattern: competitive intelligence, content operations, account signals, or recurring reporting.',
  'Useful when speed matters but generic SaaS cannot match your sources, approval rules, data access, or handoff requirements.',
  'Not a self-serve subscription. These are implemented systems customized through the same audit, roadmap, and fixed-scope build model.',
];

export default function SystemsPage() {
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
            <span>PRODUCTIZED AI SYSTEMS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Start from a proven system pattern, not a blank AI build.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Some business problems are common enough that the architecture should not start from scratch. Competitive intelligence and content operations already have working cores; your data, sources, approvals, and integrations make them fit your business.
          </p>
          <p className="text-base text-foreground/50 leading-relaxed mt-4">
            Use this path when you want a faster route to a useful system without accepting a generic tool.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href={buildAuditHref({ source: 'systems', offer: 'productized-systems' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Start Systems Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
            >
              View demos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-16"
        >
          {fitNotes.map((note) => (
            <div key={note} className="glass rounded-xl p-6 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-primary mb-4" />
              <p className="text-sm text-foreground/65 leading-relaxed">{note}</p>
            </div>
          ))}
        </motion.div>

        <div className="space-y-8 mb-16">
          {systems.map((system, index) => (
            <motion.section
              key={system.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + index * 0.08 }}
              className="glass rounded-xl p-8 border border-white/10"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {system.icon}
                  </div>
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    {system.label}
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-4">{system.title}</h2>
                  <p className="text-sm text-foreground/60 leading-relaxed">{system.summary}</p>
                  <div className="mt-5 flex flex-col items-start gap-3">
                    {system.href && (
                      <Link
                        href={system.href}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        {system.hrefLabel ?? 'Learn more'}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      href={buildAuditHref({
                        interest: system.interest,
                        source: 'systems-card',
                        offer: system.offer ?? system.interest,
                      })}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Start audit for this system
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">
                      CUSTOMER DATA
                    </div>
                    <div className="space-y-2">
                      {system.customerData.map((item) => (
                        <p key={item} className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                      ))}
                    </div>
                  </div>
                  <div className="md:border-l md:border-white/10 md:pl-6">
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">
                      BUILT CORE
                    </div>
                    <div className="space-y-2">
                      {system.builtCore.map((item) => (
                        <p key={item} className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                      ))}
                    </div>
                  </div>
                  <div className="md:border-l md:border-white/10 md:pl-6">
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">
                      OUTPUTS
                    </div>
                    <div className="space-y-2">
                      {system.outputs.map((item) => (
                        <p key={item} className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="glass rounded-xl p-8 border border-white/10 mb-16"
        >
          <div className="max-w-2xl mb-8">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              IMPLEMENTATION MODEL
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Faster than a blank-slate build, still customized where it counts.
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              The prebuilt part is the architecture: ingestion, enrichment, review states, generation, reporting, and operator controls. The custom part is the business context that makes the system useful.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {implementationSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-white/10 bg-black/20 p-6">
                <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-mono text-xs mb-5">
                  0{index + 1}
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]"
        >
          <BarChart3 className="w-8 h-8 text-primary mx-auto mb-5" />
          <h2 className="text-2xl font-semibold text-white mb-3">
            Bring the bottleneck. I will map the system.
          </h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            The Systems Audit is where we decide whether one of these proven patterns fits, what needs to be customized, and what the first proof should validate before a larger build is priced.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={buildAuditHref({ source: 'systems', offer: 'productized-systems' })}
              className="group px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
            >
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/services"
              className="px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
            >
              Review Services & Pricing
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-6 flex items-start gap-4"
        >
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/55 leading-relaxed">
            These are not self-serve SaaS products. They are production-ready starting points for custom AI implementation, scoped through Phase 1 and delivered with your data, integrations, and operator controls.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
