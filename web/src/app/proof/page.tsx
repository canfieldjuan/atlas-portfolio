'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

const buildExamples = [
  {
    icon: <Activity className="w-5 h-5" />,
    label: 'REVENUE OPS AUTOMATION',
    title: 'Signal-to-outreach operating system',
    buyer: 'A founder-led or revenue team with too many buying signals spread across reviews, CRM notes, spreadsheets, and competitor mentions.',
    inputs: ['Review and community signals', 'CRM account lists', 'Competitor mentions', 'Sales notes'],
    system: [
      'Entity matching across accounts and vendors',
      'Pain extraction with confidence gates',
      'Lead scoring and operator review rules',
      'Draft outreach and battle-card angle generation',
    ],
    outputs: ['Prioritized account queue', 'Evidence-backed sales angle', 'CRM-ready notes', 'Draft outbound message'],
    phase1: 'Prove that raw signals can be matched to accounts and turned into useful, reviewable sales actions.',
    phase2: 'Build the pipeline, review dashboard, scoring rules, and CRM handoff.',
  },
  {
    icon: <BrainCircuit className="w-5 h-5" />,
    label: 'KNOWLEDGE SYSTEMS',
    title: 'Evidence-backed internal answer engine',
    buyer: 'An operations, support, or product team whose useful knowledge is scattered across documents, tickets, wikis, calls, and policies.',
    inputs: ['PDFs and docs', 'Support tickets', 'Internal wikis', 'Call notes and policies'],
    system: [
      'Retrieval over trusted sources',
      'Source ranking and citation rules',
      'Contradiction checks and confidence notes',
      'Operator-facing review surface',
    ],
    outputs: ['Answer with source trail', 'Unresolved-question list', 'Audit view', 'Reusable knowledge index'],
    phase1: 'Prove that the highest-value questions can be answered with citations instead of loose summaries.',
    phase2: 'Build ingestion, retrieval, answer generation, access rules, and a working search or assistant surface.',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    label: 'AGENT WORKFLOWS',
    title: 'Inbox-to-action queue with human approval',
    buyer: 'A team spending hours triaging requests, assigning owners, drafting replies, and coordinating handoffs across tools.',
    inputs: ['Email and forms', 'Slack requests', 'Calendar events', 'CRM or ticket records'],
    system: [
      'Intent classification and routing',
      'Tool calls with explicit failure handling',
      'Draft generation and escalation rules',
      'Human approval before external actions',
    ],
    outputs: ['Queued action', 'Assigned owner', 'Prepared response', 'Status trail'],
    phase1: 'Prove one workflow can be routed safely from intake to human-reviewed action.',
    phase2: 'Build the orchestration layer, approvals, tool integrations, and monitoring.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'DATA PIPELINES',
    title: 'Raw data to dashboard and alert workflow',
    buyer: 'A team manually checking sources, cleaning exports, and stitching together recurring reports or alerts.',
    inputs: ['API feeds', 'Scraped sources', 'Databases', 'Spreadsheets and vendor exports'],
    system: [
      'Scheduled ingestion and deduplication',
      'Enrichment and quality checks',
      'Threshold rules and anomaly detection',
      'Dashboard and notification layer',
    ],
    outputs: ['Monitoring dashboard', 'Threshold alerts', 'Quality report', 'Recurring intelligence feed'],
    phase1: 'Prove the data can be collected, normalized, and monitored with enough reliability to automate.',
    phase2: 'Build the recurring pipeline, alerting logic, dashboard, and operations runbook.',
  },
];

const deliverables = [
  'Technical architecture blueprint',
  'Working proof of concept',
  'Data and integration map',
  'Risk, security, and deployment notes',
  'Fixed-price Phase 2 implementation proposal',
];

const proofRules = [
  {
    title: 'Specific enough to scope',
    detail: 'Each example starts with real inputs, owners, and workflow boundaries. If those are missing, the roadmap should say so before build work begins.',
  },
  {
    title: 'Built around operator control',
    detail: 'The goal is not a black-box demo. The system needs inspection points, failure handling, review states, and clear downstream actions.',
  },
  {
    title: 'Proof before scale',
    detail: 'Phase 1 should validate the smallest useful version before a larger implementation is priced.',
  },
];

export default function ProofPage() {
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
            <span>REPRESENTATIVE BUILDS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            What proof looks like before a larger AI build.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            These are representative and anonymized build patterns, not public client case studies. The point is to make the work concrete: the problem, the input data, the system shape, the output, and what Phase 1 has to prove before implementation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-16"
        >
          {proofRules.map((rule) => (
            <div key={rule.title} className="glass rounded-xl p-6 border border-border">
              <h2 className="text-base font-semibold text-white mb-3">{rule.title}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">{rule.detail}</p>
            </div>
          ))}
        </motion.div>

        <div className="space-y-8">
          {buildExamples.map((example, index) => (
            <motion.section
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.06 }}
              className="glass rounded-xl p-8 border border-border"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 shrink-0">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {example.icon}
                  </div>
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    {example.label}
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-4">{example.title}</h2>
                  <p className="text-sm text-foreground/60 leading-relaxed">{example.buyer}</p>
                </div>

                <div className="lg:w-2/3 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">INPUTS</div>
                      <div className="space-y-2">
                        {example.inputs.map((item) => (
                          <div key={item} className="text-sm text-foreground/65 leading-relaxed">{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="md:border-l md:border-border md:pl-6">
                      <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">SYSTEM</div>
                      <div className="space-y-2">
                        {example.system.map((item) => (
                          <div key={item} className="text-sm text-foreground/65 leading-relaxed">{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="md:border-l md:border-border md:pl-6">
                      <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">OUTPUTS</div>
                      <div className="space-y-2">
                        {example.outputs.map((item) => (
                          <div key={item} className="text-sm text-foreground/65 leading-relaxed">{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-primary/15 bg-primary/5 p-5">
                      <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">PHASE 1 PROVES</div>
                      <p className="text-sm text-foreground/70 leading-relaxed">{example.phase1}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-5">
                      <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">PHASE 2 BUILDS</div>
                      <p className="text-sm text-foreground/65 leading-relaxed">{example.phase2}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-16 glass rounded-xl p-8 border border-border"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">WHAT YOU RECEIVE</div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                Phase 1 turns proof into a build decision.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                The roadmap should give you enough evidence to decide whether to build, reduce scope, pause, or choose a simpler tool. You keep the blueprint and proof of concept either way.
              </p>
              <Link
                href="/resources"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium mt-5"
              >
                Read scoping resources
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:w-[24rem] space-y-3">
              {deliverables.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[var(--primary-glow)]"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">Have a workflow that looks like one of these?</h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            Start with the Systems Audit. I will review whether the workflow has enough data, ownership, and business value to justify a Phase 1 Roadmap. Review services if you want the pricing model before submitting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={buildAuditHref({ source: 'proof' })} className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm">
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 glass border border-border hover:bg-surface-hover transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review Services
            </Link>
            <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 glass border border-border hover:bg-surface-hover transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review Workflow Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
