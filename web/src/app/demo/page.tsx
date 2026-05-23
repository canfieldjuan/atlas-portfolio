'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Cpu,
  Database,
  FileText,
  Receipt,
  ShieldAlert,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CostObservabilityDemo } from '@/components/CostObservabilityDemo';
import { DocClassificationDemo } from '@/components/DocClassificationDemo';
import { buildAuditHref } from '@/lib/audit-routing';

const workflowDemos = [
  {
    id: 'revenue-ops',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'REVENUE OPS',
    title: 'Signal to sales motion',
    input: 'Reviews, CRM notes, competitor mentions, buying signals',
    system: 'Entity matching, pain extraction, lead scoring, account context, approval rules',
    output: 'Prioritized account alert, battle-card angle, outreach draft, CRM update',
  },
  {
    id: 'knowledge-systems',
    icon: <BrainCircuit className="w-5 h-5" />,
    label: 'KNOWLEDGE SYSTEMS',
    title: 'Documents to evidence-backed answers',
    input: 'PDFs, support tickets, wikis, calls, policies, internal notes',
    system: 'Retrieval, source ranking, structured synthesis, contradiction checks, citations',
    output: 'Answer with source trail, confidence notes, unresolved questions, audit view',
  },
  {
    id: 'agent-workflows',
    icon: <Bot className="w-5 h-5" />,
    label: 'AGENT WORKFLOWS',
    title: 'Inbox to controlled action queue',
    input: 'Email, calendar events, form submissions, CRM tasks, Slack requests',
    system: 'Intent routing, tool calls, draft generation, escalation logic, human approval',
    output: 'Queued action, prepared response, assigned owner, status trail',
  },
  {
    id: 'data-pipelines',
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'DATA PIPELINES',
    title: 'Raw data to operational visibility',
    input: 'Scraped sources, API feeds, databases, spreadsheets, vendor exports',
    system: 'Deduplication, enrichment, anomaly detection, scheduled jobs, monitoring',
    output: 'Dashboard, threshold alerts, quality report, recurring intelligence feed',
  },
  {
    id: 'web-apps',
    icon: <FileText className="w-5 h-5" />,
    label: 'DOC INTAKE',
    title: 'Inbound documents to routed workflow',
    input: 'Forms, PDFs, invoices, resumes, contracts, support emails',
    system: 'Server validation, parsing, classification, routing rules, operator review',
    output: 'Classified document, routing decision, review queue item, status notification',
  },
  {
    id: 'cost-observability',
    icon: <Receipt className="w-5 h-5" />,
    label: 'COST OBSERVABILITY',
    title: 'LLM usage to cost console',
    input: 'Provider usage logs, request metadata, feature/tenant tags, budget thresholds',
    system: 'Token-level attribution, model routing rules, budget caps, runaway-loop detection',
    output: 'Admin cost dashboard, per-tenant alerts, routing recommendations, margin report',
  },
  {
    id: 'specialized-ai',
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

const capabilityWorkbench = [
  {
    id: 'revenue',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'Revenue Ops',
    title: 'Signal to sales action',
    trigger: 'An account shows pricing friction, UX pain, and competitor interest across reviews and CRM notes.',
    inputs: ['Review signal: seat waste and clunky UI', 'CRM owner: existing open opportunity', 'Competitor mention: evaluating alternatives'],
    steps: ['Match company and vendor mentions', 'Extract pain and buying-stage evidence', 'Score account urgency', 'Generate reviewed outreach and CRM note'],
    controls: ['Human approval before CRM write', 'Source quote visible beside each claim', 'Dedupe against existing account owner'],
    outputTitle: 'Sales action packet',
    output: ['Priority: High', 'Angle: cost waste plus UX fatigue', 'Next action: AE review queue', 'Artifact: outreach draft + battle-card notes'],
  },
  {
    id: 'knowledge',
    icon: <BrainCircuit className="w-5 h-5" />,
    label: 'Knowledge',
    title: 'Documents to sourced answer',
    trigger: 'Support and operations teams keep asking questions whose answers are buried across tickets, PDFs, policies, and wikis.',
    inputs: ['PDF policy docs', 'Support ticket history', 'Internal wiki notes'],
    steps: ['Ingest and chunk trusted sources', 'Rank relevant source passages', 'Check for contradictions', 'Return answer with citation trail'],
    controls: ['Citation required for every answer', 'Unresolved questions surfaced', 'Low-confidence answers blocked from automation'],
    outputTitle: 'Evidence-backed answer',
    output: ['Answer summary with sources', 'Confidence notes', 'Conflicting-source warning', 'Artifact: searchable operator view'],
  },
  {
    id: 'agents',
    icon: <Bot className="w-5 h-5" />,
    label: 'Agents',
    title: 'Inbox to controlled action queue',
    trigger: 'Inbound requests arrive through email, forms, and Slack, but routing and response drafting are still manual.',
    inputs: ['Customer email', 'Calendar availability', 'CRM record', 'Slack escalation channel'],
    steps: ['Classify intent and urgency', 'Route to the right workflow', 'Draft the response or task', 'Wait for human approval before sending'],
    controls: ['No external send without approval', 'Tool-call failures routed to owner', 'Full status trail for each action'],
    outputTitle: 'Action queue item',
    output: ['Owner: Operations lead', 'Status: Ready for review', 'Prepared reply: drafted', 'Artifact: task + escalation trail'],
  },
  {
    id: 'pipelines',
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Pipelines',
    title: 'Raw data to monitored operations',
    trigger: 'A recurring report depends on exports, APIs, scraped sources, and manual cleanup before anyone can trust it.',
    inputs: ['API feed', 'Vendor export', 'Scraped market data', 'Spreadsheet corrections'],
    steps: ['Schedule ingestion', 'Normalize and deduplicate records', 'Enrich and run quality checks', 'Publish dashboard and alerts'],
    controls: ['Freshness monitor', 'Bad-record quarantine', 'Threshold alerts with source counts'],
    outputTitle: 'Operational visibility layer',
    output: ['Dashboard updated hourly', 'Quality report attached', 'Alert: anomaly detected', 'Artifact: monitored data pipeline'],
  },
  {
    id: 'web-apps',
    icon: <FileText className="w-5 h-5" />,
    label: 'Doc Intake',
    title: 'Inbound documents to controlled routing',
    trigger: 'A team receives documents, forms, and customer requests that need classification, extraction, routing, and operator review.',
    inputs: ['Invoice, resume, contract, or support email', 'Submission metadata and sender context', 'Business rules for routing and review'],
    steps: ['Validate the intake event on the server', 'Parse and classify the content', 'Extract key fields and risk flags', 'Route to the right queue or system of record'],
    controls: ['Server-side validation and rate limits', 'Audit log for every intake event', 'Operator review for sensitive routing decisions'],
    outputTitle: 'Document intake workflow',
    output: ['Document classified', 'Fields extracted', 'Review queue updated', 'Artifact: monitored intake pipeline'],
  },
  {
    id: 'cost-observability',
    icon: <Receipt className="w-5 h-5" />,
    label: 'Cost Observability',
    title: 'LLM spend to operator-grade cost console',
    trigger: 'AI features are shipping but no one can tell which models, features, or tenants are driving spend, or where unit economics break.',
    inputs: ['Provider usage logs', 'Feature and tenant tags on each call', 'Budget caps per tenant', 'Model price table'],
    steps: ['Attribute every call to feature + tenant', 'Aggregate spend per model / feature / tenant', 'Apply budget and runaway-spend rules', 'Surface alerts and routing recommendations'],
    controls: ['Hard budget caps per tenant', 'Circuit breakers on runaway spend', 'Alerts before margin compression hits revenue'],
    outputTitle: 'Admin cost console',
    output: ['Live spend dashboard', 'Per-tenant budget alerts', 'Routing wins identified', 'Artifact: margin report for SaaS pricing'],
  },
  {
    id: 'edge',
    icon: <Cpu className="w-5 h-5" />,
    label: 'Specialized AI',
    title: 'Real-time or local AI system',
    trigger: 'A workflow has latency, cost, privacy, or connectivity constraints that make a generic cloud-only model a poor fit.',
    inputs: ['Camera or audio stream', 'Device telemetry', 'Local runtime limits', 'Cloud sync requirements'],
    steps: ['Define latency and privacy budget', 'Select local/cloud model split', 'Build fallback and sync rules', 'Expose operator console'],
    controls: ['Local-first failure mode', 'Manual override path', 'Device and cloud state visible'],
    outputTitle: 'Controlled real-time system',
    output: ['Detection event stream', 'Operator review panel', 'Fallback state: local mode', 'Artifact: edge workflow console'],
  },
];

export default function DemoPage() {
  const [activeWorkbenchId, setActiveWorkbenchId] = useState(capabilityWorkbench[0].id);
  const activeWorkbench =
    capabilityWorkbench.find((item) => item.id === activeWorkbenchId) || capabilityWorkbench[0];

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
          className="glass rounded-xl p-8 border border-border mb-14"
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

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.14 }}
          className="glass rounded-xl p-8 border border-border mb-14"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                INTERACTIVE WORKBENCH
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                Pick a capability and see the operating shape.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Each view shows the kind of input, pipeline, control points, and output that a Phase 1 proof of concept would make concrete before Phase 2 build work.
              </p>
            </div>
            <Link
              href="/proof"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Compare build patterns
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-8">
            {capabilityWorkbench.map((item) => {
              const isActive = item.id === activeWorkbench.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveWorkbenchId(item.id)}
                  aria-pressed={isActive}
                  className={`min-h-20 rounded-lg border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-primary/50 bg-primary/10 text-foreground'
                      : 'border-border bg-surface text-foreground/60 hover:border-border hover:text-foreground'
                  }`}
                >
                  <div className={`mb-2 ${isActive ? 'text-primary' : 'text-foreground/45'}`}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-medium leading-tight">{item.label}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                {activeWorkbench.label.toUpperCase()}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{activeWorkbench.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed mb-6">{activeWorkbench.trigger}</p>

              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">INPUTS</div>
                  <div className="space-y-2">
                    {activeWorkbench.inputs.map((item) => (
                      <div key={item} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground/70">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">CONTROL POINTS</div>
                  <div className="space-y-2">
                    {activeWorkbench.controls.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-foreground/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 min-h-[30rem]">
              <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-6 h-full">
                <div>
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-4">SYSTEM PATH</div>
                  <div className="space-y-4">
                    {activeWorkbench.steps.map((step, index) => (
                      <div key={step} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full border border-primary/30 bg-background/70 text-primary shrink-0 flex items-center justify-center font-mono text-xs">
                          0{index + 1}
                        </div>
                        <p className="text-sm text-foreground/70 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-5 flex flex-col">
                  <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-3">OUTPUT PREVIEW</div>
                  <h4 className="text-lg font-semibold text-foreground mb-4">{activeWorkbench.outputTitle}</h4>
                  <div className="space-y-3 flex-1">
                    {activeWorkbench.output.map((line) => (
                      <div key={line} className="font-mono text-sm text-primary/90 border-b border-border pb-2">
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-md border border-border bg-surface p-3 text-xs text-foreground/50 leading-relaxed">
                    In Phase 1, this becomes a narrow working proof with real sample data, reviewed outputs, and explicit build risks.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass rounded-xl p-8 border border-border mb-14"
          aria-labelledby="live-integrations-heading"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                LIVE INTEGRATIONS
              </div>
              <h2
                id="live-integrations-heading"
                className="text-2xl md:text-3xl font-semibold text-foreground mb-3"
              >
                Two server-backed patterns you can inspect.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Both demos call local API routes in this site and return deterministic representative data. A production build would replace those fixtures with your providers, databases, and model calls while keeping the same UI, server, and operator-control shape.
              </p>
            </div>
            <Link
              href="/capabilities"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              See related capabilities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-6">
            <DocClassificationDemo />
            <CostObservabilityDemo />
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mb-10"
        >
          <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
            CHOOSE A WORKFLOW
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {workflowDemos.map((demo) => (
              <Link
                key={demo.id}
                href={`#${demo.id}`}
                className="rounded-lg border border-border bg-surface p-4 text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-2">
                  {demo.label}
                </div>
                <div className="text-sm font-medium text-foreground leading-snug">{demo.title}</div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6 mb-20">
          {workflowDemos.map((demo, index) => (
            <motion.div
              key={demo.title}
              id={demo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + index * 0.06 }}
              className="glass rounded-xl p-8 border border-border hover:bg-surface-hover transition-colors scroll-mt-24"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 shrink-0">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {demo.icon}
                  </div>
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    {demo.label}
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">{demo.title}</h2>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-2">INPUT</div>
                    <p className="text-sm text-foreground/65 leading-relaxed">{demo.input}</p>
                  </div>
                  <div className="md:border-l md:border-border md:pl-6">
                    <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-2">SYSTEM</div>
                    <p className="text-sm text-foreground/65 leading-relaxed">{demo.system}</p>
                  </div>
                  <div className="md:border-l md:border-border md:pl-6">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-foreground/50 text-xs font-mono tracking-wide mb-4">
                CONCRETE EXAMPLE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                Evidence-backed intelligence is one possible build
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                The evidence explorer is still a useful reference. It shows what happens when messy input needs to become structured, traceable, operator-reviewed output.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-foreground font-medium text-xl">
                <Database className="text-primary w-6 h-6" />
                <h3>1. Unstructured signal in</h3>
              </div>
              <p className="text-foreground/60 leading-relaxed">
                The workflow starts with source material such as reviews, support tickets, CRM notes, call transcripts, documents, or public web data.
              </p>
              <div className="bg-surface border border-border rounded-lg p-4 font-mono text-sm text-foreground/80 overflow-x-auto">
                <pre>{`{
  "source": "G2",
  "content": "The UI is clunky and we are paying too much for seats we do not use. Looking at alternatives."
}`}</pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-foreground font-medium text-xl">
                <ShieldAlert className="text-primary w-6 h-6" />
                <h3>2. Structured reasoning layer</h3>
              </div>
              <p className="text-foreground/60 leading-relaxed">
                Instead of a loose summary, the system produces fields that can be inspected, scored, filtered, audited, and routed through business logic.
              </p>
              <div className="bg-surface border border-primary/30 rounded-lg p-4 font-mono text-sm text-primary overflow-x-auto shadow-[var(--primary-glow-tight)]">
                <pre>{`{
  "churn_intent_score": 0.85,
  "pain_points": ["Cost", "UX"],
  "buying_stage": "evaluating_alternatives",
  "operator_review_required": true
}`}</pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-foreground font-medium text-xl">
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
            <div className="glass rounded-xl p-2 border border-border overflow-hidden">
              <div className="bg-surface rounded-lg overflow-hidden relative aspect-[4/3] flex items-center justify-center">
                <Image
                  src="/evidence-explorer-demo.gif"
                  alt="Representative evidence explorer demo"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 left-4 bg-surface px-3 py-1 rounded border border-border text-xs font-mono text-foreground/80">
                  EVIDENCE EXPLORER
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-foreground font-medium mb-2">The operating model matters more than the screen</h4>
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
          className="glass rounded-xl p-8 border border-border mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">WHAT PHASE 1 DECIDES</div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
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
          className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[var(--primary-glow)]"
        >
          <h2 className="text-2xl font-semibold text-foreground mb-3">Want to know which workflow fits your environment?</h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            Start with a Systems Audit. That is where I decide whether the right next step is revenue automation, a knowledge engine, an agent workflow, a data pipeline, or something narrower.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={buildAuditHref({ source: 'demo' })} className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm">
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/capabilities" className="inline-flex items-center gap-2 px-6 py-3 glass border border-border hover:bg-surface-hover transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review Capabilities
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
