'use client';

import type { MutableRefObject } from 'react';
import { ChangeEvent, FormEvent, Suspense, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, ArrowRight, Copy, RotateCcw, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AUDIT_PROJECT_INTERESTS,
  auditOfferLabel,
  auditProjectInterestLabel,
  auditSourceLabel,
  isAuditProjectInterest,
} from '@/lib/audit-routing';

type AuditField =
  | 'fullName'
  | 'workEmail'
  | 'companyOrProjectUrl'
  | 'roleAndDecisionScope'
  | 'projectInterest'
  | 'biggestBottleneck'
  | 'automationDataSources'
  | 'currentTechEcosystem'
  | 'desiredTimeline'
  | 'securityRequirement'
  | 'deploymentConstraints'
  | 'roiGoal'
  | 'anticipatedInvestmentRange';

type CopyState = 'idle' | 'copied' | 'failed';
type AuditFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type AuditFormData = Record<AuditField, string>;

type AuditRouteContext = {
  projectInterest: string;
  sourcePage: string;
  sourcePageLabel: string;
  sourceOffer: string;
  sourceOfferLabel: string;
};

const createEmptyFormData = (projectInterest = ''): AuditFormData => ({
  fullName: '',
  workEmail: '',
  companyOrProjectUrl: '',
  roleAndDecisionScope: '',
  projectInterest,
  biggestBottleneck: '',
  automationDataSources: '',
  currentTechEcosystem: '',
  desiredTimeline: '',
  securityRequirement: '',
  deploymentConstraints: '',
  roiGoal: '',
  anticipatedInvestmentRange: '',
});

const buildAuditRouteContext = (params: { get(name: string): string | null }): AuditRouteContext => {
  const interestParam = params.get('interest') || params.get('projectInterest');
  const sourcePage = (params.get('source') || '').trim().slice(0, 120);
  const sourceOffer = (params.get('offer') || '').trim().slice(0, 160);

  return {
    projectInterest: isAuditProjectInterest(interestParam) ? interestParam : '',
    sourcePage,
    sourcePageLabel: auditSourceLabel(sourcePage),
    sourceOffer,
    sourceOfferLabel: auditOfferLabel(sourceOffer),
  };
};

const conversionSignals = [
  {
    icon: <Clock className="w-4 h-4" />,
    title: '5-7 minute brief',
    detail: 'Short answers are fine. The goal is to qualify fit, not write a full requirements document.',
  },
  {
    icon: <CheckCircle2 className="w-4 h-4" />,
    title: 'No payment here',
    detail: 'This is a review request. Phase 1 is only discussed if the workflow looks worth scoping.',
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    title: 'No sensitive data needed',
    detail: 'Share enough context to evaluate the workflow. Do not paste credentials, regulated records, or raw datasets.',
  },
];

const reviewCriteria = [
  'A real workflow with an owner',
  'Available data sources or systems',
  'A clear business outcome',
  'A budget path for Phase 1 if there is fit',
];

export default function AuditPage() {
  return (
    <Suspense fallback={<AuditPageFallback />}>
      <AuditPageContent />
    </Suspense>
  );
}

function AuditPageFallback() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-sm text-foreground/60">
          Loading Systems Audit...
        </div>
      </div>
    </main>
  );
}

