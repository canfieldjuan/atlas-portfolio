'use client';

import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, BrainCircuit, Bot, BarChart3, Cpu, FileText, Radar } from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

const domains = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Turn market signals into revenue action',
    desc: 'For teams with useful research, reviews, CRM context, or competitor signals that never make it into sales follow-up fast enough.',
    examples: [
      'Competitor intelligence pipelines (15+ signal sources)',
      'Semantic lead scoring & pain-point matching',
      'Automated cold-outreach campaigns grounded in real evidence',
      'Battle card generation with discovery & landmine questions',
      'Affiliate revenue engines with dynamic content mapping',
    ],
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: 'Make fragmented knowledge answer business questions',
    desc: 'For teams whose documents, tickets, policies, and internal notes contain answers, but no one trusts the search or summary layer.',
    examples: [
      'GraphRAG knowledge bases with relationship mapping',
      'Document reasoning engines (PDFs, wikis, support tickets)',
      'Evidence-backed search with full source traceability',
      'Intelligence report generation with trust scoring',
      'Cross-source synthesis with witness verification',
    ],
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: 'Move repetitive operations through controlled workflows',
    desc: 'For teams that need intake, routing, drafting, tool calls, and approvals to happen consistently across inboxes, CRMs, calendars, and queues.',
    examples: [
      'Email triage, routing & auto-response agents',
      'Scheduling & calendar orchestration',
      'CRM enrichment workflows (Salesforce, HubSpot, Pipedrive)',
      'LangGraph multi-step agent workflows',
      'MCP server integrations (130+ tool patterns)',
      'Approval queues with human-in-the-loop review',
    ],
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Turn raw data and AI usage into monitored systems',
    desc: 'For teams that need recurring data collection, enrichment, dashboards, alerts, and LLM cost controls instead of manual checks and surprise spend.',
    examples: [
      'Multi-source web scrapers with proxy rotation & dedup',
      'LLM enrichment pipelines (40+ structured fields per record)',
      'Threshold-based alert systems (email, Slack, ntfy)',
      'Anomaly detection & quality monitoring dashboards',
      'LLM cost dashboards by model, feature, user, or tenant',
      'Budget alerts, runaway-spend circuit breakers, and routing recommendations',
      'Autonomous scheduled task orchestration (81+ task patterns)',
      'SEO content generation from structured intelligence data',
    ],
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'Run AI where latency, connectivity, or cost matters',
    desc: 'For specialized environments where cloud-only inference is too slow, too expensive, or too dependent on a stable network connection.',
    examples: [
      'Real-time object detection (YOLO World on NPU)',
      'Face & gait recognition with identity fusion',
      'Voice-to-voice AI assistants (STT + LLM + TTS)',
      'Speaker identification & voice activity detection',
      'Bidirectional WebSocket sync with cloud orchestrators',
    ],
  },
];

const capabilitySignals = {
  bestFor: [
    'Teams with a specific workflow, dataset, or operational bottleneck to improve.',
    'Buyers who can point to an owner, current process, and expected business outcome.',
    'Projects where custom architecture matters more than buying another off-the-shelf SaaS tool.',
  ],
  notIdeal: [
    'Requests that are still broad curiosity without a defined workflow to fix.',
    'Teams looking for a generic chatbot or a loose AI strategy conversation with no implementation path.',
    'Opportunities where compliance, procurement, or internal alignment is too unclear to scope responsibly.',
  ],
};

const productizedSystems = [
  {
    icon: <Radar className="w-5 h-5" />,
    title: 'Competitive / Vendor Intelligence Platform',
    detail:
      'Already-built architecture for vendor, competitor, account, review, and market-signal intelligence. Customer data customizes the sources, entities, scoring, dashboards, and alerts.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'AI Content Ops Station',
    detail:
      'Already-built architecture for evidence-backed content operations. Customer data customizes the brand voice, keyword targets, approved claims, review workflow, and publishing handoff.',
  },
];

export default function CapabilitiesPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            CAPABILITIES
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Choose the business problem. Then scope the system.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            These are the situations where custom AI work can be worth building: revenue signals that do not reach sales, knowledge that cannot be trusted, internal work stuck in handoffs, data that no one monitors, or AI workloads that need tighter runtime control.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          <div className="glass rounded-xl p-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Best fit for</h2>
            <div className="space-y-3">
              {capabilitySignals.bestFor.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Probably not ideal for</h2>
            <div className="space-y-3">
              {capabilitySignals.notIdeal.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0 mt-1.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="glass rounded-xl p-8 border border-primary/20 bg-primary/5 mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                PRODUCTIZED SYSTEMS
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">
                Some solutions already have a working core.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Competitive intelligence and content operations have reusable architecture behind them. The custom work is your data layer, integration map, approval rules, and operator surface.
              </p>
            </div>
            <Link
              href="/systems"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Explore systems
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productizedSystems.map((system) => (
              <div key={system.title} className="rounded-lg border border-white/10 bg-black/20 p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {system.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{system.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{system.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Domain Cards */}
        <div className="space-y-6">
          {domains.map((domain, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="glass rounded-xl p-8 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Title & Description */}
                <div className="md:w-2/5 shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    {domain.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3">{domain.title}</h2>
                  <p className="text-foreground/60 text-sm leading-relaxed">{domain.desc}</p>
                </div>

                {/* Right: Examples */}
                <div className="md:w-3/5 md:border-l md:border-white/5 md:pl-8">
                  <div className="text-xs font-mono text-foreground/30 tracking-widest mb-4">WHAT THE SYSTEM CAN SHIP</div>
                  <div className="space-y-3">
                    {domain.examples.map((ex, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                        <span className="text-sm text-foreground/70">{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-12 glass rounded-xl p-8 border border-white/10"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white mb-2">Need to validate fit before starting?</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Use the services page to understand the pricing model, the process page to understand the engagement path, and the security page if deployment or compliance requirements are going to shape the build.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/process"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Process
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">See something that fits your problem?</h2>
          <p className="text-foreground/60 mb-8 max-w-xl mx-auto">
            Every engagement starts with a Phase 1 Roadmap: a fixed-fee scoping engagement that defines architecture, proves the approach, and prices the implementation before build work begins.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={buildAuditHref({ source: 'capabilities' })} className="group px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all flex items-center gap-2 text-sm">
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/services" className="px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review Services & Pricing
            </Link>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
