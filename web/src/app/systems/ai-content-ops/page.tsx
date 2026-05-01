'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Database,
  FileText,
  Mail,
  Megaphone,
  LayoutTemplate,
  ScrollText,
  Briefcase,
  ShieldCheck,
  Layers,
  Workflow,
  Cpu,
  GitBranch,
  Gauge,
} from 'lucide-react';
import Link from 'next/link';

const pipelineStages = [
  { label: 'Business Data', sub: 'CRM • Reviews • Docs • Calls' },
  { label: 'Signal Extraction' },
  { label: 'Reasoning + Synthesis' },
  { label: 'Quality Gates' },
  { label: 'Human Approval' },
  { label: 'Final Content Assets' },
];

const trappedSources = [
  'CRM notes',
  'Customer reviews',
  'Sales calls',
  'Support tickets',
  'Competitor research',
  'Internal docs',
  'Spreadsheets',
  'Old reports',
  'Product notes',
  'Customer interviews',
];

const outputs = [
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'SEO Blog Posts',
    desc: 'Turn customer pain points, market insights, and internal knowledge into structured posts designed to educate, rank, and support sales conversations.',
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: 'Email Campaigns',
    desc: 'Generate targeted email sequences from specific customer problems, objections, buying signals, or competitor weaknesses.',
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: 'Sales Briefs',
    desc: 'Create short, useful briefs that help sales teams understand buyer pain, positioning angles, objections, and recommended messaging.',
  },
  {
    icon: <ScrollText className="w-5 h-5" />,
    title: 'Reports',
    desc: 'Produce polished internal or client-facing reports with summaries, evidence, confidence notes, and recommended actions.',
  },
  {
    icon: <LayoutTemplate className="w-5 h-5" />,
    title: 'Landing Page Copy',
    desc: 'Turn validated business intelligence into offer sections, positioning statements, problem and solution copy, and conversion-focused messaging.',
  },
  {
    icon: <Megaphone className="w-5 h-5" />,
    title: 'Social Content',
    desc: 'Repurpose approved insights into short-form posts, thought leadership snippets, LinkedIn updates, and campaign angles.',
  },
];

const comparisonRows: { basic: string; station: string }[] = [
  { basic: 'Starts with a blank prompt', station: 'Starts with structured business data' },
  { basic: 'Produces one-off drafts', station: 'Produces repeatable content assets' },
  { basic: 'No source-of-truth layer', station: 'Uses organized intelligence inputs' },
  { basic: 'No approval workflow', station: 'Includes human review gates' },
  { basic: 'Hard to track quality', station: 'Uses quality checks and scoring' },
  { basic: 'Can sound generic', station: 'Tied to real customer and business signals' },
  { basic: 'Manual copy and paste workflow', station: 'Built as a repeatable content pipeline' },
];

const howItWorks = [
  {
    title: 'Connect or Upload Business Data',
    detail:
      'Start with information you already have: CRM exports, customer notes, reviews, support tickets, call summaries, spreadsheets, product docs, or research files.',
  },
  {
    title: 'Extract Useful Signals',
    detail:
      'The system identifies themes, pain points, objections, buying triggers, customer language, competitor mentions, and content opportunities.',
  },
  {
    title: 'Synthesize the Intelligence',
    detail:
      'Instead of dumping raw summaries into content, the system turns the signals into structured conclusions, angles, claims, and recommendations.',
  },
  {
    title: 'Generate Content Assets',
    detail:
      'The content engine produces blogs, emails, reports, briefs, social posts, and landing page sections from approved templates.',
  },
  {
    title: 'Review Before Publishing',
    detail:
      'Human approval gates keep the system controlled. Nothing has to publish automatically unless the workflow is designed that way.',
  },
  {
    title: 'Reuse the Same Intelligence',
    detail:
      'The same source intelligence can power multiple assets, reducing repeated research and making content more consistent across channels.',
  },
];

const useCases = [
  {
    title: 'B2B SaaS Teams',
    detail: 'Turn customer feedback, sales objections, and competitor notes into battlecards, blogs, and campaigns.',
  },
  {
    title: 'Agencies',
    detail: 'Produce client content faster using structured intake, approval gates, and reusable workflows.',
  },
  {
    title: 'Consultants',
    detail: 'Turn research, notes, and client insights into reports, thought leadership, and sales assets.',
  },
  {
    title: 'Local Service Businesses',
    detail: 'Turn customer questions, service knowledge, and reviews into helpful website content, email reminders, and trust-building posts.',
  },
  {
    title: 'Sales Teams',
    detail: 'Create objection-handling content, follow-up emails, account briefs, and competitive positioning assets.',
  },
];

