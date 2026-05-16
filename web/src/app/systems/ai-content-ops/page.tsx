'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  BarChart3,
  Calculator,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  HelpCircle,
  Layers,
  LayoutTemplate,
  Repeat,
  ScrollText,
  ShieldCheck,
  Workflow,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';
import { generateFaqJsonLd } from '@/lib/seo';

const pipelineStages = [
  { label: 'Support Tickets', sub: 'CSV • Last 90 days' },
  { label: 'Cluster by Intent' },
  { label: 'Rank by Volume' },
  { label: 'Extract Customer Wording' },
  { label: 'Generate FAQ Entries' },
  { label: 'Review & Publish', sub: 'You approve, edit, ship' },
];

const ticketCategories = [
  'Password resets',
  'Plan changes',
  'Refund requests',
  'Integration setup',
  'Feature questions',
  'Permission errors',
  'API limits',
  'Bug reports',
  'Cancellation flow',
  'Onboarding stuck',
];

const reportContents = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Ranked Question List',
    desc: 'Your top 50 customer questions ordered by ticket volume. Each row shows ticket count, sample customer wording, and a doc-exists / no-doc flag.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Gap Callout',
    desc: 'The 10 highest-volume questions with no help doc. Ranked, with estimated CS hours lost per month sitting on top of each one.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Stale Doc Callout',
    desc: 'Help docs that exist but have not been updated in over a year, ranked by how much ticket volume they are still drawing.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: '3 Publish-Ready FAQ Drafts',
    desc: 'Drafted from your top 3 gaps. Customer language, structured Q&A, no AI-voice tics. Source ticket IDs cited per claim.',
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    title: 'Deflection Math',
    desc: 'Estimated hours of CS time per month saved if you ship the top 10 FAQs. Conservative math, named assumptions, no hype.',
  },
  {
    icon: <Repeat className="w-5 h-5" />,
    title: 'Quarterly Delta',
    desc: 'Starting at report #2: what is new, what dropped off, what got worse. Your customer mix shifts — the report tracks it.',
  },
];

const comparisonRows: { basic: string; report: string }[] = [
  { basic: 'Starts with a blank prompt', report: 'Starts with your closed support tickets' },
  { basic: 'One draft at a time', report: 'A ranked list of every help doc you are missing, in one report' },
  { basic: 'You pick the topic', report: 'Your customers picked the topic — by ticket volume' },
  { basic: 'Sounds polished but generic', report: 'Reads in your customers’ own words, cited per claim' },
  { basic: 'You guess what to publish next', report: 'The volume math tells you what to publish first' },
  { basic: 'No proof a doc was needed', report: 'Every claim cited to source ticket IDs' },
  { basic: 'No recurrence — fire and forget', report: 'Quarterly, as your customers shift' },
];

