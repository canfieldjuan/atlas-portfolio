'use client';

import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Gauge,
  KeyRound,
  LineChart,
  LockKeyhole,
  Repeat2,
  Route,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';
import { generateFaqJsonLd } from '@/lib/seo';

const gatewayHref = buildAuditHref({
  interest: 'llm-gateway',
  source: 'atlas-llm-gateway',
  offer: 'llm-gateway-access',
});

const heroStats = [
  { label: 'WEDGE', value: 'Batch-priced Claude traffic' },
  { label: 'MODEL', value: 'BYOK + flat monthly tier' },
  { label: 'SURFACE', value: 'Hosted API + usage rollups' },
];

const painPoints = [
  'submit batch jobs',
  'poll terminal status',
  'parse result streams',
  'match custom IDs',
  'retry safely',
  'track per-account spend',
  'gate by plan',
  'store customer keys',
  'explain provider bills',
  'avoid cross-tenant leakage',
];

const endpoints = [
  {
    method: 'POST',
    path: '/api/v1/llm/chat',
    detail: 'Synchronous Claude chat proxy using the customer provider key stored server-side.',
  },
  {
    method: 'POST',
    path: '/api/v1/llm/chat/stream',
    detail: 'SSE streaming for user-facing requests that cannot wait on batch completion.',
  },
  {
    method: 'POST',
    path: '/api/v1/llm/batch',
    detail: 'Anthropic Message Batches behind a normal gateway surface with idempotency-key retries.',
  },
  {
    method: 'GET',
    path: '/api/v1/llm/batch/{id}',
    detail: 'Status polling and terminal usage writeback when batch results settle.',
  },
  {
    method: 'GET',
    path: '/api/v1/llm/usage',
    detail: 'Per-account token and cost rollups, including batch-discount visibility.',
  },
  {
    method: 'POST',
    path: '/api/v1/byok/keys',
    detail: 'Customer Anthropic keys encrypted at rest and resolved per request.',
  },
];

const savingsFlow = [
  {
    title: 'Keep real-time traffic real-time',
    detail:
      'Chat and streaming calls still route through low-latency endpoints when the user is waiting.',
  },
  {
    title: 'Move async work to batch',
    detail:
      'Backfills, evals, enrichment, report jobs, and non-interactive generation can use Anthropic Message Batches.',
  },
  {
    title: 'Hide the batch plumbing',
    detail:
      'Atlas handles submit, poll, terminal state, result matching, idempotency, and usage capture.',
  },
  {
    title: 'Show the discount in usage',
    detail:
      'Your usage dashboard separates synchronous and batch traffic so the savings path is visible.',
  },
];

const substrateFeatures = [
  {
    icon: <KeyRound className="w-5 h-5" />,
    title: 'Production API keys',
    detail: 'Long-lived atls_live_* keys for scripts and services, separate from dashboard JWT sessions.',
  },
  {
    icon: <LockKeyhole className="w-5 h-5" />,
    title: 'BYOK provider keys',
    detail: 'Customers keep their Anthropic relationship; Atlas encrypts keys at rest and injects them server-side.',
  },
  {
    icon: <LineChart className="w-5 h-5" />,
    title: 'Per-account usage',
    detail: 'Token, cost, provider, and batch rollups are scoped to the account that made the call.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Plan and rate gates',
    detail: 'Trial, starter, growth, and pro tiers control batch access, key count, and request limits.',
  },
  {
    icon: <Repeat2 className="w-5 h-5" />,
    title: 'Safe retries',
    detail: 'Idempotency-Key support keeps retry behavior controlled when clients or workers fail mid-request.',
  },
  {
    icon: <Gauge className="w-5 h-5" />,
    title: 'Cost-control substrate',
    detail: 'The gateway sits on routing, cache, tracing, reconciliation, and budget-guard infrastructure.',
  },
];

const tierCards = [
  {
    title: 'Trial',
    label: 'VALIDATE FIT',
    detail: 'Confirm the API shape, BYOK setup, usage visibility, and batch workflow on a limited tier.',
    cta: 'Request trial access',
    offer: 'llm-gateway-access',
  },
  {
    title: 'Starter',
    label: 'FIRST PRODUCTION JOBS',
    detail: 'For small teams moving evals, enrichment, and backfills off synchronous Claude calls.',
    cta: 'Discuss Starter',
    offer: 'llm-gateway-starter',
  },
  {
    title: 'Growth',
    label: 'HIGHER VOLUME',
    detail: 'For teams with steady async LLM workloads and a real need for account-level usage controls.',
    cta: 'Discuss Growth',
    offer: 'llm-gateway-growth',
    highlighted: true,
  },
  {
    title: 'Pro',
    label: 'PLATFORM TEAM',
    detail: 'For production teams that need higher limits, stronger review, and routing intelligence next.',
    cta: 'Discuss Pro',
    offer: 'llm-gateway-pro',
  },
];

