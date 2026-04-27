'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Map, Wrench, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { generateFaqJsonLd } from '@/lib/seo';

const faqJsonLd = generateFaqJsonLd([
  {
    question: "How much does an AI solutions architect cost?",
    answer: "Phase 1 Roadmap is a flat fee of $4,500 and includes discovery, system audit, working proof of concept, and a fixed-price Phase 2 proposal. Phase 2 custom implementation typically ranges from $8,000 to $50,000+ depending on complexity.",
  },
  {
    question: "What if my AI automation project is small?",
    answer: "The two-phase model scales down just as well. A simple alert pipeline or automation workflow still starts with a Roadmap — it just results in a smaller, faster Phase 2.",
  },
  {
    question: "Do you offer custom AI development services or just consulting?",
    answer: "Both. Phase 1 is the consulting and architecture roadmap: discovery, audit, proof of concept, and fixed-scope blueprint. Phase 2 is the custom AI development and implementation work, priced before build begins.",
  },
  {
    question: "Do you work as an AI automation consultant for startups and remote teams?",
    answer: "Yes, when there is a clear workflow owner, real data, and an implementation path. The work can fit startups, founder-led teams, and remote US or international teams that need AI workflow automation tied to operations.",
  },
  {
    question: "Do AI consultants bill hourly?",
    answer: "Not this one. Every engagement is flat-fee or fixed-price. Phase 1 is $4,500 flat. Phase 2 is a fixed price agreed before any work begins. No hourly billing, no surprise invoices.",
  },
  {
    question: "How is data security handled during an AI consulting engagement?",
    answer: "The deployment model is scoped to the buyer's operational and security requirements. Cloud, local, and hybrid patterns can be evaluated per project. Client data is not repurposed by me for model training, and any third-party processing or retention constraints should be defined during architecture and security review.",
  },
  {
    question: "Who owns the code and deliverables from an AI consulting project?",
    answer: "You do. All code, documentation, architecture, and data artifacts are yours. No vendor lock-in, no proprietary dependencies.",
  },
]);

const fitSummary = {
  bestFor: [
    'Teams with a real workflow, data, or operational bottleneck to solve.',
    'Buyers who want fixed-fee scoping before committing to a larger build.',
    'Projects where architecture, integrations, and delivery risk need to be defined up front.',
  ],
  notIdeal: [
    'Free-form strategy conversations without implementation intent.',
    'Very early ideas with no owner, no workflow definition, and no budget path.',
    'Procurement-heavy motions that require enterprise compliance before scoped roadmap work can begin.',
  ],
};

