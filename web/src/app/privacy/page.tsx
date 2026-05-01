'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  LockKeyhole,
  Server,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

const policySections = [
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Audit request intake',
    detail:
      'The Systems Audit form collects the information you submit: contact details, company or project context, workflow bottlenecks, data sources, timeline, security requirements, and budget range.',
    bullets: [
      'Used to evaluate fit and decide whether a Phase 1 Roadmap makes sense.',
      'Not a payment form and not a production data upload flow.',
      'Do not submit passwords, secrets, regulated records, or confidential datasets through the public form.',
    ],
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: 'Project data',
    detail:
      'If an engagement moves forward, project data handling is scoped in the roadmap and implementation plan. Different projects can require different cloud, local, or hybrid deployment patterns.',
    bullets: [
      'Data access should be limited to what is needed for the scoped workflow.',
      'Sensitive sources, retention limits, and access controls should be identified before build work.',
      'Client data is not repurposed by me for model training.',
    ],
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Third-party processing',
    detail:
      'Some builds may involve model providers, hosting vendors, databases, APIs, or automation services. Those choices are implementation decisions, not assumptions made before scoping.',
    bullets: [
      'Provider, retention, and data residency requirements should be raised during audit or roadmap work.',
      'Local or hybrid patterns can be evaluated when cloud processing is not acceptable.',
      'Vendor-specific constraints should be documented before production deployment.',
    ],
  },
  {
    icon: <LockKeyhole className="w-5 h-5" />,
    title: 'Ownership',
    detail:
      'The engagement model is built around buyer-owned deliverables. Code, documentation, architecture notes, and scoped data artifacts belong to the client unless a written agreement says otherwise.',
    bullets: [
      'No proprietary platform lock-in is required by the engagement model.',
      'Phase 1 deliverables remain useful even if you decide not to continue to Phase 2.',
      'Production ownership and operational responsibilities should be explicit before launch.',
    ],
  },
];

const practicalRules = [
  'Use the public audit form for fit context, not secrets or raw production data.',
  'Flag security, compliance, residency, or vendor restrictions early.',
  'Treat Phase 1 as the place to define what data is needed and how it should be handled.',
  'Do not approve a larger build until deployment and data boundaries are written down.',
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <ShieldCheck className="w-3 h-3" />
            <span>PRIVACY</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Privacy and data handling
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            This page explains how information should be handled during the public audit request, roadmap work, and custom AI implementation. It is intentionally practical: do not send sensitive production data until the project has a scoped handling plan.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 mb-12"
        >
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-white mb-2">Public-form boundary</h2>
              <p className="text-sm text-foreground/70 leading-relaxed">
                The Systems Audit form is for project context and fit review. Share enough detail to evaluate the workflow, but do not include credentials, private keys, regulated records, or raw confidential datasets in the public form.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6 mb-12">
          {policySections.map((section, index) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + index * 0.06 }}
              className="glass rounded-xl p-8 border border-white/10"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
                  <p className="text-sm text-foreground/60 leading-relaxed">{section.detail}</p>
                </div>
                <div className="lg:w-2/3 lg:border-l lg:border-white/10 lg:pl-8">
                  <div className="text-[10px] font-mono text-foreground/35 tracking-widest mb-4">PRACTICAL RULES</div>
                  <div className="space-y-3">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/70 leading-relaxed">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 mb-12"
        >
          <div className="glass rounded-xl p-8 border border-white/10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">SHORT VERSION</div>
            <h2 className="text-xl font-semibold text-white mb-4">Data boundaries are part of scope.</h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              A serious AI build needs explicit boundaries around source data, model providers, access, retention, review states, and deployment. If those boundaries are unclear, Phase 1 should clarify them before Phase 2 is priced.
            </p>
          </div>
          <div className="glass rounded-xl p-8 border border-white/10">
            <div className="space-y-3">
              {practicalRules.map((rule) => (
                <div key={rule} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
                  <p className="text-sm text-foreground/70 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[0_0_40px_rgba(0,255,204,0.04)]"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">Need security context too?</h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            Privacy covers intake and data-handling expectations. Security covers compliance posture, questionnaires, deployment options, and buyer qualification. About explains the operating model behind the engagement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/security" className="inline-flex items-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review Security
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm">
              Review About
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={buildAuditHref({ source: 'privacy' })} className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm">
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
