'use client';

import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Search, FileText, Hammer, CheckCircle2, Rocket, LifeBuoy, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    phase: null,
    label: 'BEFORE WE START',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Start Systems Audit',
    timeline: '5 minutes',
    clientSees: 'You fill out a short form that goes directly into the audit intake queue.',
    whatHappens: 'I personally review completed submissions within 48 hours. If it looks like a fit, I\'ll reach out with a few clarifying questions or an invitation to a free 30-minute intro call.',
    outcome: 'We both decide if this is the right engagement. No pressure, no commitment.',
  },
  {
    phase: 'PHASE 1',
    label: 'THE ROADMAP — WEEK 1',
    icon: <Search className="w-5 h-5" />,
    title: 'We Map Your System Together',
    timeline: '1–2 hour session',
    clientSees: 'A focused video call where I interview your team about how things work today.',
    whatHappens: [
      'Walk me through your current process, start to finish',
      'Where does it break? Where do people get stuck?',
      'What tools and systems are involved?',
      'What does this cost you in time, money, or missed revenue?',
      'If I built the perfect system, what would your day look like?',
    ],
    outcome: 'I now have a complete picture of your operations, pain points, and the ROI of solving them.',
  },
  {
    phase: 'PHASE 1',
    label: 'THE ROADMAP — WEEKS 1–2',
    icon: <FileText className="w-5 h-5" />,
    title: 'I Audit, Architect, and Prototype',
    timeline: '5–8 working days',
    clientSees: 'Heads-down time where I do the deep technical work.',
    whatHappens: [
      'Map every data flow — where it comes from, where it goes',
      'Identify integration points (APIs, databases, third-party tools)',
      'Design the target architecture',
      'Build one working proof of concept — the most valuable piece, end to end',
      'Write the full technical blueprint document',
    ],
    outcome: 'A working prototype that proves the approach, and a blueprint that scopes what Phase 2 should deliver.',
  },
  {
    phase: 'PHASE 1',
    label: 'THE ROADMAP — END OF WEEK 2',
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: 'Blueprint Delivery & Phase 2 Proposal',
    timeline: '1-hour presentation',
    clientSees: 'A structured walkthrough of everything I found and built.',
    whatHappens: [
      'Here\'s what your system looks like today (the current state)',
      'Here\'s what I\'m proposing to build (the target architecture)',
      'Here\'s the working proof of concept (proof it works)',
      'Here\'s the fixed price and timeline for Phase 2',
    ],
    outcome: 'You now have everything you need to make a decision. If you stop here, you keep the blueprint and the prototype. No strings attached.',
  },
  {
    phase: 'PHASE 2',
    label: 'THE BUILD',
    icon: <Hammer className="w-5 h-5" />,
    title: 'Milestone-Based Implementation',
    timeline: '2–16 weeks depending on scope',
    clientSees: 'You review real, working progress every two weeks. Never months in the dark.',
    whatHappens: [
      'The project is broken into 2-week milestones',
      'Each milestone has a defined deliverable and a review checkpoint',
      'You see the system working incrementally — not just at the end',
      'Integration with your existing tools happens during the build, not after',
    ],
    outcome: 'A production-ready system, built exactly to the Phase 1 blueprint.',
  },
  {
    phase: 'PHASE 2',
    label: 'THE BUILD — FINAL MILESTONE',
    icon: <Rocket className="w-5 h-5" />,
    title: 'Launch, Handoff & Knowledge Transfer',
    timeline: 'Final week of Phase 2',
    clientSees: 'Your system goes live and your team knows how to operate it.',
    whatHappens: [
      'Integration testing in your production environment',
      'Knowledge transfer session — I walk your team through the system',
      'Full technical documentation delivered',
      'Monitoring and alerting confirmed operational',
    ],
    outcome: 'The system is yours. Fully documented, fully operational, fully understood by your team.',
  },
  {
    phase: null,
    label: 'AFTER LAUNCH',
    icon: <LifeBuoy className="w-5 h-5" />,
    title: 'Post-Launch Support',
    timeline: '30–60 days included',
    clientSees: 'I\'m still available after launch to catch anything that surfaces in the real world.',
    whatHappens: [
      'Bug fixes and edge-case handling',
      'Performance tuning based on real production data',
      'Optional monthly retainer for ongoing optimization',
    ],
    outcome: 'Confidence that the system holds up under real conditions — not just in a demo.',
  },
];