function AuditPageContent() {
  const searchParams = useSearchParams();
  const routeContext = useMemo(() => buildAuditRouteContext(searchParams), [searchParams]);
  const [formData, setFormData] = useState<AuditFormData>(() =>
    createEmptyFormData(routeContext.projectInterest)
  );
  const [formErrors, setFormErrors] = useState<Partial<Record<AuditField, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [estimatedResponseHours, setEstimatedResponseHours] = useState<number | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const isInputDisabled = isSubmitting || isCopying;

  const requiredFields: Array<AuditField> = [
    'fullName',
    'workEmail',
    'companyOrProjectUrl',
    'roleAndDecisionScope',
    'projectInterest',
    'biggestBottleneck',
    'automationDataSources',
    'desiredTimeline',
    'securityRequirement',
    'anticipatedInvestmentRange',
  ];

  const fullNameRef = useRef<HTMLInputElement>(null);
  const workEmailRef = useRef<HTMLInputElement>(null);
  const companyOrProjectUrlRef = useRef<HTMLInputElement>(null);
  const roleAndDecisionScopeRef = useRef<HTMLInputElement>(null);
  const projectInterestRef = useRef<HTMLSelectElement>(null);
  const biggestBottleneckRef = useRef<HTMLTextAreaElement>(null);
  const automationDataSourcesRef = useRef<HTMLTextAreaElement>(null);
  const currentTechEcosystemRef = useRef<HTMLInputElement>(null);
  const desiredTimelineRef = useRef<HTMLSelectElement>(null);
  const securityRequirementRef = useRef<HTMLSelectElement>(null);
  const deploymentConstraintsRef = useRef<HTMLTextAreaElement>(null);
  const roiGoalRef = useRef<HTMLInputElement>(null);
  const anticipatedInvestmentRangeRef = useRef<HTMLSelectElement>(null);

  const getFieldRef = (field: AuditField): MutableRefObject<AuditFieldElement | null> => {
    switch (field) {
      case 'fullName':
        return fullNameRef;
      case 'workEmail':
        return workEmailRef;
      case 'companyOrProjectUrl':
        return companyOrProjectUrlRef;
      case 'roleAndDecisionScope':
        return roleAndDecisionScopeRef;
      case 'projectInterest':
        return projectInterestRef;
      case 'biggestBottleneck':
        return biggestBottleneckRef;
      case 'automationDataSources':
        return automationDataSourcesRef;
      case 'currentTechEcosystem':
        return currentTechEcosystemRef;
      case 'desiredTimeline':
        return desiredTimelineRef;
      case 'securityRequirement':
        return securityRequirementRef;
      case 'deploymentConstraints':
        return deploymentConstraintsRef;
      case 'roiGoal':
        return roiGoalRef;
      case 'anticipatedInvestmentRange':
        return anticipatedInvestmentRangeRef;
      default: {
        const exhaustiveCheck: never = field;
        return exhaustiveCheck;
      }
    }
  };

  const investmentRangeLabel = (value: string) => {
    const map: Record<string, string> = {
      phase1: 'Phase 1 Roadmap Only ($4,500)',
      '10k-25k': '$10k – $25k',
      '25k-50k': '$25k – $50k',
      '50k+': '$50k+',
      unsure: 'Not sure yet — help me scope it',
    };

    return map[value] || value || 'Not provided';
  };

  const desiredTimelineLabel = (value: string) => {
    const map: Record<string, string> = {
      asap: 'ASAP - active project now',
      '30-60': 'Within 30-60 days',
      quarter: 'This quarter',
      exploring: 'Exploring / no fixed date yet',
    };

    return map[value] || value || 'Not provided';
  };

  const securityRequirementLabel = (value: string) => {
    const map: Record<string, string> = {
      none: 'No formal requirement',
      questionnaire: 'Security questionnaire / evidence package',
      'soc2-type1': 'SOC 2 Type 1 acceptable',
      'soc2-type2': 'SOC 2 Type 2 required before production',
      unsure: 'Not sure yet - need guidance',
    };

    return map[value] || value || 'Not provided';
  };

  const requestSummary = useMemo(() => {
    const routingContext = [
      routeContext.sourcePageLabel ? `Source Page: ${routeContext.sourcePageLabel}` : null,
      routeContext.sourceOfferLabel ? `Source Offer: ${routeContext.sourceOfferLabel}` : null,
    ].filter((item): item is string => Boolean(item));

    return [
      'AI Systems Audit Request',
      `Name: ${formData.fullName.trim() || 'Not provided'}`,
      `Work Email: ${formData.workEmail.trim() || 'Not provided'}`,
      `Company / Project URL: ${formData.companyOrProjectUrl.trim() || 'Not provided'}`,
      `Role / Decision Scope: ${formData.roleAndDecisionScope.trim() || 'Not provided'}`,
      `Primary Interest: ${auditProjectInterestLabel(formData.projectInterest)}`,
      ...(routingContext.length > 0 ? routingContext : []),
      `Biggest Manual Bottleneck:\n${formData.biggestBottleneck.trim() || 'Not provided'}`,
      `What to automate:\n${formData.automationDataSources.trim() || 'Not provided'}`,
      `Current Tech Ecosystem: ${formData.currentTechEcosystem.trim() || 'Not provided'}`,
      `Desired Timeline: ${desiredTimelineLabel(formData.desiredTimeline)}`,
      `Security / Compliance Requirement: ${securityRequirementLabel(formData.securityRequirement)}`,
      `Deployment / Data Constraints:\n${formData.deploymentConstraints.trim() || 'Not provided'}`,
      `Success / ROI: ${formData.roiGoal.trim() || 'Not provided'}`,
      `Anticipated Investment Range: ${investmentRangeLabel(formData.anticipatedInvestmentRange)}`,
    ].join('\n\n');
  }, [formData, routeContext]);

  const isValidEmail = (value: string) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const handleChange =
    (field: AuditField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      if (isSubmitted) {
        setIsSubmitted(false);
      }
      setFormErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    };

  const submitAudit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccessful(false);
    setCopyState('idle');
    setSubmissionId(null);
    setEstimatedResponseHours(null);
    setSubmissionStatus('Submitting your audit request...');

    const nextErrors: Partial<Record<AuditField, string>> = {};

    requiredFields.forEach((field) => {
      const value = formData[field].trim();
      if (!value) {
        nextErrors[field] = 'This field is required.';
      }
    });

    const normalizedEmail = formData.workEmail.trim();
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      nextErrors.workEmail = 'Please enter a valid email address.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setSubmissionStatus('Please fix the highlighted fields to continue.');
      const firstErrorField = requiredFields.find((field) => !!nextErrors[field]);
      if (firstErrorField) {
        const errorFieldRef = getFieldRef(firstErrorField).current;
        if (errorFieldRef) {
          errorFieldRef.focus();
          errorFieldRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      setIsSubmitting(false);
      return;
    }

    try {
      let responsePayload:
        | {
            ok: boolean;
            requestId?: string;
            delivery?: string;
            deliveries?: string[];
            warnings?: string[];
            error?: string;
            estimatedResponseHours?: number;
          }
        | null = null;

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fullName: formData.fullName.trim(),
          workEmail: normalizedEmail,
          companyOrProjectUrl: formData.companyOrProjectUrl.trim(),
          roleAndDecisionScope: formData.roleAndDecisionScope.trim(),
          projectInterest: formData.projectInterest.trim(),
          projectInterestLabel: auditProjectInterestLabel(formData.projectInterest),
          sourcePage: routeContext.sourcePage,
          sourcePageLabel: routeContext.sourcePageLabel,
          sourceOffer: routeContext.sourceOffer,
          sourceOfferLabel: routeContext.sourceOfferLabel,
          biggestBottleneck: formData.biggestBottleneck.trim(),
          automationDataSources: formData.automationDataSources.trim(),
          currentTechEcosystem: formData.currentTechEcosystem.trim(),
          desiredTimeline: formData.desiredTimeline.trim(),
          desiredTimelineLabel: desiredTimelineLabel(formData.desiredTimeline),
          securityRequirement: formData.securityRequirement.trim(),
          securityRequirementLabel: securityRequirementLabel(formData.securityRequirement),
          deploymentConstraints: formData.deploymentConstraints.trim(),
          roiGoal: formData.roiGoal.trim(),
          anticipatedInvestmentRangeLabel: investmentRangeLabel(formData.anticipatedInvestmentRange),
        }),
      });
      responsePayload = (await response.json()) as {
        ok: boolean;
        requestId?: string;
        delivery?: string;
        deliveries?: string[];
        warnings?: string[];
        error?: string;
        estimatedResponseHours?: number;
      };
      const payload = responsePayload || { ok: false };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Submission failed. Try again or copy the summary.');
      }

      if (payload.requestId) {
        setSubmissionId(payload.requestId);
      }
      if (typeof payload.estimatedResponseHours === 'number') {
        setEstimatedResponseHours(payload.estimatedResponseHours);
      }
      setSubmissionSuccessful(true);
      setSubmissionError(null);
      if (payload.deliveries?.includes('atlas-crm-event') && payload.deliveries?.includes('email')) {
        setSubmissionStatus('Request submitted to Atlas CRM and notification email queued.');
      } else if (payload.deliveries?.includes('atlas-crm-event')) {
        setSubmissionStatus('Request submitted to Atlas CRM.');
      } else if (payload.deliveries?.includes('email')) {
        setSubmissionStatus('Request submitted and notification email queued.');
      } else if (payload.deliveries?.includes('file')) {
        setSubmissionStatus('Request saved to the fallback intake queue.');
      } else {
        setSubmissionStatus('Request submitted to the intake queue.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed. Copy the summary and send it manually.';
      setSubmissionError(message);
      setSubmissionStatus('Submission failed. You can retry or manually copy the summary.');
    } finally {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitAudit();
  };

  const copySummary = async () => {
    if (isCopying) {
      return;
    }
    setIsCopying(true);
    setSubmissionStatus('Copying summary to clipboard...');
    setCopyState('idle');
    try {
      await navigator.clipboard.writeText(requestSummary);
      setCopyState('copied');
      setSubmissionStatus('Summary copied.');
    } catch {
      setCopyState('failed');
      setSubmissionStatus('Copy failed. Manually select and copy the summary text.');
    } finally {
      setIsCopying(false);
    }
  };

  const resetForm = () => {
    setFormData(createEmptyFormData(routeContext.projectInterest));
    setFormErrors({});
    setIsSubmitted(false);
    setSubmissionError(null);
    setSubmissionId(null);
    setEstimatedResponseHours(null);
    setCopyState('idle');
    setSubmissionStatus(null);
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <CheckCircle2 className="w-3 h-3" />
            <span>SYSTEMS AUDIT</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Start the AI Systems Audit.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed mb-6">
            Send the workflow context I need to decide whether a Phase 1 Roadmap is worth your time. I review for operational fit, data readiness, security constraints, timeline, and budget before recommending any paid scoping work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <a
              href="#audit-brief"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
            >
              Start the audit brief
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-all text-sm text-foreground/80"
            >
              Review Phase 1 pricing
            </Link>
          </div>
        </motion.div>

        {routeContext.sourcePageLabel || routeContext.sourceOfferLabel || routeContext.projectInterest ? (
          <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
              ROUTED CONTEXT
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {routeContext.sourcePageLabel ? `You came from ${routeContext.sourcePageLabel}. ` : null}
              {routeContext.sourceOfferLabel ? `Offer context: ${routeContext.sourceOfferLabel}. ` : null}
              {routeContext.projectInterest
                ? `The primary interest field is preselected as ${auditProjectInterestLabel(routeContext.projectInterest)}; change it below if another path fits better.`
                : 'Choose the primary interest below so the request routes to the right systems starting point.'}
            </p>
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {conversionSignals.map((signal) => (
            <div key={signal.title} className="rounded-lg border border-white/10 bg-black/20 p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                {signal.icon}
              </div>
              <h2 className="text-sm font-semibold text-white mb-2">{signal.title}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">{signal.detail}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-sm text-foreground/70">
            <h2 className="text-sm font-semibold text-white mb-2">What happens after you submit</h2>
            <p className="leading-relaxed">
              I review completed requests within 48 hours. If there is a fit, the next step is a Phase 1 Roadmap at $4,500 before any larger build is priced. Review <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors">privacy and data handling</Link> before sharing sensitive project context.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">What I am checking for</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reviewCriteria.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/65 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-xs text-foreground/50">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Step 1: Contact + context
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Step 2: Workflow details</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Step 3: Security + timing</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Step 4: Outcome and budget</span>
        </div>
        <p className="text-xs text-foreground/50 mb-8">Required fields are marked with an asterisk. One or two specific sentences per field is enough for a first review.</p>

        <motion.form
          id="audit-brief"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-xl p-8 space-y-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="space-y-6">
            <h2 className="text-xs font-mono text-foreground/40 tracking-widest">CONTACT AND CONTEXT</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="fullName">
                  Full Name <span className="text-primary">*</span>
                </label>
              <input
                id="fullName"
                ref={fullNameRef}
                type="text"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                  formErrors.fullName ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="John Doe"
                required
                aria-invalid={!!formErrors.fullName}
                aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
                autoComplete="name"
                aria-required="true"
              />
                {formErrors.fullName ? (
                <p id="fullName-error" className="text-red-400 text-sm">{formErrors.fullName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="workEmail">
                  Work Email <span className="text-primary">*</span>
                </label>
              <input
                id="workEmail"
                ref={workEmailRef}
                type="email"
                value={formData.workEmail}
                onChange={handleChange('workEmail')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                  formErrors.workEmail ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="john@company.com"
                required
                aria-invalid={!!formErrors.workEmail}
                aria-describedby={formErrors.workEmail ? 'workEmail-error' : undefined}
                autoComplete="email"
                aria-required="true"
              />
                {formErrors.workEmail ? (
                  <p id="workEmail-error" className="text-red-400 text-sm">{formErrors.workEmail}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="companyOrProjectUrl">
                Company / Project (name or URL) <span className="text-primary">*</span>
              </label>
              <p className="text-xs text-foreground/45">
                A company name is enough if there is no public URL.
              </p>
              <input
                id="companyOrProjectUrl"
                ref={companyOrProjectUrlRef}
                type="text"
                value={formData.companyOrProjectUrl}
                onChange={handleChange('companyOrProjectUrl')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                  formErrors.companyOrProjectUrl ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="Acme Inc. or https://acme.com"
                required
                aria-invalid={!!formErrors.companyOrProjectUrl}
                aria-describedby={formErrors.companyOrProjectUrl ? 'companyOrProjectUrl-error' : undefined}
                autoComplete="url"
                aria-required="true"
              />
                {formErrors.companyOrProjectUrl ? (
                <p id="companyOrProjectUrl-error" className="text-red-400 text-sm">{formErrors.companyOrProjectUrl}</p>
                ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="roleAndDecisionScope">
                Your role and buying authority <span className="text-primary">*</span>
              </label>
              <p className="text-xs text-foreground/45">
                Helps me understand whether the right workflow owner is involved.
              </p>
              <input
                id="roleAndDecisionScope"
                ref={roleAndDecisionScopeRef}
                type="text"
                value={formData.roleAndDecisionScope}
                onChange={handleChange('roleAndDecisionScope')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                  formErrors.roleAndDecisionScope ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="Founder, Ops lead, IT owner, evaluator, final approver..."
                required
                aria-invalid={!!formErrors.roleAndDecisionScope}
                aria-describedby={formErrors.roleAndDecisionScope ? 'roleAndDecisionScope-error' : undefined}
                aria-required="true"
              />
              {formErrors.roleAndDecisionScope ? (
                <p id="roleAndDecisionScope-error" className="text-red-400 text-sm">{formErrors.roleAndDecisionScope}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="projectInterest">
                What are you most interested in? <span className="text-primary">*</span>
              </label>
              <p className="text-xs text-foreground/45">
                Preselected when you came from a specific offer. Change it if another workflow type fits better.
              </p>
              <select
                id="projectInterest"
                ref={projectInterestRef}
                value={formData.projectInterest}
                onChange={handleChange('projectInterest')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none ${
                  formErrors.projectInterest ? 'border-red-400/80' : 'border-white/10'
                }`}
                required
                aria-invalid={!!formErrors.projectInterest}
                aria-describedby={formErrors.projectInterest ? 'projectInterest-error' : undefined}
                aria-required="true"
              >
                <option value="" disabled>
                  Select primary interest...
                </option>
                {AUDIT_PROJECT_INTERESTS.map((interest) => (
                  <option key={interest.value} value={interest.value}>
                    {interest.label}
                  </option>
                ))}
              </select>
              {formErrors.projectInterest ? (
                <p id="projectInterest-error" className="text-red-400 text-sm">{formErrors.projectInterest}</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xs font-mono text-foreground/40 tracking-widest">OPERATIONAL DETAILS</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="biggestBottleneck">
                What is the biggest manual bottleneck in your operations right now? <span className="text-primary">*</span>
              </label>
              <p className="text-xs text-foreground/45">
                Be concrete: who does it, how often, and what breaks when it is late or wrong.
              </p>
              <textarea
                id="biggestBottleneck"
                ref={biggestBottleneckRef}
                rows={4}
                value={formData.biggestBottleneck}
                onChange={handleChange('biggestBottleneck')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none ${
                  formErrors.biggestBottleneck ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="We spend 40 hours a week manually extracting data from..."
                required
                aria-invalid={!!formErrors.biggestBottleneck}
                aria-describedby={formErrors.biggestBottleneck ? 'biggestBottleneck-error' : undefined}
                aria-required="true"
              />
                {formErrors.biggestBottleneck ? (
                  <p id="biggestBottleneck-error" className="text-red-400 text-sm">{formErrors.biggestBottleneck}</p>
                ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="automationDataSources">
                What data sources are you trying to automate? <span className="text-primary">*</span>
              </label>
              <p className="text-xs text-foreground/45">
                Name the systems, files, inboxes, databases, APIs, dashboards, or documents involved.
              </p>
              <textarea
                id="automationDataSources"
                ref={automationDataSourcesRef}
                rows={3}
                value={formData.automationDataSources}
                onChange={handleChange('automationDataSources')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none ${
                  formErrors.automationDataSources ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="CRMs, internal docs, review sites, incoming emails..."
                required
                aria-invalid={!!formErrors.automationDataSources}
                aria-describedby={formErrors.automationDataSources ? 'automationDataSources-error' : undefined}
                aria-required="true"
              />
                {formErrors.automationDataSources ? (
                  <p id="automationDataSources-error" className="text-red-400 text-sm">{formErrors.automationDataSources}</p>
                ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="currentTechEcosystem">
                Current Tech Ecosystem
              </label>
              <p className="text-xs text-foreground/45">
                Optional, but useful if integrations will drive the scope.
              </p>
              <input
                id="currentTechEcosystem"
                ref={currentTechEcosystemRef}
                type="text"
                value={formData.currentTechEcosystem}
                onChange={handleChange('currentTechEcosystem')}
                disabled={isInputDisabled}
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Salesforce, Snowflake, custom APIs, etc."
                aria-describedby={formErrors.currentTechEcosystem ? 'currentTechEcosystem-error' : undefined}
              />
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xs font-mono text-foreground/40 tracking-widest">QUALIFICATION AND SECURITY</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="desiredTimeline">
                  Desired timeline <span className="text-primary">*</span>
                </label>
                <select
                  id="desiredTimeline"
                  ref={desiredTimelineRef}
                  value={formData.desiredTimeline}
                  onChange={handleChange('desiredTimeline')}
                  disabled={isInputDisabled}
                  className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none ${
                    formErrors.desiredTimeline ? 'border-red-400/80' : 'border-white/10'
                  }`}
                  required
                  aria-invalid={!!formErrors.desiredTimeline}
                  aria-describedby={formErrors.desiredTimeline ? 'desiredTimeline-error' : undefined}
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select timeline...
                  </option>
                  <option value="asap">ASAP - active project now</option>
                  <option value="30-60">Within 30-60 days</option>
                  <option value="quarter">This quarter</option>
                  <option value="exploring">Exploring / no fixed date yet</option>
                </select>
                {formErrors.desiredTimeline ? (
                  <p id="desiredTimeline-error" className="text-red-400 text-sm">{formErrors.desiredTimeline}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80" htmlFor="securityRequirement">
                  Security requirement <span className="text-primary">*</span>
                </label>
                <select
                  id="securityRequirement"
                  ref={securityRequirementRef}
                  value={formData.securityRequirement}
                  onChange={handleChange('securityRequirement')}
                  disabled={isInputDisabled}
                  className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none ${
                    formErrors.securityRequirement ? 'border-red-400/80' : 'border-white/10'
                  }`}
                  required
                  aria-invalid={!!formErrors.securityRequirement}
                  aria-describedby={formErrors.securityRequirement ? 'securityRequirement-error' : undefined}
                  aria-required="true"
                >
                  <option value="" disabled>
                    Select requirement...
                  </option>
                  <option value="none">No formal requirement</option>
                  <option value="questionnaire">Security questionnaire / evidence package</option>
                  <option value="soc2-type1">SOC 2 Type 1 acceptable</option>
                  <option value="soc2-type2">SOC 2 Type 2 required before production</option>
                  <option value="unsure">Not sure yet - need guidance</option>
                </select>
                {formErrors.securityRequirement ? (
                  <p id="securityRequirement-error" className="text-red-400 text-sm">{formErrors.securityRequirement}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="deploymentConstraints">
                Deployment or data-handling constraints
              </label>
              <p className="text-xs text-foreground/45">
                Do not include credentials, private keys, raw customer records, or regulated datasets.
              </p>
              <textarea
                id="deploymentConstraints"
                ref={deploymentConstraintsRef}
                rows={3}
                value={formData.deploymentConstraints}
                onChange={handleChange('deploymentConstraints')}
                disabled={isInputDisabled}
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="On-prem only, single-tenant, region lock, customer-managed keys, no external model providers..."
              />
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xs font-mono text-foreground/40 tracking-widest">OUTCOMES AND BUDGET</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="roiGoal">
                What does success look like? (The ROI)
              </label>
              <p className="text-xs text-foreground/45">
                Optional, but the best projects have a measurable time, revenue, accuracy, or risk target.
              </p>
              <input
                id="roiGoal"
                ref={roiGoalRef}
                type="text"
                value={formData.roiGoal}
                onChange={handleChange('roiGoal')}
                disabled={isInputDisabled}
                className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g. We save 100 hours/month or generate 20% more pipeline"
                aria-invalid={!!formErrors.roiGoal}
                aria-describedby={formErrors.roiGoal ? 'roiGoal-error' : undefined}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="anticipatedInvestmentRange">
                Anticipated Investment Range <span className="text-primary">*</span>
              </label>
              <select
                id="anticipatedInvestmentRange"
                ref={anticipatedInvestmentRangeRef}
                value={formData.anticipatedInvestmentRange}
                onChange={handleChange('anticipatedInvestmentRange')}
                disabled={isInputDisabled}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none ${
                  formErrors.anticipatedInvestmentRange ? 'border-red-400/80' : 'border-white/10'
                }`}
                required
                aria-invalid={!!formErrors.anticipatedInvestmentRange}
                aria-describedby={formErrors.anticipatedInvestmentRange ? 'anticipatedInvestmentRange-error' : undefined}
                aria-required="true"
              >
                <option value="" disabled>
                  Select a range...
                </option>
                <option value="phase1">Phase 1 Roadmap Only ($4,500)</option>
                <option value="10k-25k">$10k – $25k</option>
                <option value="25k-50k">$25k – $50k</option>
                <option value="50k+">$50k+</option>
                <option value="unsure">Not sure yet — help me scope it</option>
              </select>
              {formErrors.anticipatedInvestmentRange ? (
                  <p id="anticipatedInvestmentRange-error" className="text-red-400 text-sm">{formErrors.anticipatedInvestmentRange}</p>
                ) : null}
            </div>
          </section>

          <button
            type="submit"
            className="w-full group px-6 py-4 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isInputDisabled}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending systems audit...' : 'Send Systems Audit Request'}
          </button>

          <p className="text-center text-xs text-foreground/45">
            No payment is collected here. If there is a fit, I will reply with next steps for the Phase 1 Roadmap.
          </p>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-foreground/60 leading-relaxed">
              Manual backup: copy the filled summary if the form fails or you need to send the request through an existing email thread.
            </p>
            <button
              type="button"
              onClick={copySummary}
              disabled={isCopying || isSubmitting}
              className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 border border-white/10 rounded-md hover:bg-white/5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
            >
              <Copy className="w-4 h-4" />
              {isCopying
                ? 'Copying...'
                : copyState === 'copied'
                  ? 'Summary copied'
                  : copyState === 'failed'
                    ? 'Copy failed'
                    : 'Copy summary'}
            </button>
          </div>
        </motion.form>

        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-white mb-2">
                  {submissionSuccessful
                    ? 'Request received'
                    : submissionError
                      ? 'Submission failed'
                      : 'Request ready'}
                </h3>
                <p className="text-sm text-foreground/70 mb-4">
                  {submissionSuccessful
                    ? 'Your request was submitted directly. I will review it and follow up if the fit is real.'
                    : submissionError
                      ? 'Submission failed. Retry the request or copy the summary for manual follow-up.'
                      : 'Request ready. Submit when you are ready.'}
                </p>
                {submissionStatus ? (
                  <p className="text-xs text-foreground/60 mb-3">{submissionStatus}</p>
                ) : null}
                {submissionId ? (
                  <p className="text-sm text-foreground/60 mb-2">
                    Intake ID: <span className="font-mono text-foreground/80">{submissionId}</span>
                  </p>
                ) : null}
                {submissionError ? (
                  <p className="text-sm text-amber-300/90 mb-4">
                    {submissionError}
                  </p>
                ) : null}
                {estimatedResponseHours ? (
                  <p className="text-sm text-foreground/60 mb-4">
                    Target review window: {estimatedResponseHours} hours.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {submissionError ? (
                    <button
                      type="button"
                      onClick={copySummary}
                      disabled={isCopying}
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-white/10 rounded-md hover:bg-white/5 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {isCopying
                        ? 'Copying summary...'
                        : copyState === 'copied'
                          ? 'Summary copied'
                          : copyState === 'failed'
                            ? 'Copy failed'
                            : 'Copy summary'}
                    </button>
                  ) : null}
                  {submissionError ? (
                    <button
                      type="button"
                      onClick={submitAudit}
                      disabled={isSubmitting || isCopying}
                      className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-primary/40 rounded-md text-primary/90 hover:bg-primary/10 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Retrying...' : 'Retry request capture'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-white/10 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear and restart
                  </button>
                </div>
                <Link href="/process" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                  See the expected flow after submitting
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </main>
  );
}
