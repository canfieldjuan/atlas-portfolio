'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Cpu,
  Database,
  ShieldAlert,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const workflowDemos = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'REVENUE OPS',
    title: 'Signal to sales motion',
    input: 'Reviews, CRM notes, competitor mentions, buying signals',
    system: 'Entity matching, pain extraction, lead scoring, account context, approval rules',
    output: 'Prioritized account alert, battle-card angle, outreach draft, CRM update',
  },
  {
    icon: <BrainCircuit className="w-5 h-5" />,
    label: 'KNOWLEDGE SYSTEMS',
    title: 'Documents to evidence-backed answers',
    input: 'PDFs, support tickets, wikis, calls, policies, internal notes',
    system: 'Retrieval, source ranking, structured synthesis, contradiction checks, citations',
    output: 'Answer with source trail, confidence notes, unresolved questions, audit view',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    label: 'AGENT WORKFLOWS',
    title: 'Inbox to controlled action queue',
    input: 'Email, calendar events, form submissions, CRM tasks, Slack requests',
    system: 'Intent routing, tool calls, draft generation, escalation logic, human approval',
    output: 'Queued action, prepared response, assigned owner, status trail',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'DATA PIPELINES',
    title: 'Raw data to operational visibility',
    input: 'Scraped sources, API feeds, databases, spreadsheets, vendor exports',
    system: 'Deduplication, enrichment, anomaly detection, scheduled jobs, monitoring',
    output: 'Dashboard, threshold alerts, quality report, recurring intelligence feed',
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    label: 'SPECIALIZED AI',
    title: 'Real-time or local AI system',
    input: 'Camera feeds, audio streams, device telemetry, edge runtime constraints',
    system: 'Model selection, latency budget, local/cloud split, sync layer, fallback logic',
    output: 'Real-time detection, voice workflow, local assistant, operator console',
  },
];

const roadmapOutputs = [
  'Which workflow should be automated first',
  'What data and integrations are required',
  'What proof of concept should be built',
  'What should stay human-reviewed',
  'What Phase 2 should cost and deliver',
];

export default function DemoPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <Terminal className="w-3 h-3" />
            <span>REPRESENTATIVE WORKFLOWS</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-5 max-w-4xl mx-auto">
            Custom AI systems are broader than one demo.
          </h1>
          <p className="text-lg text-foreground/60 max-w-3xl mx-auto leading-relaxed">
            A Phase 1 Roadmap can scope revenue automation, internal knowledge systems, agent workflows, data pipelines, or specialized real-time AI. The right build depends on the workflow, the data, and the operator risk.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-xl p-8 border border-white/10 mb-14"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">ROADMAP FIRST</div>
              <p className="text-sm text-foreground/65 leading-relaxed">
                The first paid step is not a vague strategy sprint. It produces a scoped blueprint, a working proof of concept, and a fixed-price build proposal.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">CUSTOM SYSTEMS</div>
              <p className="text-sm text-foreground/65 leading-relaxed">
                The build can be a pipeline, dashboard, agent workflow, knowledge engine, real-time AI layer, or a combination of those parts.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">OPERATOR CONTROL</div>
              <p className="text-sm text-foreground/65 leading-relaxed">
                The strongest systems expose evidence, state, and approval points so the team can trust the workflow before automating more of it.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6 mb-20">
          {workflowDemos.map((demo, index) => (
            <motion.div
              key={demo.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + index * 0.06 }}
              className="glass rounded-xl p-8 border border-white/10 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 shrink-0">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {demo.icon}
                  </div>
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    {demo.label}
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3">{demo.title}</h2>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-2">INPUT</div>
                    <p className="text-sm text-foreground/65 leading-relaxed">{demo.input}</p>
                  </div>
                  <div className="md:border-l md:border-white/10 md:pl-6">
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-2">SYSTEM</div>
                    <p className="text-sm text-foreground/65 leading-relaxed">{demo.system}</p>
                  </div>
                  <div className="md:border-l md:border-white/10 md:pl-6">
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-2">OUTPUT</div>
                    <p className="text-sm text-foreground/65 leading-relaxed">{demo.output}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left Column: The Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-12"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/50 text-xs font-mono tracking-wide mb-4">
                CONCRETE EXAMPLE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Evidence-backed intelligence is one possible build
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                The evidence explorer is still a useful reference. It shows what happens when messy input needs to become structured, traceable, operator-reviewed output.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white font-medium text-xl">
                <Database className="text-primary w-6 h-6" />
                <h3>1. Unstructured signal in</h3>
              </div>
              <p className="text-foreground/60 leading-relaxed">
                The workflow starts with source material such as reviews, support tickets, CRM notes, call transcripts, documents, or public web data.
              </p>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 font-mono text-sm text-foreground/80 overflow-x-auto">
                <pre>{`{
  "source": "G2",
  "content": "The UI is clunky and we are paying too much for seats we do not use. Looking at alternatives."
}`}</pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white font-medium text-xl">
                <ShieldAlert className="text-primary w-6 h-6" />
                <h3>2. Structured reasoning layer</h3>
              </div>
              <p className="text-foreground/60 leading-relaxed">
                Instead of a loose summary, the system produces fields that can be inspected, scored, filtered, audited, and routed through business logic.
              </p>
              <div className="bg-[#0a0a0a] border border-primary/30 rounded-lg p-4 font-mono text-sm text-primary overflow-x-auto shadow-[0_0_15px_rgba(0,255,204,0.05)]">
                <pre>{`{
  "churn_intent_score": 0.85,
  "pain_points": ["Cost", "UX"],
  "buying_stage": "evaluating_alternatives",
  "operator_review_required": true
}`}</pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white font-medium text-xl">
                <Zap className="text-primary w-6 h-6" />
                <h3>3. Controlled downstream action</h3>
              </div>
              <p className="text-foreground/60 leading-relaxed">
                The system can trigger an internal alert, draft a report, update a queue, prepare an outbound message, or ask an operator for approval before acting.
              </p>
            </div>
          </motion.div>

          {/* Right Column: Visual Proof */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="sticky top-32"
          >
            <div className="glass rounded-xl p-2 border border-white/10 overflow-hidden">
              <div className="bg-[#111] rounded-lg overflow-hidden relative aspect-[4/3] flex items-center justify-center">
                <Image
                  src="/evidence-explorer-demo.gif"
                  alt="Representative evidence explorer demo"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded border border-white/10 text-xs font-mono text-white/80">
                  EVIDENCE EXPLORER
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-white font-medium mb-2">The operating model matters more than the screen</h4>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  A production workflow needs traceable evidence, inspectable outputs, and a clear point where a human can review or override what the system is doing.
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="glass rounded-xl p-8 border border-white/10 mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">WHAT PHASE 1 DECIDES</div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                The roadmap selects the right workflow, not the flashiest one.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                The fixed-fee roadmap chooses the smallest valuable proof of concept, defines the full build, and exposes delivery risk before the larger implementation begins.
              </p>
            </div>
            <div className="lg:w-[22rem] space-y-3">
              {roadmapOutputs.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
                  <span className="text-sm text-foreground/70 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">Want to know which workflow fits your environment?</h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            Start with a Systems Audit. That is where I decide whether the right next step is revenue automation, a knowledge engine, an agent workflow, a data pipeline, or something narrower.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/audit" className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm">
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/capabilities" className="inline-flex items-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review Capabilities
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
