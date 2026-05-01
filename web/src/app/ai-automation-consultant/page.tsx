import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  HelpCircle,
  Map,
  ShieldCheck,
} from 'lucide-react';
import { generateBreadcrumbJsonLd, generateFaqJsonLd } from '@/lib/seo';
import { buildAuditHref } from '@/lib/audit-routing';

const faqJsonLd = generateFaqJsonLd([
  {
    question: 'What does an AI automation consultant do?',
    answer:
      'An AI automation consultant maps an existing workflow, identifies where AI can safely reduce manual work, defines data and integration requirements, proves the riskiest part, and scopes the implementation before build work begins.',
  },
  {
    question: 'Do I need custom AI development or a SaaS tool?',
    answer:
      'Use SaaS when the workflow is generic and your team can adapt to the tool. Custom AI development makes more sense when the value depends on your data, approval rules, integrations, or internal process.',
  },
  {
    question: 'How much does AI automation consulting cost?',
    answer:
      'The Phase 1 Roadmap is $4,500 flat and includes discovery, audit, proof of concept, technical blueprint, and a fixed-price Phase 2 implementation proposal.',
  },
  {
    question: 'Can an AI workflow keep humans in control?',
    answer:
      'Yes. The safest automation work defines the human review points, approval states, failure handling, and audit trail before the system is implemented.',
  },
]);

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'AI Automation Consultant', path: '/ai-automation-consultant' },
]);

const heroFacts = [
  { label: 'PHASE 1', value: '$4,500 fixed fee' },
  { label: 'TIMELINE', value: '2-week roadmap' },
  { label: 'OUTPUT', value: 'Proof + fixed scope' },
];

const automationAreas = [
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Revenue workflow automation',
    detail:
      'Turn research, account signals, review data, and CRM context into repeatable sales or customer workflows.',
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: 'Data and intelligence pipelines',
    detail:
      'Collect, normalize, enrich, and monitor operational data so teams can act on trusted signals instead of manual exports.',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'Agent workflow orchestration',
    detail:
      'Route intent, call tools, draft outputs, and move work through approval queues with explicit failure handling.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Human-reviewed AI systems',
    detail:
      'Keep operators in control with review states, source trails, confidence notes, and clear handoffs before external actions.',
  },
];

const fitSignals = {
  good: [
    'There is a repetitive workflow with a clear owner.',
    'The team can name the data sources, tools, and handoffs involved.',
    'The output needs to land somewhere operational: CRM, dashboard, queue, report, or approval flow.',
    'A narrow proof of concept would make the build decision easier.',
  ],
  poor: [
    'The request is still a broad AI strategy conversation.',
    'There is no data source, workflow owner, or business outcome.',
    'The desired result is a generic chatbot that an existing SaaS tool already covers.',
    'Procurement or security constraints are too unclear to scope responsibly.',
  ],
};

const roadmapSteps = [
  {
    step: '01',
    title: 'Map the workflow',
    detail:
      'Define the current process, owner, data sources, decision points, review needs, and downstream systems.',
  },
  {
    step: '02',
    title: 'Prove the riskiest part',
    detail:
      'Build a narrow proof of concept around the part most likely to determine whether the larger system is worth building.',
  },
  {
    step: '03',
    title: 'Scope the implementation',
    detail:
      'Deliver the architecture, integration map, risk notes, timeline, and fixed-price Phase 2 proposal before build work begins.',
  },
];

const faqs = [
  {
    q: 'What does an AI automation consultant do?',
    a: 'I map the workflow, identify the useful automation boundary, define data and integration requirements, prove the riskiest part, and scope the implementation before build work begins.',
  },
  {
    q: 'Is this custom AI development or consulting?',
    a: 'Both, but in order. Phase 1 is consulting, architecture, and proof. Phase 2 is custom AI development once scope, price, and delivery risk are clear.',
  },
  {
    q: 'Can the system integrate with existing tools?',
    a: 'Yes, if the APIs, permissions, and workflow boundaries are clear. Common targets include CRMs, dashboards, databases, inboxes, forms, and internal tools.',
  },
  {
    q: 'What if the roadmap proves we should not build?',
    a: 'Then the roadmap did its job. You keep the blueprint and proof of concept, and you can pause, reduce scope, buy a simpler tool, or build internally.',
  },
];

export default function AiAutomationConsultantPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <section className="max-w-4xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
              <Map className="w-3 h-3" />
              <span>AI AUTOMATION CONSULTING</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mb-6">
              AI automation consulting for real operational workflows.
            </h1>
            <p className="text-lg md:text-xl text-foreground/60 leading-relaxed max-w-3xl mb-5">
              I help teams turn repetitive work, fragmented data, and manual handoffs into scoped AI systems. Every engagement starts with a fixed-fee roadmap so the proof, architecture, implementation scope, and price are clear before build work begins.
            </p>
            <p className="text-base text-foreground/50 leading-relaxed max-w-3xl">
              This is built for buyers who need more than AI advice: workflow automation, custom AI development, data pipelines, agent orchestration, and operator control designed around the way the business actually works.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                href={buildAuditHref({
                  interest: 'custom-build',
                  source: 'ai-automation-consultant',
                  offer: 'custom-build',
                })}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Start Systems Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
              >
                Review Pricing
              </Link>
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-20">
            {heroFacts.map((fact) => (
              <div key={fact.label} className="rounded-lg border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">
                  {fact.label}
                </div>
                <div className="text-base font-medium text-white">{fact.value}</div>
              </div>
            ))}
          </div>

          <section className="mb-20">
            <div className="max-w-3xl mb-8">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                WHAT THIS CAN COVER
              </div>
              <h2 className="text-3xl font-semibold text-white mb-4">
                AI automation should map to an operating system, not a loose demo.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                The useful scope depends on the workflow. These are common patterns that can be validated in Phase 1 before deciding whether to build.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {automationAreas.map((area) => (
                <div key={area.title} className="glass rounded-xl p-7 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {area.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{area.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{area.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
            <div className="glass rounded-xl p-8 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-5">Good fit when</h2>
              <div className="space-y-4">
                {fitSignals.good.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-xl p-8 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-5">Probably not the right fit when</h2>
              <div className="space-y-4">
                {fitSignals.poor.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full border border-white/20 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                THE ROADMAP
              </div>
              <h2 className="text-3xl font-semibold text-white mb-4">
                A fixed-fee first step before custom implementation.
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Phase 1 is designed to reduce delivery risk. You get enough proof and architecture to make a build decision before committing to a larger implementation.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roadmapSteps.map((step) => (
                <div key={step.step} className="glass rounded-xl p-7 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <span className="font-mono text-primary text-base font-bold">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-xl p-8 border border-white/10 mb-20">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Common questions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-sm font-medium text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Have a workflow worth scoping?
            </h2>
            <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
              Start with the Systems Audit. I will review whether the workflow has enough ownership, data access, and business value to justify a Phase 1 Roadmap.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={buildAuditHref({
                  interest: 'custom-build',
                  source: 'ai-automation-consultant',
                  offer: 'custom-build',
                })}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Start Systems Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/resources/how-to-scope-ai-automation-project"
                className="inline-flex items-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
              >
                Read Scoping Guide
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