const trustItems = [
  {
    title: 'Deployment is scoped to your requirements',
    desc: 'Cloud, local, or hybrid patterns are evaluated per project. The deployment model is chosen against your operational and security constraints, not assumed in advance.',
  },
  {
    title: 'Scoped access only',
    desc: 'I only access what the project requires. Read-only where possible. Access boundaries and removal expectations are defined during the engagement.',
  },
  {
    title: 'Data handling is defined up front',
    desc: 'Client data is not repurposed by me for model training. Any third-party processing, retention, or environment constraints should be scoped explicitly during architecture and security review.',
  },
  {
    title: 'You own everything',
    desc: 'All code, documentation, architecture, and data artifacts are yours. No vendor lock-in, no proprietary dependencies.',
  },
];

const timelineEstimates = [
  { complexity: 'Light', example: 'Alert system, single automation, webhook integration', time: '2–4 weeks' },
  { complexity: 'Medium', example: 'Multi-source data pipeline, RAG system, agent workflow', time: '4–8 weeks' },
  { complexity: 'Heavy', example: 'Enterprise platform with multiple UIs, orchestration, monitoring', time: '8–16 weeks' },
];

const fitSignals = {
  good: [
    'You have a real operational bottleneck, not just general curiosity about AI.',
    'There is a business owner who can describe the workflow and make decisions.',
    'You are willing to pay for scoping before committing to a larger build.',
    'You need a system tied to operations, data, or internal workflows rather than a generic prototype.',
  ],
  bad: [
    'You only want free brainstorming or broad strategy without implementation intent.',
    'There is no owner, no budget range, or no path to an actual decision.',
    'You need a full enterprise procurement motion before a scoped roadmap can begin.',
    'The problem is still too vague to describe in terms of workflow, data, or ROI.',
  ],
};

const decisionGates = [
  {
    title: 'After the audit request',
    detail: 'I review the submission and decide whether it is worth moving into a real roadmap conversation.',
  },
  {
    title: 'After Phase 1',
    detail: 'You keep the blueprint and proof of concept even if we do not move into Phase 2.',
  },
  {
    title: 'Before Phase 2 starts',
    detail: 'Scope, price, delivery checkpoints, and security constraints are defined before build work begins.',
  },
];