const infrastructurePieces = [
  { icon: <Workflow className="w-4 h-4" />, label: 'Reasoning and synthesis workflows' },
  { icon: <Layers className="w-4 h-4" />, label: 'Structured content generation' },
  { icon: <ShieldCheck className="w-4 h-4" />, label: 'Human approval queues' },
  { icon: <Database className="w-4 h-4" />, label: 'LLM batching and caching' },
  { icon: <GitBranch className="w-4 h-4" />, label: 'Model routing' },
  { icon: <Gauge className="w-4 h-4" />, label: 'Quality gates' },
  { icon: <ScrollText className="w-4 h-4" />, label: 'Report rendering' },
  { icon: <LayoutTemplate className="w-4 h-4" />, label: 'Reusable templates' },
  { icon: <Cpu className="w-4 h-4" />, label: 'Cost tracking' },
  { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Evidence-backed intelligence inputs' },
];

const auditDeliverables = [
  'Review of your current content workflow',
  'Identification of usable data sources',
  'Content opportunity map',
  'Recommended content outputs',
  'Workflow design',
  'Automation potential',
  'Approval process recommendation',
  'Implementation estimate',
];

function PipelineDiagram() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 lg:p-8">
      <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-5">
        CONTENT OPS PIPELINE
      </div>
      <div className="space-y-2">
        {pipelineStages.map((stage, index) => (
          <div key={stage.label}>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{stage.label}</div>
                  {stage.sub && (
                    <div className="text-[11px] text-foreground/45 font-mono mt-0.5">{stage.sub}</div>
                  )}
                </div>
                <div className="text-[10px] font-mono text-foreground/35">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            </div>
            {index < pipelineStages.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-3.5 h-3.5 text-primary/50" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AiContentOpsPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
              <Workflow className="w-3 h-3" />
              <span>AI CONTENT OPS STATION</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              Turn Business Intelligence Into{' '}
              <span className="gradient-text">Approval-Ready Content</span>
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed mb-4">
              AI Content Ops Station transforms your structured business data into blogs, email campaigns, sales briefs, reports, landing page copy, and social content — with evidence, quality gates, and human approval built into the workflow.
            </p>
            <p className="text-sm text-foreground/45 leading-relaxed mb-8">
              Built for businesses that need useful content from real data — not generic AI filler.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/audit"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Book a Content Ops Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#what-it-produces"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
              >
                See What It Can Produce
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PipelineDiagram />
          </motion.div>
        </section>

        {/* Problem */}
        <section className="mt-32 max-w-4xl">
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            THE PROBLEM
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
            Most AI Content Still Starts From a Blank Prompt
          </h2>
          <p className="text-foreground/65 leading-relaxed mb-4">
            Most teams use AI the hard way. They open a chatbot, paste in scattered context, rewrite the prompt five times, check the output manually, and still end up with content that sounds polished but thin.
          </p>
          <p className="text-foreground/65 leading-relaxed mb-8">
            The bigger problem is that the best source material is usually trapped inside messy systems:
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
            That information is valuable, but it rarely turns into consistent content because there is no real content pipeline behind it. AI Content Ops Station fixes that.
          </p>
        </section>

        {/* Solution */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE SOLUTION
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              A Content Pipeline Built Around Your Actual Business Data
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              AI Content Ops Station takes structured inputs and turns them into usable content assets through a controlled workflow. Instead of generating one-off drafts from vague prompts, the system creates repeatable outputs from the same intelligence layer.
            </p>
            <p className="text-foreground/55 leading-relaxed">
              That means your blogs, emails, reports, sales briefs, and landing pages can all be powered by the same source of truth.
            </p>
          </div>

          <div className="glass rounded-xl border border-white/10 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {pipelineStages.map((stage, index) => (
                <div key={stage.label} className="relative">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4 h-full">
                    <div className="text-[10px] font-mono text-primary/70 mb-2">
                      STEP {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="text-sm font-medium text-white leading-snug">{stage.label}</div>
                    {stage.sub && (
                      <div className="text-[11px] text-foreground/45 mt-1 font-mono">{stage.sub}</div>
                    )}
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-3.5 h-3.5 text-primary/60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Outputs */}
        <section id="what-it-produces" className="mt-32 scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              OUTPUTS
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              What It Can Produce
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              Every asset is generated from the same intelligence layer, so blogs, emails, briefs, and reports stay consistent with how your business actually talks about itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outputs.map((output, i) => (
              <motion.div
                key={output.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="glass rounded-xl border border-white/10 p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {output.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{output.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{output.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Differentiator */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              DIFFERENTIATOR
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              This Is Not Another AI Writing Tool
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-3">
              Most AI writing tools generate content from prompts. AI Content Ops Station generates content from a system.
            </p>
            <p className="text-foreground/55 leading-relaxed">
              That system includes structured inputs, reasoning layers, quality checks, approval gates, reusable templates, and cost-aware model routing.
            </p>
          </div>

          <div className="glass rounded-xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="px-6 py-4 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-1">
                  BASIC AI WRITER
                </div>
                <div className="text-sm font-semibold text-foreground/80">Prompt-driven, one-off</div>
              </div>
              <div className="px-6 py-4 bg-primary/[0.04]">
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-1">
                  AI CONTENT OPS STATION
                </div>
                <div className="text-sm font-semibold text-white">System-driven, repeatable</div>
              </div>
            </div>
            <div className="divide-y divide-white/10 border-t border-white/10">
              {comparisonRows.map((row) => (
                <div key={row.basic} className="grid grid-cols-1 md:grid-cols-2">
                  <div className="px-6 py-4 text-sm text-foreground/60 md:border-r border-white/10">
                    {row.basic}
                  </div>
                  <div className="px-6 py-4 text-sm text-white flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{row.station}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              How the System Works
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              Six controlled steps from raw business data to approved, publishable assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="rounded-xl border border-white/10 bg-black/20 p-6"
              >
                <div className="w-9 h-9 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-mono text-xs mb-5">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Best-fit customers */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              BEST FIT
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Built For Teams Sitting On Useful Information They Are Not Fully Using
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              AI Content Ops Station is a fit if your business already has valuable knowledge, but no efficient way to turn it into content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, i) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="glass rounded-xl border border-white/10 p-6"
              >
                <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-3">
                  USE CASE 0{i + 1}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{useCase.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* System proof */}
        <section className="mt-32">
          <div className="glass rounded-xl border border-white/10 p-8 md:p-10">
            <div className="max-w-3xl mb-8">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                SYSTEM PROOF
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Powered By Production Infrastructure, Not Prompt Guesswork
              </h2>
              <p className="text-foreground/60 leading-relaxed mb-3">
                AI Content Ops Station is powered by reusable systems built inside ATLAS. Production AI content needs more than a good prompt — it needs a controlled pipeline.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {infrastructurePieces.map((piece) => (
                <div
                  key={piece.label}
                  className="rounded-lg border border-white/10 bg-black/20 p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {piece.icon}
                  </div>
                  <span className="text-sm text-foreground/75">{piece.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Offer */}
        <section className="mt-32">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 md:p-10 shadow-[0_0_40px_rgba(0,255,204,0.04)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                  THE OFFER
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                  Start With a Content Ops Audit
                </h2>
                <p className="text-foreground/60 leading-relaxed mb-4">
                  The first step is not building a massive system. The first step is finding where useful business knowledge already exists and mapping it to content outputs that can create value.
                </p>
                <p className="text-foreground/55 leading-relaxed mb-8">
                  The audit produces a clear picture of what is realistic to automate, what should stay manual, and where the early wins live.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/audit"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                  >
                    Book a Content Ops Audit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/audit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
                  >
                    Ask About a Pilot Build
                  </Link>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-6">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-4">
                  WHAT THE AUDIT INCLUDES
                </div>
                <ul className="space-y-3">
                  {auditDeliverables.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/75">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footnote */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-6 flex items-start gap-4">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/55 leading-relaxed">
            AI Content Ops Station is delivered as an implemented system, not a self-serve SaaS subscription. The audit defines which workflows, sources, and outputs are worth building first.
          </p>
        </div>
      </div>
    </main>
  );
}
