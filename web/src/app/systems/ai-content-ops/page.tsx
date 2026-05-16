'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Database,
  FileText,
  HelpCircle,
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
  Repeat,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ContentOpsDemo } from '@/components/ContentOpsDemo';
import { buildAuditHref } from '@/lib/audit-routing';
import { generateFaqJsonLd } from '@/lib/seo';

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

const coreInfrastructure = [
  { icon: <Layers className="w-4 h-4" />, label: 'Controlled generation pipelines' },
  { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Evidence-backed inputs' },
  { icon: <Gauge className="w-4 h-4" />, label: 'Quality gates' },
  { icon: <ShieldCheck className="w-4 h-4" />, label: 'Approval workflows' },
  { icon: <LayoutTemplate className="w-4 h-4" />, label: 'Reusable templates' },
  { icon: <ScrollText className="w-4 h-4" />, label: 'Report and content rendering' },
];

const optionalAtlasLayers = [
  { icon: <Workflow className="w-4 h-4" />, label: 'Reasoning and synthesis' },
  { icon: <GitBranch className="w-4 h-4" />, label: 'Model routing' },
  { icon: <Database className="w-4 h-4" />, label: 'LLM batching' },
  { icon: <Repeat className="w-4 h-4" />, label: 'Caching' },
  { icon: <Cpu className="w-4 h-4" />, label: 'Cost tracking' },
];

type PricingTier = {
  id: string;
  badge?: string;
  title: string;
  price: string;
  priceDetail?: string;
  sla?: string;
  description: string;
  includes: string[];
  example?: string;
  note: string;
  cta: string;
  href: string;
  highlighted?: boolean;
};

const pricingTiers: PricingTier[] = [
  {
    id: 'discovery',
    badge: 'RECOMMENDED FIRST STEP',
    title: 'Discovery Call',
    price: 'Free',
    sla: '30-minute call, booked within 48 hours',
    description:
      'In 30 minutes, you will know whether your data and content goals are a fit for an automated workflow — and what a build would look like.',
    includes: [
      'Walkthrough of your current content sources and workflow',
      'Quick read on whether automation is worth building for you',
      'Rough scope + price range if there is a fit',
      'No-pressure: if there is no real opportunity, we say so',
    ],
    note: "If there is no real opportunity, we will tell you — before you spend a dollar.",
    cta: 'Book a Discovery Call',
    href: buildAuditHref({
      interest: 'content-generation',
      source: 'ai-content-ops',
      offer: 'content-ops-discovery',
    }),
    highlighted: true,
  },
  {
    id: 'pilot',
    title: 'Pilot Build',
    price: 'Starts at $7,500',
    description:
      'Test one real content workflow using your data — and prove it works before scaling.',
    includes: [
      '1 data source',
      '1 content workflow',
      '2–3 output types',
      'Reusable templates',
      'Quality checks',
      'Human approval step',
      'Export or delivery workflow',
    ],
    example:
      'Customer reviews or CRM notes → extracted pain points → content angles → blog draft + email campaign + sales brief',
    note: 'Most pilot builds are scoped after a discovery call.',
    cta: 'Request a Pilot Build',
    href: buildAuditHref({
      interest: 'content-generation',
      source: 'ai-content-ops',
      offer: 'content-ops-pilot',
    }),
  },
  {
    id: 'full',
    title: 'Full Content Ops System',
    price: 'Starts at $15,000',
    description:
      'Best for businesses that want a repeatable content engine connected to multiple sources and workflows.',
    includes: [
      'Multiple data sources',
      'Multiple content workflows',
      'Approval queue',
      'Content generation station',
      'Reusable intelligence layer',
      'Reports and briefs',
      'Content calendar support',
      'Cost-aware model routing',
      'System documentation',
    ],
    note: 'Full builds are scoped based on data sources, integrations, output types, and approval requirements.',
    cta: 'Discuss a Full Build',
    href: buildAuditHref({
      interest: 'content-generation',
      source: 'ai-content-ops',
      offer: 'content-ops-full-build',
    }),
  },
];

const retainer = {
  title: 'Ongoing Optimization',
  price: 'Starts at $2,500/month',
  description:
    'Once the system is live, ongoing optimization keeps outputs relevant as your data, offers, and campaigns evolve.',
  includes: [
    'New content templates',
    'Prompt and workflow tuning',
    'Monthly performance review',
    'Integration updates',
    'Campaign expansion',
    'Quality gate improvements',
    'Reporting and support',
  ],
  cta: 'Ask About Ongoing Support',
  href: '/systems/ai-content-ops/ongoing-support',
};

const replacesItems: { instead: string; youGet: string }[] = [
  {
    instead: 'Guessing what to write',
    youGet: 'Content based on real customer signals',
  },
  {
    instead: 'Relying on generic AI outputs',
    youGet: 'Outputs tied to actual pain points',
  },
  {
    instead: 'Spending weeks on content that does not convert',
    youGet: 'Deliverables your team can use immediately',
  },
];

const pricingFaqs: { q: string; a: string }[] = [
  {
    q: 'Do I need clean or structured data to start AI Content Ops?',
    a: 'You do not need perfect data, but the better your source material is, the better the outputs will be. The discovery call identifies which data sources are usable now and which need cleanup before automation.',
  },
  {
    q: 'Is AI Content Ops a SaaS subscription or a custom build?',
    a: 'Not yet. AI Content Ops Station is currently delivered as a productized implementation. That means the system is designed around your workflow instead of forcing you into a generic tool.',
  },
  {
    q: 'Can AI Content Ops publish content automatically without human review?',
    a: 'It can, but the recommended setup starts with human approval. This keeps quality high and prevents weak content from going live without review.',
  },
  {
    q: 'What types of content can AI Content Ops produce?',
    a: 'Blogs, email campaigns, sales briefs, reports, landing page copy, social posts, internal knowledge briefs, and campaign angles.',
  },
  {
    q: 'What happens after the discovery call?',
    a: 'If there is a strong fit, you receive a written recommendation and rough build scope. The next step is usually a focused pilot build starting at $7,500. If there is no real fit, we say so — no follow-up sales pressure.',
  },
];

const faqJsonLd = generateFaqJsonLd(
  pricingFaqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-3">
              <Workflow className="w-3 h-3" />
              <span>THE GAP REPORT</span>
            </div>
            <p className="text-sm text-foreground/50 mb-6">
              From your support tickets. For your help center.
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              You have 30,000 closed support tickets in Zendesk and 12 help docs.
            </h1>
            <p className="text-lg text-foreground/65 leading-relaxed mb-5">
              Your team answers the same 50 questions every week. You know your help center should be bigger. You don&apos;t have the time.
            </p>
            <p className="text-base text-foreground/65 leading-relaxed mb-5">
              Most teams miss this — your tickets are a ranked priority list of which help docs to build first, in your customers&apos; own words. Most help centers fail SEO because they&apos;re written by your team, not by your customers. Yours could be different.
            </p>
            <p className="text-base text-foreground/65 leading-relaxed mb-5">
              Upload a CSV of your last 90 days of tickets. We cluster questions by intent, rank by ticket volume, extract the customer&apos;s exact wording, generate publish-ready FAQ entries with source ticket IDs cited per claim. 48 hours to first report. No integration required.
            </p>
            <p className="text-sm text-foreground/55 leading-relaxed mb-3">
              New product. The pipeline isn&apos;t — it already runs on real customer-review data, producing structured battle cards, vendor profiles, and intelligence reports.{' '}
              <Link href="/proof" className="text-primary/90 underline-offset-2 hover:underline">See live outputs →</Link>{' '}·{' '}
              <Link href="/architecture" className="text-primary/90 underline-offset-2 hover:underline">System architecture →</Link>
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed mb-8">
              First 5 design partners only — send a CSV by Friday to skip the waitlist.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={buildAuditHref({
                  interest: 'content-generation',
                  source: 'ai-content-ops',
                  offer: 'content-ops-discovery',
                })}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Send us your CSV — first analysis free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
              >
                See live outputs
                <ArrowRight className="w-4 h-4" />
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

        {/* Demo */}
        <section id="demo" className="mt-32 scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              DEMO
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              See exactly what it generates.
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              Pick a scenario and watch real customer data turn into a blog outline, an email sequence, a sales brief, a landing page section, and a social post — generated from the same intelligence layer. Demo runs on preloaded scenarios; no live model calls, no user input accepted.
            </p>
          </div>
          <ContentOpsDemo />
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
              Most AI writing tools generate content from blank prompts. AI Content Ops Station generates content from a system.
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
                AI Content Ops Station runs on reusable ATLAS production infrastructure: controlled generation pipelines, evidence-backed inputs, quality gates, approval workflows, reusable templates, and report/content rendering. When you need more than prompt-only generation, it plugs into separate ATLAS layers — reasoning and synthesis, model routing, LLM batching, caching, and cost tracking — without changing the Content Ops core.
              </p>
            </div>

            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              INSIDE AI CONTENT OPS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {coreInfrastructure.map((piece) => (
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

            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mt-8 mb-3">
              OPTIONAL ATLAS LAYERS &mdash; CONNECT WHEN YOU NEED THEM
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {optionalAtlasLayers.map((piece) => (
                <div
                  key={piece.label}
                  className="rounded-lg border border-dashed border-white/10 bg-black/10 p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-md bg-foreground/5 text-foreground/55 flex items-center justify-center shrink-0">
                    {piece.icon}
                  </div>
                  <span className="text-sm text-foreground/65">{piece.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What This Replaces */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHAT THIS REPLACES
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Most teams choose between guessing, generic AI, or agencies.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              All three produce content. None of them produce content that actually converts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-6 md:p-7">
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-5">
                INSTEAD OF
              </div>
              <ul className="space-y-3">
                {replacesItems.map((item) => (
                  <li
                    key={item.instead}
                    className="flex items-start gap-3 text-sm text-foreground/55 leading-relaxed"
                  >
                    <X className="w-4 h-4 text-foreground/40 shrink-0 mt-0.5" />
                    <span className="line-through decoration-foreground/30">{item.instead}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/[0.04] shadow-[0_0_40px_rgba(0,255,204,0.04)] p-6 md:p-7">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-5">
                YOU GET
              </div>
              <ul className="space-y-3">
                {replacesItems.map((item) => (
                  <li
                    key={item.youGet}
                    className="flex items-start gap-3 text-sm text-white leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item.youGet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing / Engagement Path */}
        <section id="pricing" className="mt-32 scroll-mt-24">
          <div className="max-w-3xl mb-12">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              PRICING / ENGAGEMENT PATH
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Don&apos;t build a content system until you know it will pay off.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              A free discovery call shows you exactly what content your data can produce — and whether it is worth building anything at all.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className={`relative rounded-xl p-6 md:p-7 flex flex-col ${
                  tier.highlighted
                    ? 'border border-primary/30 bg-primary/[0.04] shadow-[0_0_40px_rgba(0,255,204,0.04)]'
                    : 'glass border border-white/10'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-mono tracking-widest font-semibold whitespace-nowrap">
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white mb-3">{tier.title}</h3>
                <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  {tier.priceDetail && (
                    <span className="text-sm text-foreground/50">{tier.priceDetail}</span>
                  )}
                </div>
                {tier.sla && (
                  <p className="text-xs text-primary/80 font-mono mb-4">{tier.sla}</p>
                )}
                <p className={`text-sm text-foreground/65 leading-relaxed mb-5 ${tier.sla ? '' : 'mt-3'}`}>
                  {tier.description}
                </p>

                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
                  {tier.id === 'discovery' ? 'IN 30 MINUTES, YOU WILL KNOW:' : 'INCLUDES'}
                </div>
                <ul className="space-y-2 mb-5">
                  {tier.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/70 leading-snug"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {tier.example && (
                  <div className="rounded-lg border border-primary/30 bg-primary/[0.06] p-4 mb-5">
                    <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
                      EXAMPLE WORKFLOW
                    </div>
                    <div className="text-sm text-foreground/80 leading-relaxed">
                      Customer reviews or CRM notes
                      <span className="text-primary mx-1.5">→</span>
                      extracted pain points
                      <span className="text-primary mx-1.5">→</span>
                      content angles
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white leading-relaxed">
                      Blog draft + email campaign + sales brief
                      <span className="text-foreground/50 font-normal ml-2">(ready to ship)</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-foreground/45 leading-relaxed mb-5 italic flex-1">
                  {tier.note}
                </p>

                <Link
                  href={tier.href}
                  className={`group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium transition-colors text-sm ${
                    tier.highlighted
                      ? 'bg-primary text-black hover:bg-primary/90'
                      : 'border border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Retainer strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-xl border border-white/10 bg-black/20 p-6 md:p-7"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
              <div className="lg:w-1/3 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="w-3.5 h-3.5 text-primary" />
                  <div className="text-[10px] font-mono text-primary/70 tracking-widest">
                    ONGOING SUPPORT
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{retainer.title}</h3>
                <div className="text-2xl font-bold text-white mb-3">{retainer.price}</div>
                <p className="text-sm text-foreground/65 leading-relaxed">
                  {retainer.description}
                </p>
              </div>
              <div className="lg:flex-1">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
                  CAN INCLUDE
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-5 lg:mb-0">
                  {retainer.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/65 leading-snug"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:self-center shrink-0">
                <Link
                  href={retainer.href}
                  className="group inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 hover:bg-white/5 transition-colors rounded-md text-sm text-white whitespace-nowrap"
                >
                  {retainer.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-32 scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Common questions before booking.
            </h2>
            <p className="text-foreground/60 leading-relaxed">
              Quick answers to the questions that decide whether the engagement is a fit.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {pricingFaqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed pl-6">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-32">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 md:p-12 shadow-[0_0_40px_rgba(0,255,204,0.04)] text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                FINAL STEP
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Start With a Free Discovery Call
              </h2>
              <p className="text-foreground/60 leading-relaxed mb-8">
                30 minutes. No pressure. You will leave the call with a clear read on whether automation makes sense for your team — and a rough cost if it does. If there is no real opportunity, we will say so.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={buildAuditHref({
                    interest: 'content-generation',
                    source: 'ai-content-ops',
                    offer: 'content-ops-discovery',
                  })}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                >
                  Book a Free Discovery Call
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={buildAuditHref({
                    interest: 'content-generation',
                    source: 'ai-content-ops',
                    offer: 'content-ops-pilot',
                  })}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
                >
                  Ask About a Pilot Build
                </Link>
              </div>
            </div>
          </div>
        </section>

          {/* Footnote */}
          <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-6 flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/55 leading-relaxed">
              AI Content Ops Station is delivered as an implemented system, not a self-serve SaaS subscription. The discovery call defines which workflows, sources, and outputs are worth building first.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