export default function ProcessPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            THE PROCESS
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            From inquiry to live system
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed max-w-2xl">
            No black boxes. No months of silence. This is the typical engagement path from the audit request through delivery, handoff, and post-launch support.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mb-12 glass rounded-xl p-8 border border-primary/20 bg-primary/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Phase 1 at a glance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-black/30 border border-white/10 p-5">
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">FIXED FEE</div>
              <div className="text-2xl font-semibold text-white mb-1">$4,500</div>
              <p className="text-sm text-foreground/60">Roadmap engagement before any build work begins.</p>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 p-5">
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">TIMELINE</div>
              <div className="text-2xl font-semibold text-white mb-1">2 weeks</div>
              <p className="text-sm text-foreground/60">Discovery, audit, prototype, and blueprint delivery.</p>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/10 p-5">
              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">OUTPUT</div>
              <div className="text-base font-semibold text-white mb-1">Blueprint + proof of concept</div>
              <p className="text-sm text-foreground/60">Plus a fixed-price Phase 2 proposal if the fit is real.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Start Systems Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
            >
              Review Services & Pricing
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="glass rounded-xl p-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Good fit</h2>
            <div className="space-y-3">
              {fitSignals.good.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Probably not a fit</h2>
            <div className="space-y-3">
              {fitSignals.bad.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-white/20 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/10 hidden md:block" />

          <div className="space-y-4">
            {steps.map((step, i) => {
              const isPhase1 = step.phase === 'PHASE 1';
              const isPhase2 = step.phase === 'PHASE 2';

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.06 * i }}
                  className="relative md:pl-16"
                >
                  {/* Timeline node */}
                  <div className={`hidden md:flex absolute left-0 top-8 w-12 h-12 rounded-full border items-center justify-center z-10 ${
                    isPhase1
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : isPhase2
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/10 text-foreground/50'
                  }`}>
                    {step.icon}
                  </div>

                  <div className={`glass rounded-xl p-8 border ${
                    isPhase1
                      ? 'border-primary/15'
                      : isPhase2
                        ? 'border-blue-500/15'
                        : 'border-white/10'
                  }`}>
                    {/* Label */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {step.phase && (
                        <span className={`text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded ${
                          isPhase1
                            ? 'bg-primary/15 text-primary'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {step.phase}
                        </span>
                      )}
                      <span className="text-xs font-mono text-foreground/40 tracking-wider">{step.label}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-white mb-2">{step.title}</h2>

                    {/* Timeline badge */}
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-foreground/40 mb-5">
                      <Clock className="w-3 h-3" />
                      {step.timeline}
                    </div>

                    {/* What the client sees */}
                    <p className="text-foreground/60 text-sm leading-relaxed mb-5">
                      {step.clientSees}
                    </p>

                    {/* What actually happens */}
                    <div className="bg-black/30 rounded-lg p-5 mb-5">
                      <div className="text-[10px] font-mono text-foreground/30 tracking-widest mb-3">WHAT HAPPENS</div>
                      {Array.isArray(step.whatHappens) ? (
                        <div className="space-y-2">
                          {step.whatHappens.map((item, j) => (
                            <div key={j} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0 mt-1.5" />
                              <span className="text-sm text-foreground/60">{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/60">{step.whatHappens}</p>
                      )}
                    </div>

                    {/* Outcome */}
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80 font-medium">{step.outcome}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Trust & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-16 glass rounded-xl p-8 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Trust & Security</h2>
          </div>
          <p className="text-sm text-foreground/60 mb-8">How your data and infrastructure are handled throughout the engagement.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trustItems.map((item, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              Review current security posture and compliance options
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.48 }}
          className="mt-6 glass rounded-xl p-8 border border-white/10"
        >
          <h2 className="text-lg font-semibold text-white mb-2">Decision gates</h2>
          <p className="text-sm text-foreground/60 mb-6">
            The process is structured to reduce risk before either side commits to the next level of work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {decisionGates.map((gate, index) => (
              <div key={index} className="rounded-lg bg-black/30 border border-white/10 p-5">
                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">CHECKPOINT {index + 1}</div>
                <h3 className="text-sm font-medium text-white mb-2">{gate.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{gate.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Timeline Estimates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 glass rounded-xl p-8 border border-white/10"
        >
          <h2 className="text-lg font-semibold text-white mb-2">How long does Phase 2 take?</h2>
          <p className="text-sm text-foreground/60 mb-6">It depends on the complexity defined in your Phase 1 blueprint. Here are typical ranges:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timelineEstimates.map((est, i) => (
              <div key={i} className="bg-black/30 rounded-lg p-5">
                <div className="text-primary font-mono text-xl font-bold mb-1">{est.time}</div>
                <div className="text-white text-sm font-medium mb-2">{est.complexity} Complexity</div>
                <p className="text-foreground/50 text-xs leading-relaxed">{est.example}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">Ready to start at Step 1?</h2>
          <p className="text-foreground/60 mb-8 max-w-xl mx-auto">
            Start the Systems Audit. I review every submission personally and respond within 48 hours.
          </p>
          <Link href="/audit" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm">
            Start Systems Audit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