const fit = [
  'You already use Claude or plan to use Claude in production.',
  'Some traffic is async: evals, backfills, enrichment, scoring, report jobs, or batch content generation.',
  'You want provider-key ownership without building key storage, usage tables, plan gates, and billing plumbing.',
  'You need usage visibility per customer, workspace, account, or product area.',
];

const notFit = [
  'Every request is user-facing and must stream immediately.',
  'You need provider-agnostic routing across every model on day one.',
  'You need SOC 2, custom deployment, or enterprise procurement before an MVP trial.',
  'You are trying to avoid having your own provider account or BYOK setup.',
];

const faqs = [
  {
    q: 'Is this a model provider?',
    a: 'No. Atlas LLM Gateway starts as a hosted BYOK gateway. You keep your Anthropic key and provider relationship; Atlas adds the API surface, plan gates, usage tracking, and batch workflow around it.',
  },
  {
    q: 'Where does the 50% savings come from?',
    a: 'The wedge is Anthropic Message Batches. Batch traffic is priced lower than synchronous traffic, but the native batch workflow is awkward. Atlas makes that path usable without every customer rebuilding submit, poll, retry, result matching, and usage accounting.',
  },
  {
    q: 'Do I have to rewrite my whole app?',
    a: 'No. Real-time calls can stay real-time through the chat and streaming endpoints. The biggest early win is moving non-interactive work to the batch endpoint first.',
  },
  {
    q: 'Is OpenRouter supported?',
    a: 'The MVP is Claude-first with Anthropic BYOK. OpenRouter and additional routing intelligence are planned expansion surfaces after the gateway has real customer traffic flowing through it.',
  },
  {
    q: 'How is Atlas paid if customers bring their own keys?',
    a: 'The MVP is a flat monthly subscription tier for the gateway infrastructure. Provider token billing stays with the customer, which makes the batch-savings wedge easy to verify.',
  },
];

const faqJsonLd = generateFaqJsonLd(
  faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

function GatewayDiagram() {
  const stages = [
    'Your app',
    'Atlas API key',
    'BYOK resolver',
    'Sync or batch route',
    'Usage ledger',
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 lg:p-8">
      <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-5">
        REQUEST PATH
      </div>
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage}>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">{stage}</div>
                <div className="text-[10px] font-mono text-foreground/35">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-3.5 h-3.5 text-primary/50" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
        <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
          WEDGE
        </div>
        <p className="text-sm text-foreground/65 leading-relaxed">
          Keep synchronous calls for interactive UX. Send async work through batch and make the savings visible.
        </p>
      </div>
    </div>
  );
}

