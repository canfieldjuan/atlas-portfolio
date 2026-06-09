'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { trackFaqReportCsvSubmitted } from '@/lib/analytics';
import {
  deflectionResultsPath,
  SUPPORT_PLATFORM_OPTIONS,
  type SupportPlatform,
} from '@/lib/gap-report-intake';
import type { DeflectionPriceVariantId } from '@/lib/deflection-pricing';

type SubmissionStatus =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | {
      phase: 'processing';
      reportRequestId: string;
      resultsHref: string;
    }
  | { phase: 'success'; requestId: string; reportRequestId?: string; warnings: string[] }
  | { phase: 'error'; message: string };

type FormErrors = Partial<{
  name: string;
  email: string;
  companyName: string;
  supportPlatform: string;
  csv: string;
}>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CSV_MB = 50;
const CSV_UPLOAD_CONTENT_TYPES = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel']);
const PROCESSING_REDIRECT_DELAY_MS = 3200;
const SNAPSHOT_PROCESSING_STEPS = [
  {
    title: 'Reading the ticket export',
    detail: 'Confirming the CSV upload and support platform context.',
  },
  {
    title: 'Grouping repeat customer questions',
    detail: 'Finding the issues customers ask about more than once.',
  },
  {
    title: 'Pulling customer wording from tickets',
    detail: 'Keeping the phrases customers used instead of inventing keywords.',
  },
  {
    title: 'Building the free Snapshot preview',
    detail: 'Preparing the ranked questions and one review-ready answer sample.',
  },
  {
    title: 'Preparing deflection targets',
    detail: 'Turning repeated questions into help-center work your team can review.',
  },
];

export type SupportTicketCsvIntakeCopy = {
  backHref: string;
  backLabel: string;
  sourcePage: string;
  sourceOffer: string;
  snapshotName: string;
  submitLabel: string;
  priceVariantId?: DeflectionPriceVariantId;
  partnerAccessToken?: string;
};

