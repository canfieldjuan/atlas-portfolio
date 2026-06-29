'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Waypoints,
  Building2,
  Rocket,
  AlertTriangle,
  ClipboardList,
  FileCheck2,
  CircleDashed,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

const currentStatus = [
  {
    title: 'SOC 2 Attestation',
    status: 'Not currently active/published',
    description: 'A SOC report is not currently presented on this site.',
    icon: <FileCheck2 className="w-5 h-5 text-primary" />,
  },
  {
    title: 'Questionnaire Support',
    status: 'Available during sales process',
    description: 'Structured procurement responses can be prepared per opportunity (CAIQ/SIG style where required).',
    icon: <ClipboardList className="w-5 h-5 text-primary" />,
  },
  {
    title: 'Deployment Model',
    status: 'Project-scoped',
    description: 'Cloud and local/on-prem deployment patterns can be scoped to buyer security requirements.',
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
  },
  {
    title: 'Public Trust Artifacts',
    status: 'Limited public publication',
    description: 'Detailed evidence packages are handled directly during security review and commercial discussions.',
    icon: <CircleDashed className="w-5 h-5 text-primary" />,
  },
];

const complianceOptions = [
  {
    title: 'Option A: Focus on non-SOC2-gated customers',
    description:
      'Prioritize fast-close buyers who accept strong security controls and review evidence without requiring immediate SOC 2 attestation.',
    fit: 'Best when speed and near-term revenue are higher priority than enterprise procurement access.',
    icon: <Rocket className="w-4 h-4 text-primary" />,
    border: 'border-border',
  },
  {
    title: 'Option B: Bridge with security package + questionnaires',
    description:
      'Use a structured security package (architecture, controls summary, questionnaire responses) to satisfy buyers that do not require immediate formal attestation.',
    fit: 'Best when many deals need assurance depth but can tolerate staged compliance.',
    icon: <ClipboardList className="w-4 h-4 text-primary" />,
    border: 'border-border',
  },
  {
    title: 'Option C: Start staged SOC 2 pathway',
    description:
      'Invest in scoped controls and audit preparation, then execute formal attestation milestones for enterprise-heavy pipeline segments.',
    fit: 'Best when strategic pipeline is repeatedly blocked by SOC 2 requirements.',
    icon: <Building2 className="w-4 h-4 text-primary" />,
    border: 'border-primary/30 bg-primary/5',
  },
];

const checklist = [
  {
    question: 'Is SOC 2 Type 2 mandatory before contract signature?',
    yes: 'Route to enterprise lane. Set timeline expectations early.',
    no: 'Proceed with standard security review package and technical scoping.',
  },
  {
    question: 'Will a Type 1 report plus roadmap satisfy procurement for phase one?',
    yes: 'Use staged compliance path with clear delivery dates.',
    no: 'Either defer deal or scope a non-production pilot only.',
  },
  {
    question: 'Do they accept questionnaire + evidence pack as interim assurance?',
    yes: 'Proceed with CAIQ/SIG style responses and controls walkthrough.',
    no: 'Treat as SOC-locked account and price in compliance effort.',
  },
  {
    question: 'Is this account strategic enough to justify compliance spend?',
    yes: 'Prioritize and include compliance cost in go-to-market plan.',
    no: 'Disqualify early and keep focus on faster-close segments.',
  },
];