const buyerLanguage = [
  {
    term: 'AI automation consultant',
    detail: 'When the work is about turning repetitive operational processes into reliable software-backed workflows.',
  },
  {
    term: 'AI workflow automation consultant',
    detail: 'When the bottleneck crosses inboxes, CRMs, calendars, dashboards, approvals, or internal queues.',
  },
  {
    term: 'Custom AI development services',
    detail: 'When the solution needs code, integrations, data pipelines, dashboards, and deployment, not just advice.',
  },
  {
    term: 'AI consultant for startups',
    detail: 'When a smaller team has a concrete workflow, budget path, and enough urgency to scope a build responsibly.',
  },
  {
    term: 'Remote AI consultant',
    detail: 'When the engagement can be scoped and delivered through async review, video sessions, shared docs, and milestone demos.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
            SERVICES & PRICING
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Solutions, not hours.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Every engagement starts with a fixed-fee roadmap before any build work begins. The goal is simple: define scope, prove the approach, and price the implementation before either side takes on larger delivery risk.
          </p>
        </motion.div>

        {/* Two Phase Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">

          {/* Phase 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass rounded-xl p-8 border border-white/10 flex flex-col"
          >
            <div className="text-xs font-mono text-foreground/40 tracking-widest mb-4">PHASE 1</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Map className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white">The Roadmap</h2>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold text-white">$4,500</span>
            </div>
            <p className="text-xs text-foreground/40 font-mono mb-6">Flat fee. Credited toward Phase 2.</p>
            <p className="text-foreground/60 text-sm leading-relaxed mb-8">
              The standard first step for every engagement. Before I build anything, we map the terrain together. You walk away with a working proof of concept and a fixed-price proposal for the full build, even if you decide to stop there.
            </p>
            <div className="space-y-3 mb-10 flex-1">
              {[
                '2-hour discovery session with your team',
                'Full audit of your current data flows, tools & bottlenecks',
                'A written technical architecture document (your blueprint)',
                'One working end-to-end proof of concept',
                'A fully scoped Phase 2 proposal with fixed pricing',
              ].map((item, j) => (
                <div key={j} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">{item}</span>
                </div>
              ))}
            </div>
            <div className="text-xs font-mono text-foreground/40 border-t border-white/5 pt-4 mb-6">
              TIMELINE: 2 WEEKS
            </div>
            <Link
              href="/audit"
              className="group w-full py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-all text-sm bg-primary text-black hover:bg-primary/90"
            >
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Phase 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative glass rounded-xl p-8 border border-primary/30 bg-primary/5 shadow-[0_0_40px_rgba(0,255,204,0.05)] flex flex-col"
          >
            <div className="absolute -top-3 left-8 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full tracking-wider">
              THE BUILD
            </div>
            <div className="text-xs font-mono text-foreground/40 tracking-widest mb-4">PHASE 2</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white">Custom Implementation</h2>
            </div>
            <div className="mb-2">
              <span className="text-3xl font-bold text-white">Scoped in Phase 1</span>
            </div>
            <p className="text-xs text-foreground/40 font-mono mb-1">Fixed price. Agreed before any work begins.</p>
            <p className="text-xs text-primary/70 font-mono mb-6">Typical past range: $8k – $50k+ depending on complexity</p>
            <p className="text-foreground/60 text-sm leading-relaxed mb-8">
              The full build — whatever your system requires. Could be a data pipeline, an agentic workflow, a knowledge engine, a monitoring dashboard, or a combination of all of them. The scope, price, and timeline are locked in your Phase 1 blueprint.
            </p>
            <div className="space-y-3 mb-10 flex-1">
              {[
                'System built exactly to the Phase 1 blueprint',
                'Milestone-based delivery with progress reviews',
                'Integration with your existing tools and data sources',
                'Operator-facing UI where applicable',
                'Full documentation and knowledge transfer',
                'Post-launch support included (30–60 days)',
              ].map((item, j) => (
                <div key={j} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/70">{item}</span>
                </div>
              ))}
            </div>
            <div className="text-xs font-mono text-foreground/40 border-t border-white/5 pt-4 mb-6">
              TIMELINE: DEFINED IN PHASE 1 BLUEPRINT
            </div>
            <Link
              href="/capabilities"
              className="group w-full py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-all text-sm bg-white/5 text-white hover:bg-white/10 border border-white/10"
            >
              See What I Can Build
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16"
        >
          <div className="glass rounded-xl p-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Best fit for</h2>
            <div className="space-y-3">
              {fitSummary.bestFor.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Probably not ideal for</h2>
            <div className="space-y-3">
              {fitSummary.notIdeal.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
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
          transition={{ duration: 0.6, delay: 0.26 }}
          className="glass rounded-xl p-8 border border-white/10 mb-16"
        >
          <div className="max-w-2xl mb-8">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHAT TEAMS HIRE ME TO BUILD
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">
              The search term changes; the work is a scoped system.
            </h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Some teams call this AI automation consulting. Others need custom AI development, workflow automation, or an AI systems consultant. The useful distinction is whether there is a real process, real data, and a clear owner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyerLanguage.map((item) => (
              <div key={item.term} className="rounded-lg border border-white/10 bg-black/20 p-5">
                <h3 className="text-sm font-semibold text-white mb-2">{item.term}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="glass rounded-xl p-8 border border-white/10 mb-16"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white mb-2">Need more context before you commit?</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Review the delivery model on the process page or the current security posture before starting the audit. The pricing only makes sense if the engagement shape and risk boundaries fit your team.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/process"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Process
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/security"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
              >
                Review Security
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Common Questions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: 'What if my project is small?',
                a: 'The two-phase model scales down just as well. A simple alert pipeline or automation workflow still starts with a Roadmap — it just results in a smaller, faster Phase 2.',
              },
              {
                q: 'Do you offer custom AI development services or just consulting?',
                a: 'Both. Phase 1 is the consulting and architecture roadmap. Phase 2 is the custom AI development and implementation work, priced before build begins.',
              },
              {
                q: 'Do you work with startups or remote teams?',
                a: 'Yes, when there is a clear workflow owner, real data, and an implementation path. The model can fit startups, founder-led teams, and remote teams that need AI workflow automation tied to operations.',
              },
              {
                q: 'Why can\'t I skip Phase 1?',
                a: 'Phase 1 protects both of us. You get a working proof of concept before committing to a larger investment. I get a clear scope so I can price accurately and deliver on time.',
              },
              {
                q: 'How is Phase 2 priced?',
                a: 'Based on the complexity and scope defined in your Phase 1 blueprint. It\'s a fixed price — not hourly. No surprise invoices. Past builds have ranged from $8k to $50k+.',
              },
              {
                q: 'Do you bill hourly for anything?',
                a: 'No. Every engagement is flat-fee or fixed-price. If I\'m faster than expected, you pay the same. If it takes me longer, you still pay the same.',
              },
              {
                q: 'What about data security?',
                a: 'The deployment model is scoped to your operational and security requirements. Cloud, local, and hybrid patterns can be evaluated per project. If you have procurement or compliance constraints, those should be defined before build work begins.',
              },
              {
                q: 'Who owns the deliverables?',
                a: 'You do. All code, documentation, and architecture are yours. No vendor lock-in, no proprietary dependencies. Data-handling constraints should be scoped explicitly as part of the engagement.',
              },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-foreground/40 text-sm mt-16 max-w-2xl mx-auto"
        >
          All engagements require a completed Phase 1 Roadmap. Phase 2 pricing is finalized in the blueprint and fixed before any build begins. No hourly billing, no surprise invoices.
        </motion.p>

      </div>
    </main>
    </>
  );
}
