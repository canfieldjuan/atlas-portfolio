'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Gauge,
  Map,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

const principles = [
  {
    icon: <Map className="w-5 h-5" />,
    title: 'Roadmap before build',
    detail:
      'The first paid step is a fixed-fee roadmap because architecture, proof of concept, cost, and delivery risk should be defined before a larger implementation starts.',
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'Builder, not advisor-only',
    detail:
      'The work is not a deck that gets handed to another team. Phase 2 is implementation: code, data flows, integrations, dashboards, and deployment decisions.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Operator control',
    detail:
      'Useful AI systems expose evidence, state, review points, and failure modes so a team can trust the workflow before automating more of it.',
  },
  {
    icon: <Gauge className="w-5 h-5" />,
    title: 'Fixed scope over hourly drift',
    detail:
      'The engagement model is designed to avoid open-ended hourly work. Scope is written down, price is fixed, and deliverables are explicit.',
  },
];

const fitSignals = [
  'You have a real workflow owner, not just abstract interest in AI.',
  'There is data, context, or source material the system can actually use.',
  'The output needs to become part of operations, not just a one-off demo.',
  'You want implementation risk surfaced before approving a larger build.',
];

const boundaries = [
  'No generic chatbot build unless the workflow behind it is real.',
  'No vague strategy engagement with no implementation path.',
  'No promise that AI should replace every human review step.',
  'No hourly meter running while the project scope is still unclear.',
];

const deliveryShape = [
  {
    title: 'Audit',
    detail: 'I review the request for fit across workflow, data, budget, security, and implementation path.',
  },
  {
    title: 'Roadmap',
    detail: 'We scope the system, build a proof of concept, define risks, and produce a fixed-price implementation plan.',
  },
  {
    title: 'Build',
    detail: 'I implement the agreed system with milestones, documentation, and operator-facing review points where needed.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <Workflow className="w-3 h-3" />
            <span>ABOUT</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            You are hiring a systems builder, not an AI hype layer.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            I am Juan Canfield. I work with teams that have a concrete operational workflow, data problem, or automation bottleneck and need a custom AI system scoped before it is built.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="glass rounded-xl p-8 border border-white/10 mb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <div>
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">THE OPERATING MODEL</div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Useful AI work is not the prompt. It is the system around it.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed mb-4">
                Most teams hit the same wall: a chatbot that demos well but never reaches the operator who needs it. The work that actually ships is the data handling, workflow design, integration, review states, monitoring, and human-controlled fallbacks that turn a model output into something a team can run.
              </p>
              <p className="text-sm text-foreground/60 leading-relaxed">
                That is why every engagement starts with a roadmap. The roadmap is where the real problem, proof of concept, architecture, and implementation price get defined.
              </p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-6">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">BEST FIT</div>
              <div className="space-y-3">
                {fitSignals.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/70 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {principles.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.06 }}
              className="glass rounded-xl p-8 border border-white/10"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                {principle.icon}
              </div>
              <h2 className="text-lg font-semibold text-white mb-3">{principle.title}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">{principle.detail}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          <div className="glass rounded-xl p-8 border border-white/10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">HOW IT RUNS</div>
            <h2 className="text-xl font-semibold text-white mb-6">A small, explicit engagement path</h2>
            <div className="space-y-5">
              {deliveryShape.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/10 text-primary shrink-0 flex items-center justify-center font-mono text-xs">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-8 border border-white/10">
            <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">BOUNDARIES</div>
            <h2 className="text-xl font-semibold text-white mb-6">What I intentionally avoid</h2>
            <div className="space-y-3">
              {boundaries.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-white/20 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="glass rounded-xl p-8 border border-white/10 mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white mb-2">Want to see the work shape before contacting me?</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                The proof page shows representative build patterns. The process page explains how a Systems Audit becomes a roadmap and then a fixed-scope implementation. For data boundaries, review privacy and security before sharing sensitive context.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/proof"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Proof
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/process"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Process
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Privacy
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">Think your workflow is concrete enough to scope?</h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            Start with the Systems Audit. I review whether there is enough workflow clarity, data access, ownership, and budget path to justify a Phase 1 Roadmap.
          </p>
          <Link href={buildAuditHref({ source: 'about' })} className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm">
            Start Systems Audit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