export default function SecurityPage() {
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
            SECURITY & COMPLIANCE
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Security posture and compliance strategy
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            Security requirements vary by buyer segment. This page separates current operating status from potential compliance paths so buyers and internal teams can make decisions from factual ground.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-xl p-8 border border-border mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Current Status (April 27, 2026)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentStatus.map((item, index) => (
              <div key={index} className="rounded-lg border border-border bg-surface p-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-[11px] font-mono tracking-widest text-primary/80 mb-2">{item.status}</p>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.29 }}
          className="glass rounded-xl p-8 border border-border mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Report a Vulnerability</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div>
              <p className="text-sm text-foreground/65 leading-relaxed mb-4">
                If you find a security issue in the website, API routes, checkout flow,
                admin intake, or support-ticket CSV/report path, report it privately
                instead of opening a public GitHub issue.
              </p>
              <a
                href="mailto:juan@juancanfield.com?subject=Security%20report%20for%20juancanfield.com"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                juan@juancanfield.com
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">Safe report contents</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Include the affected URL or route, reproduction steps using non-sensitive
                test data, and the expected impact. Remove secrets, payment data,
                customer CSV content, and private tokens from screenshots or logs.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-foreground/45">
                A standard disclosure pointer is also available at{' '}
                <Link href="/.well-known/security.txt" className="text-primary hover:text-primary/80 transition-colors">
                  /.well-known/security.txt
                </Link>
                .
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Waypoints className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Practical Compliance Options</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {complianceOptions.map((option, index) => (
              <div key={index} className={`glass rounded-xl p-6 border ${option.border}`}>
                <div className="inline-flex items-center gap-2 mb-3 text-xs font-mono text-foreground/50 tracking-widest">
                  {option.icon}
                  PATH OPTION
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{option.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed mb-3">{option.description}</p>
                <p className="text-sm text-foreground/50">{option.fit}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          <div className="glass rounded-xl p-8 border border-border">
            <div className="inline-flex items-center gap-2 mb-4 text-xs font-mono text-foreground/40 tracking-widest">
              <Rocket className="w-4 h-4 text-primary" />
              FAST-CLOSE LANE
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Buyers without immediate SOC 2 gate
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed mb-4">
              Use controlled architecture, questionnaire responses, and explicit security scope in contract language to move quickly while maintaining credibility.
            </p>
            <p className="text-sm text-foreground/50">
              Recommended when close speed is the primary constraint.
            </p>
          </div>

          <div className="glass rounded-xl p-8 border border-primary/30 bg-primary/5">
            <div className="inline-flex items-center gap-2 mb-4 text-xs font-mono text-primary/80 tracking-widest">
              <Building2 className="w-4 h-4" />
              ENTERPRISE LANE
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Buyers with mandatory SOC 2 procurement
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed mb-4">
              Treat these as planned compliance investments. Set expectation on audit path, timing, and commercial checkpoints before heavy pre-sales effort.
            </p>
            <p className="text-sm text-foreground/50">
              Recommended only when account value justifies compliance overhead.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="glass rounded-xl p-8 border border-border mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Resolution Audit CSV Data Safety</h2>
          </div>
          <p className="text-sm text-foreground/65 mb-6 leading-relaxed">
            When you upload ticket logs for a Support Deflection gap analysis, we keep the flow
            narrow: direct private storage, deterministic processing, browser CSV minimization,
            backend redaction for supported report-output PII patterns, and bounded cleanup for
            uploaded files.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">1. Private Direct Storage</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Your CSV is uploaded directly from your browser to Vercel Blob private storage. The file does not reside on public routes or transient app servers, and only our authenticated backend can read it using secure signed tokens.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">2. Bounded 30-Day Retention</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Uploaded CSV ticket exports and local submission records are deleted after 30 days
                by the portfolio cleanup path. Generated report data is handled by the downstream
                report-processing system rather than by the cleanup job on this page.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">3. Deterministic Clustering</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                The report path uses deterministic parsing to analyze repeating themes. Raw ticket
                logs, subject lines, and description fields are not used for model training,
                fine-tuning, or third-party LLM clustering.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">4. Browser + Backend PII Controls</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Before upload, the intake interface minimizes common contact identifiers in the CSV
                body, including emails, formatted phone numbers, and IP addresses. The downstream
                report pipeline redacts supported PII patterns from generated Snapshot and report
                outputs before storage or delivery. This does not guarantee removal of every name,
                account number, or free-text identifier, and upload stops if the CSV cannot be
                safely decoded.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">5. Baseline Encryption</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Traffic runs over HTTPS, and stored blobs and relational database records rely on
                the managed encryption controls provided by the underlying Vercel Blob and database
                services.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">6. Stateless Compute</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Intake parsing and API handling run on stateless serverless functions. There are no long-running virtual machines with persistent local disks that could orphan or leak uploaded files.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass rounded-xl p-8 border border-border mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Waypoints className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Buyer Qualification Checklist</h2>
          </div>
          <p className="text-sm text-foreground/60 mb-6">
            Use these gates in discovery before solution design, proposal effort, or security review deep-dives.
          </p>
          <div className="space-y-4">
            {checklist.map((item, index) => (
              <div key={index} className="rounded-lg border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">{item.question}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
                    <p className="text-[10px] font-mono text-primary/80 tracking-widest mb-1">IF YES</p>
                    <p className="text-sm text-foreground/75">{item.yes}</p>
                  </div>
                  <div className="rounded-md bg-surface border border-border p-3">
                    <p className="text-[10px] font-mono text-foreground/50 tracking-widest mb-1">IF NO</p>
                    <p className="text-sm text-foreground/75">{item.no}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 mb-12"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-100/90 leading-relaxed">
              Claims are limited to controls and attestations currently in force. Questionnaire and architecture evidence can support review, but they are not a replacement for an independent SOC report.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center shadow-[var(--primary-glow)]"
        >
          <h2 className="text-2xl font-semibold text-foreground mb-3">Need a security-first engagement plan?</h2>
          <p className="text-foreground/60 mb-8 max-w-2xl mx-auto">
            Start with a Systems Audit. We can define technical scope, risk boundaries, and the right compliance lane before committing to build effort.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={buildAuditHref({ source: 'security' })}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Start Systems Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 glass border border-border hover:bg-surface-hover transition-all rounded-md text-foreground/80 font-medium text-sm"
            >
              Review Services & Pricing
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
