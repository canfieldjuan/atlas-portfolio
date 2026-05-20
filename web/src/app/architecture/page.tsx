'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Cpu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { buildAuditHref } from '@/lib/audit-routing';

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            ARCHITECTURE
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Reference architecture for production AI systems
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed mb-12">
            This is a representative system pattern, not a one-size-fits-all promise. The actual architecture is scoped per engagement, but the design principles stay consistent: deterministic data handling where possible, explicit control points, and clear boundaries between ingestion, reasoning, orchestration, and downstream outputs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-xl p-8 border border-border mb-12"
        >
          <h2 className="text-lg font-semibold text-white mb-3">What this page is for</h2>
          <p className="text-sm text-foreground/60 leading-relaxed mb-4">
            Buyers do not need implementation-level detail at the start, but they should understand how I think about system reliability, evidence, and operational control before committing to roadmap work.
          </p>
          <p className="text-sm text-foreground/60 leading-relaxed">
            If your project has security, deployment, or compliance constraints, those shape the final architecture directly and should be validated during the audit and roadmap stages.
          </p>
        </motion.div>

        {/* Pipeline Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-xl p-8 border border-border mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <Cpu className="text-primary w-6 h-6" />
            <h2 className="text-2xl font-medium">A representative pipeline blueprint</h2>
          </div>

          <div className="mb-12 border border-border rounded-lg overflow-hidden relative aspect-video">
            <Image
              src="/screenshot-pipeline-review.png"
              alt="Representative pipeline review dashboard"
              fill
              className="object-cover opacity-80 hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
          </div>

          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-surface">
            {[
              {
                title: "1. Controlled data ingestion",
                desc: "Data is collected, normalized, deduplicated, and stored with explicit handling rules before any model-dependent reasoning layer is introduced."
              },
              {
                title: "2. Evidence-backed retrieval and synthesis",
                desc: "Reasoning layers are grounded in structured retrieval, source traceability, and contract-based outputs so downstream artifacts can be reviewed instead of blindly trusted."
              },
              {
                title: "3. Workflow orchestration and control",
                desc: "Multi-step operations are routed through explicit workflow logic so tool calls, approvals, and failure states are observable and manageable."
              },
              {
                title: "4. Operational outputs and interfaces",
                desc: "The system produces usable business outputs such as alerts, summaries, CRM artifacts, search workflows, or operator-facing dashboards depending on project scope."
              }
            ].map((step, i) => (
              <div key={i} className="relative pl-12">
                <div className="absolute left-0 top-1 w-10 h-10 bg-background border border-primary/30 rounded-full flex items-center justify-center text-primary font-mono text-sm z-10">
                  0{i + 1}
                </div>
                <h3 className="text-xl text-white font-medium mb-2">{step.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="glass rounded-xl p-8 border border-border mb-16"
        >
          <h2 className="text-lg font-semibold text-white mb-3">What changes per project</h2>
          <p className="text-sm text-foreground/60 leading-relaxed mb-4">
            Deployment model, model providers, data residency, approval workflows, and monitoring depth are all scoped against the actual operating environment and buyer requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/process"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border rounded-md hover:bg-surface-hover transition-all text-sm text-foreground/80"
            >
              Review Process
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border rounded-md hover:bg-surface-hover transition-all text-sm text-foreground/80"
            >
              Review Security
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center bg-surface border border-border rounded-xl p-10"
        >
          <h2 className="text-2xl font-medium mb-4">Need architecture that fits your actual operating constraints?</h2>
          <p className="text-foreground/60 mb-8 max-w-xl mx-auto">
            Start with the Systems Audit. That is where architecture, risk boundaries, deployment constraints, and proof-of-concept scope get defined before build work begins.
          </p>
          <Link href={buildAuditHref({ source: 'architecture' })} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all">
            Start Systems Audit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