export default function AtlasLlmGatewayPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
                <Route className="w-3 h-3" />
                <span>ATLAS LLM GATEWAY</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
                Cut the Claude bill for work that{' '}
                <span className="gradient-text">doesn&apos;t need to be real-time.</span>
              </h1>
              <p className="text-lg text-foreground/60 leading-relaxed mb-4">
                Atlas LLM Gateway is a hosted BYOK API for teams already using Anthropic. Route chat, streaming, and batch traffic through one gateway, track usage per account, and use Anthropic&apos;s batch discount without building batch infrastructure yourself.
              </p>
              <p className="text-sm text-foreground/45 leading-relaxed mb-8">
                Start with Claude. Keep your provider key. Pay Atlas for the gateway layer: API keys, plan gates, usage visibility, idempotency, and cost-control plumbing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={gatewayHref}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                >
                  Request Gateway Access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#api-surface"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
                >
                  See the API surface
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
                {heroStats.map((fact) => (
                  <div key={fact.label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-1">
                      {fact.label}
                    </div>
                    <div className="text-sm font-medium text-white">{fact.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <GatewayDiagram />
            </motion.div>
          </section>

          <section className="mt-32 max-w-4xl">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE PROBLEM
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              Anthropic batch can save money. Most teams never wire it up.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              The obvious optimization is simple: keep real-time product calls synchronous, but move offline jobs to Anthropic Message Batches. The integration is where teams stall.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-8">
              Once you account for all the surrounding infrastructure, the discount stops looking like one endpoint and starts looking like a platform project:
            </p>
            <div className="flex flex-wrap gap-2">
              {painPoints.map((point) => (
                <span
                  key={point}
                  className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-sm text-foreground/65"
                >
                  {point}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                THE WEDGE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Pay less for the traffic that can wait.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                The first sale is not &quot;replace your model stack.&quot; It is sharper: you already pay Anthropic, and a meaningful slice of that traffic does not need to be real-time. Atlas makes the batch path normal enough to use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {savingsFlow.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="rounded-xl border border-white/10 bg-black/20 p-6"
                >
                  <div className="w-9 h-9 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-mono text-xs mb-5">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section id="api-surface" className="mt-32 scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                MVP API SURFACE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                A small gateway surface around the calls teams already make.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                The MVP is Claude-first. It gives production scripts a stable Atlas API key, resolves the customer&apos;s Anthropic key server-side, writes account-scoped usage, and keeps batch retries safe.
              </p>
            </div>

            <div className="glass rounded-xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_1.4fr] border-b border-white/10 bg-white/[0.02]">
                <div className="px-5 py-4 text-[10px] font-mono text-foreground/40 tracking-widest">
                  METHOD
                </div>
                <div className="px-5 py-4 text-[10px] font-mono text-foreground/40 tracking-widest border-t md:border-t-0 md:border-l border-white/10">
                  PATH
                </div>
                <div className="px-5 py-4 text-[10px] font-mono text-foreground/40 tracking-widest border-t md:border-t-0 md:border-l border-white/10">
                  PURPOSE
                </div>
              </div>
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="grid grid-cols-1 md:grid-cols-[160px_1fr_1.4fr] border-b border-white/10 last:border-b-0"
                >
                  <div className="px-5 py-4 text-xs font-mono text-primary">{endpoint.method}</div>
                  <div className="px-5 py-4 text-sm font-mono text-white md:border-l border-white/10">
                    {endpoint.path}
                  </div>
                  <div className="px-5 py-4 text-sm text-foreground/60 leading-relaxed md:border-l border-white/10">
                    {endpoint.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                THE SUBSTRATE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                The boring infrastructure is the product.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Batch savings get the conversation. The reason teams stay is that Atlas removes the infrastructure every production AI team eventually has to build.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {substrateFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="glass rounded-xl border border-white/10 p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{feature.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl border border-white/10 p-8">
              <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-5">Good fit</h2>
              <div className="space-y-3">
                {fit.map((item) => (
                  <p key={item} className="text-sm text-foreground/65 leading-relaxed flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-8">
              <div className="w-11 h-11 rounded-lg bg-white/[0.04] text-foreground/50 flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-5">Not the first wedge</h2>
              <div className="space-y-3">
                {notFit.map((item) => (
                  <p key={item} className="text-sm text-foreground/55 leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                PRIVATE ACCESS
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Flat monthly tiers, no token markup conversation.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                The MVP is sold as gateway access. You keep provider billing with Anthropic, then pay Atlas for the gateway layer that makes batch, usage, BYOK, and plan controls operational.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tierCards.map((tier) => (
                <div
                  key={tier.title}
                  className={`rounded-xl border p-6 ${
                    tier.highlighted
                      ? 'border-primary/30 bg-primary/[0.06] shadow-[0_0_40px_rgba(0,255,204,0.05)]'
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    {tier.label}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{tier.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed mb-6">{tier.detail}</p>
                  <Link
                    href={buildAuditHref({
                      interest: 'llm-gateway',
                      source: 'atlas-llm-gateway',
                      offer: tier.offer,
                    })}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-32 rounded-xl border border-primary/20 bg-primary/5 p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                  WHAT COMES NEXT
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  Batch is the wedge. Routing intelligence is the expansion.
                </h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Once your LLM traffic flows through Atlas, the next layer is automatic batch-vs-sync routing, semantic caching, prompt-level observability, cost drift detection, and provider routing. The MVP starts where the ROI is easiest to prove.
                </p>
              </div>
              <Link
                href={gatewayHref}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm shrink-0"
              >
                Request Gateway Access
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Questions before you route traffic through it.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="rounded-xl border border-white/10 bg-black/20 p-6"
                >
                  <h3 className="text-base font-semibold text-white mb-3">{faq.q}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-xl border border-white/10 bg-black/20 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <BadgeDollarSign className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/55 leading-relaxed">
                No provider-key markup claim is hidden here: BYOK means provider billing stays yours. Atlas charges for the gateway infrastructure that makes lower-cost batchable traffic practical.
              </p>
            </div>
            <Link
              href="/systems"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium shrink-0"
            >
              Back to systems
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
