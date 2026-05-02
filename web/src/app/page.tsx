'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Database, Code2, Activity, ShieldCheck, Radar, FileText } from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

const heroFacts = [
  { label: 'OUTCOME', value: 'Manual workflow removed' },
  { label: 'FIRST STEP', value: '$4,500 fixed roadmap' },
  { label: 'RESPONSE', value: '48-hour review' },
];

const trappedSources = [
  'CRM notes',
  'Sales calls',
  'Support tickets',
  'Customer reviews',
  'Internal docs',
  'Spreadsheets',
  'Vendor research',
  'Account history',
  'Product notes',
  'Operator inboxes',
];

const capabilities = [
  {
    title: 'Stop losing revenue to manual handoffs',
    desc: 'Lead-to-revenue workflows that turn signals, research, and outreach into repeatable operating systems your team can run without re-coordinating it every week.',
    icon: <Activity className="w-5 h-5 text-primary" />,
  },
  {
    title: 'Make internal knowledge actually answer questions',
    desc: 'RAG, synthesis pipelines, and governed data flows built for factual output and operator trust — so the answer comes from the source, not a guess.',
    icon: <Database className="w-5 h-5 text-primary" />,
  },
  {
    title: 'Replace fragile chains of manual steps',
    desc: 'Multi-step systems that route intent, call tools, and execute repeatable internal operations without depending on someone remembering the next step.',
    icon: <Code2 className="w-5 h-5 text-primary" />,
  },
  {
    title: 'Give operators a system they can inspect',
    desc: 'Dashboards and workflow surfaces that let your team see, monitor, and manage what the system is doing — not a black box that produces output you have to trust on faith.',
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
  },
];

const proofPatterns = [
  {
    label: 'REVENUE OPS',
    title: 'Signal to outreach workflow',
    detail:
      'Raw market or review signals are collected, enriched into structured pain points, then routed into a draft outreach or sales-alert workflow.',
  },
  {
    label: 'INTERNAL INTELLIGENCE',
    title: 'Documents to evidence-backed answers',
    detail:
      'Tickets, wikis, PDFs, and internal notes become a retrieval and synthesis layer that operators can inspect instead of blindly trusting.',
  },
  {
    label: 'OPERATOR WORKFLOWS',
    title: 'Inbox to action queue',
    detail:
      'Email, CRM, and calendar events are normalized into triage, routing, and approval flows so repetitive internal work stops depending on manual coordination.',
  },
];

const productizedSystems = [
  {
    icon: <Radar className="w-5 h-5 text-primary" />,
    title: 'Competitive / Vendor Intelligence Platform',
    interest: 'competitive-intelligence' as const,
    desc: 'A ready-made intelligence architecture that becomes specific once your vendors, competitors, accounts, sources, and workflows are connected.',
  },
  {
    icon: <FileText className="w-5 h-5 text-primary" />,
    title: 'AI Content Ops Station',
    interest: 'content-generation' as const,
    desc: 'A reusable content operations system for SEO pages, comparison pages, blog drafts, email variants, and claim-reviewed campaign assets.',
  },
];

const resourceTopics = [
  'How to scope an AI automation project',
  'What changes AI automation consultant cost',
  'When custom AI development beats another SaaS tool',
];