const howItWorks = [
  {
    title: 'Support Tickets',
    detail:
      'What you send: a CSV export of closed tickets from the last 90 days. Subject lines and ticket bodies; no PII required, no internal notes needed. Most Zendesk admins export this in under 5 minutes. Larger pulls (180+ days) are fine and recommended for the first run.',
  },
  {
    title: 'Cluster by Intent',
    detail:
      'Tickets get grouped by what the customer was actually trying to do — not by tag, category, or assignee. Two tickets with different wording but the same intent ("password reset" / "can\'t log in") land in one cluster. This is where the volume math gets honest.',
  },
  {
    title: 'Rank by Volume',
    detail:
      'Clusters get sorted by how many tickets fell into each one. Top 50 surface. The long tail goes in an appendix you can browse but don\'t have to read. Volume is the only ranking signal — no opinion, no model judgment about what\'s "important."',
  },
  {
    title: 'Extract Customer Wording',
    detail:
      'For the top 50, we pull the verbatim phrasing customers used most often. Not paraphrased. This is the same language they\'ll Google — which is why the SEO benefit is structural, not a side effect.',
  },
  {
    title: 'Generate FAQ Entries',
    detail:
      'Drafts produced for the top 3 gaps (questions with no existing doc). 200-400 words each. Source ticket IDs cited per claim. Tone tuned to your brand if you send a style note; defaults to plain-spoken if you don\'t.',
  },
  {
    title: 'Review & Publish',
    detail:
      'The report is yours. You read it in 10 minutes. You hand the 3 FAQ drafts to whoever writes your help docs. They edit (always something — 5 to 30 minutes per draft). You publish. No auto-publish, no integration into your help center — your team controls that.',
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

const sampleRankedQuestions: {
  question: string;
  count: number;
  hasDoc: boolean;
  docNote?: string;
}[] = [
  { question: 'How do I reset my password?', count: 247, hasDoc: false },
  { question: 'Can I downgrade my plan?', count: 198, hasDoc: false },
  {
    question: 'Why am I getting permission errors?',
    count: 156,
    hasDoc: true,
    docNote: 'Last updated 2024',
  },
  { question: 'Where do I find my API keys?', count: 142, hasDoc: false },
  {
    question: 'How do I export my data?',
    count: 121,
    hasDoc: true,
    docNote: 'Last updated 2023',
  },
  { question: 'What does the audit log show?', count: 98, hasDoc: false },
  { question: 'How do I add a team member?', count: 84, hasDoc: false },
  { question: 'Why did my integration break?', count: 73, hasDoc: false },
];

const sampleFaqSourceTickets = ['#4521', '#4782', '#5103', '#5247', '#5390'];

function GapReportSample() {
  const undocumented = sampleRankedQuestions.filter((row) => !row.hasDoc).length;

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-black/20">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary/80" />
          <span className="text-sm font-medium text-white">The Gap Report</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            · Sample / Mock
          </span>
        </div>
        <div className="text-[11px] font-mono text-foreground/45">
          Range: last 90 days · 12,400 tickets ingested
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Headline number */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
            HEADLINE FINDING
          </div>
          <p className="text-base text-foreground/75 leading-relaxed">
            <span className="text-white font-medium">{undocumented} of your top 10 questions</span>{' '}
            have no help doc. Closing these would deflect an estimated{' '}
            <span className="text-white font-medium">~38 hours of CS time / month</span>.
          </p>
        </div>

        {/* Ranked list */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            TOP CUSTOMER QUESTIONS — RANKED BY VOLUME
          </div>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            {sampleRankedQuestions.map((row, i) => (
              <div
                key={row.question}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                  i < sampleRankedQuestions.length - 1 ? 'border-b border-white/5' : ''
                } ${!row.hasDoc ? 'bg-white/[0.015]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-foreground/40 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-foreground/80 truncate">
                    &ldquo;{row.question}&rdquo;
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono text-foreground/55 hidden sm:inline">
                    {row.count} tickets
                  </span>
                  {row.hasDoc ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-foreground/45">
                      <CheckCircle2 className="w-3.5 h-3.5 text-foreground/40" />
                      <span className="hidden sm:inline">Doc exists</span>
                      <span className="sm:hidden">Doc</span>
                      {row.docNote && (
                        <span className="text-foreground/35 hidden md:inline">
                          · {row.docNote}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary/90">
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">No doc</span>
                      <span className="sm:hidden">Gap</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample FAQ */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            SAMPLE FAQ DRAFT — GENERATED FROM YOUR TOP GAP
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-white mb-2">
              Q: How do I reset my password?
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed mb-4">
              If you&apos;ve forgotten your password, click <em>Forgot password</em> on the
              login screen and we&apos;ll send a reset link to the email on your account.
              The link expires in 30 minutes. If you don&apos;t see it, check spam — and
              make sure you&apos;re looking at the inbox tied to your account, not the
              billing address.
            </p>
            <p className="text-[11px] font-mono text-foreground/45">
              Sources:{' '}
              {sampleFaqSourceTickets.map((id, i) => (
                <span key={id}>
                  {i > 0 && <span className="text-foreground/30"> · </span>}
                  <span className="text-foreground/55">Ticket {id}</span>
                </span>
              ))}
            </p>
          </div>
        </div>

        <p className="text-xs text-foreground/45 leading-relaxed border-t border-white/5 pt-4">
          Mock data shown. Your version is built from your actual tickets — same
          structure, your customer questions, your wording, your source IDs.
        </p>
      </div>
    </div>
  );
}

function PipelineDiagram() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 lg:p-8">
      <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-5">
        FROM TICKETS TO HELP DOCS
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
              Your team answers the same 50 questions every week. At 15 minutes each, that&apos;s 12+ hours of CS time a help doc could deflect. You know your help center should be bigger. You don&apos;t have the time.
            </p>
            <p className="text-base text-foreground/65 leading-relaxed mb-5">
              Most teams miss this — your tickets are a ranked priority list of which help docs to build first, in your customers&apos; own words. Most help centers fail SEO because they&apos;re written by your team, not by your customers. Yours could be different.
            </p>
            <p className="text-base text-foreground/65 leading-relaxed mb-5">
              Upload a CSV of your last 90 days of tickets. We cluster questions by intent, rank by ticket volume, extract the customer&apos;s exact wording, generate publish-ready FAQ entries with source ticket IDs cited per claim. 48 hours to first report — then quarterly, as your product evolves and your customers change. No integration required.
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
            Your help center froze 18 months ago. Your support tickets didn&apos;t.
          </h2>
          <p className="text-foreground/65 leading-relaxed mb-4">
            Your team is fielding around 1,000 tickets per agent every month. Roughly 70% are variations of the same 50 questions, asked over and over. That list shifts every quarter as your product evolves and your customer mix changes.
          </p>
          <p className="text-foreground/65 leading-relaxed mb-8">
            Meanwhile, your help center was written around topics someone thought important 18 months ago. The high-volume questions of today aren&apos;t in it. The questions in it might not even be relevant anymore.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {ticketCategories.map((category) => (
              <span
                key={category}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-foreground/65"
              >
                {category}
              </span>
            ))}
          </div>
          <p className="text-foreground/65 leading-relaxed mb-3">
            You lose three things every week to this drift:
          </p>
          <ul className="text-foreground/65 leading-relaxed mb-8 space-y-2 ml-5 list-disc">
            <li>Hours of CS time on questions a doc would deflect</li>
            <li>SEO long-tail traffic to whoever DID document those questions</li>
            <li>Trust from new customers who Google your product and find a thin help center</li>
          </ul>
          <p className="text-foreground/55 leading-relaxed">
            Reading 30,000 tickets to find the patterns is a job no one has 40 hours to do. So the help center stays frozen.
          </p>
        </section>

        {/* Solution */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE SOLUTION
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              Your tickets already wrote the help center. We just have to read them.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              The pile of tickets you&apos;ve closed in the last 90 days is a ranked priority list of help docs — already there, just unsorted. Every question your customers ask multiple times is one help doc you don&apos;t have to invent the topic for.
            </p>
            <p className="text-foreground/65 leading-relaxed">
              The Gap Report does the reading. Six steps run on your CSV: cluster the questions, rank them by how many times your customers asked, pull out the exact wording they used, and draft FAQ entries that cite their tickets. You review and publish. 48 hours to first report. Quarterly after that as your customers shift.
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

        {/* Demo / Sample report */}
        <section id="demo" className="mt-32 scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHAT YOU GET
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              This is the Gap Report.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              Here&apos;s what 90 days of support tickets look like after we read them: a ranked priority list of help docs your customers are asking for, the ones already documented marked off, and the highest-volume gap drafted as a publish-ready FAQ. The version you&apos;ll get is built from your actual tickets, not these mock ones.
            </p>
          </div>
          <GapReportSample />
        </section>

        {/* What's in the report */}
        <section id="what-it-produces" className="mt-32 scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHAT&apos;S IN THE REPORT
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Six specifics, every quarter.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              Every Gap Report has the same six pieces. You read it in ten minutes, hand four of them to your tech writer, and ship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportContents.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="glass rounded-xl border border-white/10 p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6 max-w-3xl">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              WHAT THIS ISN&apos;T
            </div>
            <p className="text-sm text-foreground/65 leading-relaxed">
              The Gap Report isn&apos;t an AI blog writer, an email campaign tool, or a chatbot. We don&apos;t auto-publish anything. We don&apos;t replace your tech writer. We turn your tickets into a ranked priority list and ship you the highest-volume drafts — that&apos;s the whole job.
            </p>
          </div>
        </section>

        {/* Differentiator */}
        <section className="mt-32">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THIS VS THAT
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Not another AI writer.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-3">
              Most AI content tools start with a blank prompt. The Gap Report starts with a stack of tickets — your customers&apos; own questions, already asked, already counted. The output isn&apos;t a draft someone hopes lands. It&apos;s a list of what&apos;s missing, ranked by who asked.
            </p>
            <p className="text-foreground/65 leading-relaxed">
              The mechanism is the difference. Same model layer underneath. Different input. Different mental model.
            </p>
          </div>

          <div className="glass rounded-xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="px-6 py-4 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-1">
                  BASIC AI WRITER
                </div>
                <div className="text-sm font-semibold text-foreground/80">Blank-prompt content</div>
              </div>
              <div className="px-6 py-4 bg-primary/[0.04]">
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-1">
                  THE GAP REPORT
                </div>
                <div className="text-sm font-semibold text-white">Ticket-grounded, ranked</div>
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
                    <span>{row.report}</span>
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
              What happens at each step — and what you should be watching.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-3">
              The pipeline above shows the six steps at a glance. This is what each one actually involves on your side and ours. Where the work is. Where the judgment calls are. What can go wrong if you skip a check.
            </p>
            <p className="text-foreground/65 leading-relaxed">
              One thing worth flagging up front: the FAQ drafts come back written in <span className="text-white">your customers&apos; own words</span>, not your team&apos;s. That&apos;s the same wording they type into Google. SEO ranking on long-tail questions falls out structurally — it&apos;s not a side benefit you have to engineer for separately.
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