export function SupportTicketCsvIntakePage({ copy }: { copy: SupportTicketCsvIntakeCopy }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supportPlatform, setSupportPlatform] = useState<SupportPlatform | ''>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submission, setSubmission] = useState<SubmissionStatus>({ phase: 'idle' });
  const processingHeadingRef = useRef<HTMLHeadingElement>(null);
  const isSubmitting = submission.phase === 'submitting' || submission.phase === 'processing';

  useEffect(() => {
    if (submission.phase !== 'processing') return;
    const redirectTimer = window.setTimeout(() => {
      window.location.assign(submission.resultsHref);
    }, PROCESSING_REDIRECT_DELAY_MS);
    return () => window.clearTimeout(redirectTimer);
  }, [submission]);

  useEffect(() => {
    if (submission.phase !== 'submitting' && submission.phase !== 'processing') return;
    processingHeadingRef.current?.focus();
  }, [submission.phase]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!name.trim()) {
      next.name = 'Required.';
    }
    if (!email.trim()) {
      next.email = 'Required.';
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Use a valid email address.';
    }
    if (!companyName.trim()) {
      next.companyName = 'Required.';
    }
    if (!supportPlatform) {
      next.supportPlatform = 'Required.';
    }
    if (!csvFile) {
      next.csv = 'Required.';
    } else {
      const lowerName = csvFile.name.toLowerCase();
      if (!lowerName.endsWith('.csv')) {
        next.csv = 'Must be a .csv file.';
      } else if (csvFile.size === 0) {
        next.csv = 'File is empty.';
      } else if (csvFile.size > MAX_CSV_MB * 1024 * 1024) {
        next.csv = `File is too large. Maximum is ${MAX_CSV_MB} MB.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const file = csvFile;
    if (!file) return;

    setSubmission({ phase: 'submitting' });

    const metadata = {
      name: name.trim(),
      email: email.trim(),
      companyName: companyName.trim(),
      supportPlatform,
      csvFilename: file.name,
      csvSizeBytes: file.size,
      sourcePage: copy.sourcePage,
      sourceOffer: copy.sourceOffer,
      priceVariant: copy.priceVariantId,
      partnerToken: copy.partnerAccessToken,
    };

    try {
      // Upload the CSV directly to Vercel Blob (browser -> Blob), bypassing the
      // serverless body limit so 3-6 month exports upload natively. /upload only
      // mints a scoped token; /record persists the submission once stored.
      const companySlug =
        companyName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 40) || 'unknown';
      const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
      const fileContentType = file.type.toLowerCase();
      const contentType = CSV_UPLOAD_CONTENT_TYPES.has(fileContentType) ? fileContentType : 'text/csv';
      const blob = await upload(
        `gap-report-csvs/${Date.now()}-${companySlug}/${safeFilename}`,
        file,
        {
          access: 'private',
          contentType,
          handleUploadUrl: '/api/gap-report-intake/upload',
          clientPayload: JSON.stringify(metadata),
        }
      );

      const response = await fetch('/api/gap-report-intake/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...metadata, blobUrl: blob.url }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok: boolean;
            requestId?: string;
            reportRequestId?: string;
            warnings?: string[];
            error?: string;
          }
        | null;

      if (!response.ok || !payload || !payload.ok) {
        setSubmission({
          phase: 'error',
          message:
            payload?.error ||
            `Submission failed (${response.status}). Try again or email us directly.`,
        });
        return;
      }

      const resultsHref = deflectionResultsPath(payload.reportRequestId, copy.priceVariantId);
      if (resultsHref) {
        trackFaqReportCsvSubmitted({
          supportPlatform,
          sourcePage: copy.sourcePage,
          sourceOffer: copy.sourceOffer,
          sourceOfferLabel: copy.submitLabel,
          status: 'submitted',
        });
        setSubmission({
          phase: 'processing',
          reportRequestId: payload.reportRequestId || '',
          resultsHref,
        });
        return;
      }

      setSubmission({
        phase: 'success',
        requestId: payload.requestId || '',
        reportRequestId: payload.reportRequestId,
        warnings: payload.warnings || [],
      });
      trackFaqReportCsvSubmitted({
        supportPlatform,
        sourcePage: copy.sourcePage,
        sourceOffer: copy.sourceOffer,
        sourceOfferLabel: copy.submitLabel,
        status: 'submitted',
      });
    } catch (error) {
      setSubmission({
        phase: 'error',
        message:
          error instanceof Error
            ? `Upload failed: ${error.message}. Try again, or email us directly.`
            : 'Upload failed. Try again, or email us directly.',
      });
    }
  }

  function handleFileChange(file: File | null) {
    setCsvFile(file);
    if (file && errors.csv) {
      setErrors((prev) => ({ ...prev, csv: undefined }));
    }
  }

  if (submission.phase === 'submitting' || submission.phase === 'processing') {
    const processingSubmission = submission.phase === 'processing' ? submission : null;
    return (
      <>
        <main className="min-h-screen pt-20 pb-20 px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Link
              href={copy.backHref}
              className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              {copy.backLabel}
            </Link>

            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 md:p-12 shadow-[var(--primary-glow)]">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                PREPARING SNAPSHOT
              </div>
              <h1
                ref={processingHeadingRef}
                tabIndex={-1}
                className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4 focus:outline-none"
              >
                Preparing your {copy.snapshotName}.
              </h1>
              <p className="text-foreground/70 leading-relaxed mb-6">
                {processingSubmission
                  ? "Your CSV was received. We're opening the free Snapshot now and sending the confirmation email to "
                  : "Your CSV is uploading. We're starting the same deterministic Snapshot path that reads the export, groups repeat questions, and prepares the ranked targets for review."}
                {processingSubmission && <span className="text-foreground">{email}</span>}
                {processingSubmission && '.'}
              </p>

              <div
                aria-label="Snapshot processing steps"
                aria-live="polite"
                aria-busy="true"
                className="space-y-3"
              >
                {SNAPSHOT_PROCESSING_STEPS.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-lg border border-border/70 bg-surface/70 p-4"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 text-[11px] font-mono text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-foreground/55">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {processingSubmission ? (
                <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-mono text-foreground/45">
                    Report: {processingSubmission.reportRequestId}
                  </div>
                  <Link
                    href={processingSubmission.resultsHref}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-black transition-all hover:bg-primary/90"
                  >
                    Open Snapshot now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-8 rounded-lg border border-border/70 bg-surface/70 p-4 text-xs leading-relaxed text-foreground/55">
                  The Snapshot opens automatically when the report id is ready.
                </div>
              )}
              <p className="text-xs text-foreground/45 mt-8 leading-relaxed">
                Privacy: we delete your CSV after 30 days. No model training, no third-party
                sharing, no fine-tuning.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (submission.phase === 'success') {
    const confirmationWarning = submission.warnings.some((warning) =>
      warning.toLowerCase().includes('customer confirmation')
    );
    // Surface any backend warnings that are NOT about the customer confirmation
    // email (e.g. internal notification email failed, DB persistence failed).
    // These are silent in the current filter but can mean the team won't receive
    // the submission — user should get a fallback contact path in that case.
    const hasInternalWarning = submission.warnings.some(
      (warning) => !warning.toLowerCase().includes('customer confirmation')
    );
    const resultsHref = deflectionResultsPath(submission.reportRequestId, copy.priceVariantId);

    return (
      <>
        <main className="min-h-screen pt-20 pb-20 px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Link
              href={copy.backHref}
              className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              {copy.backLabel}
            </Link>

            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 md:p-12 shadow-[var(--primary-glow)] mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                {resultsHref ? 'Your snapshot is ready.' : 'CSV received.'}
              </h1>
              {resultsHref ? (
                <>
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    We generated the free {copy.snapshotName} from your CSV. Your confirmation
                    email is also on the way to <span className="text-foreground">{email}</span>.
                  </p>
                  <Link
                    href={resultsHref}
                    className="mb-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-black transition-all hover:bg-primary/90"
                  >
                    View free snapshot
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-foreground/70 leading-relaxed mb-3">
                    We have your file. Your confirmation email is on the way to{' '}
                    <span className="text-foreground">{email}</span>. We&apos;ll send the free{' '}
                    {copy.snapshotName} as soon as processing finishes.
                  </p>
                  <p className="text-foreground/65 leading-relaxed mb-6">
                    No next step is needed from you right now.
                  </p>
                </>
              )}
              {submission.requestId && (
                <p className="text-xs font-mono text-foreground/45 mb-2">
                  Reference: {submission.requestId}
                </p>
              )}
              {submission.reportRequestId && (
                <p className="text-xs font-mono text-foreground/45 mb-2">
                  Report: {submission.reportRequestId}
                </p>
              )}
              {confirmationWarning && (
                <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.04] p-4">
                  <div className="text-[10px] font-mono text-yellow-500/80 tracking-widest mb-2">
                    EMAIL NOTE
                  </div>
                  <p className="text-xs text-foreground/65 leading-relaxed">
                    Your CSV was received, but the confirmation email may not have sent. The
                    snapshot will still go to the email above.
                  </p>
                </div>
              )}
              {hasInternalWarning && (
                <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.04] p-4">
                  <div className="text-[10px] font-mono text-yellow-500/80 tracking-widest mb-2">
                    PROCESSING NOTE
                  </div>
                  <p className="text-xs text-foreground/65 leading-relaxed">
                    Your CSV was received, but something went wrong on our end during processing.
                    If processing does not complete, email us directly at{' '}
                    <a
                      href="mailto:juan@juancanfield.com"
                      className="text-primary underline underline-offset-2"
                    >
                      juan@juancanfield.com
                    </a>{' '}
                    and reference your upload.
                  </p>
                </div>
              )}
              <p className="text-xs text-foreground/45 mt-8 leading-relaxed">
                Privacy: we delete your CSV after 30 days. No model training, no third-party
                sharing, no fine-tuning.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-8 md:p-12 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/60" />
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                OPTIONAL ADD-ON
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
                Close the loop: Push answers back to {
                  supportPlatform === 'zendesk' ? 'Zendesk as Macros' : 
                  supportPlatform === 'intercom' ? 'Intercom as Saved Replies' : 
                  supportPlatform === 'freshdesk' ? 'Freshdesk as Canned Responses' : 
                  'your support tool'
                }.
              </h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Right now, your pipeline runs one direction: we pull your tickets, cluster them, and generate verified FAQ answers for your public help center.
              </p>
              <p className="text-foreground/70 leading-relaxed mb-8">
                <strong>Macro-writeback closes that loop.</strong> We take each verified question and answer pair that your team approves, and publish it directly back into your support tool. The question becomes the title, and the verified resolution becomes the body, ready for your agents to drop into tickets instantly. Same deterministic process, no auto-send.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-border pt-6">
                <div className="flex-1 w-full flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-foreground">$499</span>
                  <span className="text-sm text-foreground/50">one-time setup</span>
                </div>
                <a 
                  href={`mailto:juan@juancanfield.com?subject=Macro-Writeback%20Add-on%20(${supportPlatform})`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                >
                  Add Macro-Writeback
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen pt-20 pb-20 px-6 relative z-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href={copy.backHref}
          className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          {copy.backLabel}
        </Link>

        <div className="mb-10">
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            FAQ DEFLECTION INTAKE
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Start a deterministic FAQ gap audit.
          </h1>
          <p className="text-foreground/65 leading-relaxed">
            Upload 30 days of closed support tickets. The Snapshot ranks repeated
            questions, keeps customer wording your docs miss, and includes one
            review-ready FAQ draft from resolved replies using repeatable clustering,
            not chatbot interpretation.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Your name <span className="text-primary">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-primary/60 disabled:opacity-50"
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-2 text-xs text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Work email <span className="text-primary">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-primary/60 disabled:opacity-50"
              placeholder="you@yourcompany.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-2 text-xs text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-2">
              Company name <span className="text-primary">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              required
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName)
                  setErrors((prev) => ({ ...prev, companyName: undefined }));
              }}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-primary/60 disabled:opacity-50"
              placeholder="Acme Inc."
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={errors.companyName ? 'companyName-error' : undefined}
            />
            {errors.companyName && (
              <p id="companyName-error" className="mt-2 text-xs text-red-400">
                {errors.companyName}
              </p>
            )}
          </div>

          {/* Support platform */}
          <div>
            <label
              htmlFor="supportPlatform"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Support platform <span className="text-primary">*</span>
            </label>
            <select
              id="supportPlatform"
              value={supportPlatform}
              required
              onChange={(e) => {
                setSupportPlatform(e.target.value as SupportPlatform | '');
                if (errors.supportPlatform)
                  setErrors((prev) => ({ ...prev, supportPlatform: undefined }));
              }}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 disabled:opacity-50"
              aria-invalid={Boolean(errors.supportPlatform)}
              aria-describedby={
                errors.supportPlatform ? 'supportPlatform-error' : 'supportPlatform-hint'
              }
            >
              <option value="">Select your support platform</option>
              {SUPPORT_PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.supportPlatform && (
              <p id="supportPlatform-error" className="mt-2 text-xs text-red-400">
                {errors.supportPlatform}
              </p>
            )}
            <p id="supportPlatform-hint" className="mt-2 text-xs text-foreground/50">
              This helps us see which support platforms are most common and interpret your
              export faster.
            </p>
          </div>

          {/* CSV file */}
          <div>
            <label htmlFor="csv" className="block text-sm font-medium text-foreground mb-2">
              CSV file <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <input
                id="csv"
                type="file"
                accept=".csv,text/csv,application/csv,application/vnd.ms-excel"
                required
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:px-4 file:py-2.5 file:text-sm file:font-medium hover:file:bg-primary/20 disabled:opacity-50"
                aria-invalid={Boolean(errors.csv)}
                aria-describedby={errors.csv ? 'csv-error' : 'csv-hint'}
              />
            </div>
            {csvFile && !errors.csv && (
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-foreground/65">
                <FileText className="w-3.5 h-3.5 text-primary/80" />
                {csvFile.name}{' '}
                <span className="text-foreground/45">
                  ({(csvFile.size / 1024).toFixed(0)} KB)
                </span>
              </p>
            )}
            {errors.csv && (
              <p id="csv-error" className="mt-2 text-xs text-red-400">
                {errors.csv}
              </p>
            )}
            <p id="csv-hint" className="mt-2 text-xs text-foreground/50 leading-relaxed">
              Subject lines and ticket bodies are enough. A few hundred closed tickets can
              work if repeat questions show up clearly. Max {MAX_CSV_MB} MB. Strip PII before
              uploading if your export tool can, we recommend it; we don&apos;t need names or
              emails to find your repeat questions. Files are deleted after 30 days.
            </p>
            <div className="mt-4 rounded-lg border border-primary/35 bg-primary/[0.08] p-4">
              <p className="text-sm font-semibold text-primary">100% Deterministic Engine</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">
                This intake does not use LLMs or generative AI to analyze your ticket
                logs. We use deterministic clustering to sort repeated questions.
              </p>
            </div>
          </div>

          {/* Error */}
          {submission.phase === 'error' && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/[0.04] p-4">
              <p className="text-sm text-red-300/90">{submission.message}</p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-black font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
            >
              {copy.submitLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-4 text-xs text-foreground/45 leading-relaxed">
              Privacy: we delete your CSV after 30 days. No model training, no third-party
              sharing, no fine-tuning.
            </p>
          </div>
        </form>
      </div>
      </main>
    </>
  );
}