export default function Home() {
  return (
    <div className="min-h-screen relative">

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide">
              <Activity className="w-3 h-3" />
              <span>AI SYSTEMS FOR OPERATIONAL TEAMS</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1] max-w-4xl">
              Turn the workflows your team already runs into<br />
              <span className="gradient-text">AI systems they can trust.</span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/60 max-w-2xl leading-relaxed mt-4">
              If your team is still copying data between tools, rewriting the same customer context, or waiting on manual review steps, the problem is not that you need more AI. You need a working system around the workflow.
            </p>
            <p className="text-base text-foreground/50 max-w-2xl leading-relaxed">
              I build the pipelines, review states, integrations, dashboards, and operator controls that turn scattered information into repeatable action. Scope, proof, and price are defined before any larger build.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
              <Link href={buildAuditHref({ source: 'home-hero' })} className="group px-6 py-3 bg-white text-black font-medium rounded-md hover:bg-white/90 transition-all flex items-center gap-2">
                Start Systems Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/services" className="px-6 py-3 glass hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium border border-white/10">
                Review Services & Pricing
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 w-full max-w-3xl">
              {heroFacts.map((fact) => (
                <div key={fact.label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-1">{fact.label}</div>
                  <div className="text-sm font-medium text-white">{fact.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Problem Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mt-32 max-w-4xl"
          >
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE PROBLEM
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              Most teams do not have an AI problem. They have an operating-system problem.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              Open a chatbot. Paste in scattered context. Rewrite the prompt five times. Get something that sounds polished but never ships into the workflow.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-8">
              The business value is usually already there. It is trapped in the same places it always was:
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {trappedSources.map((source) => (
                <span
                  key={source}
                  className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-foreground/65"
                >
                  {source}
                </span>
              ))}
            </div>
            <p className="text-foreground/55 leading-relaxed">
              The solution is the layer that makes those signals usable: collection, enrichment, routing, review, approval, and handoff. That is what these engagements build.
            </p>
          </motion.section>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-32">
            {capabilities.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                className="glass p-8 rounded-xl hover:bg-white/[0.02] transition-colors group cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                <p className="text-foreground/60 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 rounded-xl border border-primary/20 bg-primary/5 p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-8">
              <div className="max-w-2xl">
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                  PRODUCTIZED SYSTEMS
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
                  Two common needs already have systems behind them.
                </h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  When the workflow shape is well-known — competitive intelligence or content operations — the architecture does not have to start from zero. Your data, sources, approvals, and integrations make the system fit.
                </p>
              </div>
              <Link
                href="/systems"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Explore productized systems
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productizedSystems.map((system) => (
                <div key={system.title} className="rounded-lg border border-white/10 bg-black/20 p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                    {system.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{system.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{system.desc}</p>
                  <Link
                    href={buildAuditHref({
                      interest: system.interest,
                      source: 'home-productized',
                      offer: system.interest,
                    })}
                    className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Start audit for this system
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/50 text-xs font-mono tracking-wide mb-4">
                WORKFLOW PATTERNS
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                What this looks like inside a real operation.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                These are workflow shapes you may recognize. Each one shows what data goes in, what evidence the system holds onto, and what the team actually gets out — before any build work starts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {proofPatterns.map((pattern, i) => (
                <motion.div
                  key={pattern.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18 + i * 0.08 }}
                  className="glass rounded-xl p-8 border border-white/10"
                >
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    {pattern.label}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{pattern.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{pattern.detail}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Review representative builds
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-20 rounded-xl border border-white/10 bg-white/[0.02] p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono text-primary/80 tracking-widest mb-4">
                <BookOpen className="w-4 h-4" />
                FIELD NOTES
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                The buyer-side research before the conversation.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Practical resources for buyers comparing AI automation consulting, custom AI development, and workflow automation options.
              </p>
            </div>
            <div className="lg:w-[26rem]">
              <div className="space-y-3 mb-5">
                {resourceTopics.map((topic) => (
                  <div key={topic} className="text-sm text-foreground/65 leading-relaxed">
                    {topic}
                  </div>
                ))}
              </div>
              <Link
                href="/resources"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Read resources
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-40">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/50 text-xs font-mono tracking-wide mb-4">
                THE PROCESS
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                How every engagement works
              </h2>
              <p className="text-foreground/60 max-w-xl mx-auto">
                No retainers. No hourly billing. Every project follows a two-phase model designed to reduce delivery risk before the larger build begins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {[
                {
                  step: '01',
                  title: 'Start Systems Audit',
                  desc: 'Fill out the Systems Audit form. Requests are submitted directly to the intake queue and reviewed personally within 48 hours.',
                },
                {
                  step: '02',
                  title: 'Phase 1 — The Roadmap',
                  desc: 'A flat-fee, 2-week engagement. We map your system, build a proof of concept, and deliver a fixed-scope blueprint for the full build. $4,500.',
                },
                {
                  step: '03',
                  title: 'Phase 2 — The Build',
                  desc: 'Fixed price, agreed upfront from the blueprint. I build the system, you review it, and we ship. No surprises on the invoice.',
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="glass rounded-xl p-8 text-center relative"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                    <span className="font-mono text-primary text-lg font-bold">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/process" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                See the full discovery-to-delivery process
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* CTA Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(0,255,204,0.04)]"
            >
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Ready to qualify the fit?</h3>
                <p className="text-foreground/60">Start with pricing and process, then submit the audit only if the engagement model makes sense for your team.</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href="/services"
                  className="group px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                >
                  See Services & Pricing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={buildAuditHref({ source: 'home-bottom', offer: 'phase-1-roadmap' })}
                  className="px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
                >
                  Start Systems Audit
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
