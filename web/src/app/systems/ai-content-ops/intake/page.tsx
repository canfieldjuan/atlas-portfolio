'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { trackFaqReportCsvSubmitted } from '@/lib/analytics';
import { SUPPORT_PLATFORM_OPTIONS, type SupportPlatform } from '@/lib/gap-report-intake';

type SubmissionStatus =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'success'; requestId: string; warnings: string[] }
  | { phase: 'error'; message: string };

type FormErrors = Partial<{
  name: string;
  email: string;
  companyName: string;
  supportPlatform: string;
  csv: string;
}>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CSV_MB = 4;

const lightThemeStyles = `
  .faq-report-light {
    --background: #f4f7f2;
    --foreground: #17231f;
    --color-background: #f4f7f2;
    --color-foreground: #17231f;
    --color-primary: #3c6f8f;
    background:
      radial-gradient(circle at top left, rgba(60, 111, 143, 0.14), transparent 34rem),
      linear-gradient(180deg, #fbfcf8 0%, #f2f6ef 52%, #edf3ea 100%);
    color: var(--foreground);
  }

  .faq-report-light [class*="bg-black/"],
  .faq-report-light [class*="bg-white/["] {
    background-color: rgba(255, 255, 255, 0.76) !important;
    box-shadow: 0 18px 50px rgba(31, 45, 39, 0.08);
  }

  .faq-report-light input,
  .faq-report-light select {
    background-color: rgba(255, 255, 255, 0.82) !important;
    color: #11231f !important;
  }

  .faq-report-light option {
    color: #11231f;
  }

  .faq-report-light [class*="border-white/"],
  .faq-report-light [class*="border-primary/30"] {
    border-color: rgba(23, 35, 31, 0.14) !important;
  }

  .faq-report-light .text-white {
    color: #11231f !important;
  }

  .faq-report-light .text-black {
    color: #041310 !important;
  }

  .faq-report-light [class*="text-foreground/"] {
    color: rgba(23, 35, 31, 0.68) !important;
  }

  .faq-report-light [class*="text-primary/"],
  .faq-report-light .text-primary {
    color: #315f7b !important;
  }

  .faq-report-light [class*="bg-primary/"] {
    background-color: rgba(60, 111, 143, 0.1) !important;
  }

  .faq-report-light .bg-primary {
    background-color: #3c6f8f !important;
  }

  .faq-report-light .bg-primary.text-black,
  .faq-report-light .bg-primary .text-black {
    color: #ffffff !important;
  }
`;

export default function GapReportIntakePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supportPlatform, setSupportPlatform] = useState<SupportPlatform | ''>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submission, setSubmission] = useState<SubmissionStatus>({ phase: 'idle' });

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
    if (submission.phase === 'submitting') return;
    if (!validate()) return;

    setSubmission({ phase: 'submitting' });

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('email', email.trim());
    formData.append('companyName', companyName.trim());
    if (supportPlatform) {
      formData.append('supportPlatform', supportPlatform);
    }
    if (csvFile) {
      formData.append('csv', csvFile);
    }
    formData.append('sourcePage', '/systems/ai-content-ops');
    formData.append('sourceOffer', 'gap-report-intake');

    try {
      const response = await fetch('/api/gap-report-intake', {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok: boolean; requestId?: string; warnings?: string[]; error?: string }
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

      setSubmission({
        phase: 'success',
        requestId: payload.requestId || '',
        warnings: payload.warnings || [],
      });
      trackFaqReportCsvSubmitted({
        supportPlatform,
        sourcePage: '/systems/ai-content-ops',
        sourceOffer: 'gap-report-intake',
        status: 'submitted',
      });
    } catch (error) {
      setSubmission({
        phase: 'error',
        message:
          error instanceof Error
            ? `Network error: ${error.message}`
            : 'Network error. Try again.',
      });
    }
  }

  function handleFileChange(file: File | null) {
    setCsvFile(file);
    if (file && errors.csv) {
      setErrors((prev) => ({ ...prev, csv: undefined }));
    }
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

    return (
      <>
        <style>{lightThemeStyles}</style>
        <main className="faq-report-light min-h-screen pt-20 pb-20 px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/systems/ai-content-ops"
              className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to FAQ Report
            </Link>

            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 md:p-12 shadow-[0_0_40px_rgba(0,255,204,0.04)]">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                CSV received.
              </h1>
              <p className="text-foreground/70 leading-relaxed mb-3">
                We have your file. Your confirmation email is on the way to{' '}
                <span className="text-white">{email}</span>, and the free FAQ Snapshot will be
                sent there within 24 hours.
              </p>
              <p className="text-foreground/65 leading-relaxed mb-6">
                No next step is needed from you right now.
              </p>
              {submission.requestId && (
                <p className="text-xs font-mono text-foreground/45 mb-2">
                  Reference: {submission.requestId}
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
                    If you don&apos;t hear back within 24 hours, email us directly at{' '}
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
          </div>
        </main>
      </>
    );
  }

  const submitting = submission.phase === 'submitting';

  return (
    <>
    <style>{lightThemeStyles}</style>
    <main className="faq-report-light min-h-screen pt-20 pb-20 px-6 relative z-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/systems/ai-content-ops"
          className="inline-flex items-center gap-2 text-sm text-foreground/55 hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to FAQ Report
        </Link>

        <div className="mb-10">
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            UPLOAD YOUR CSV
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
            One file. Five fields. 24 hours.
          </h1>
          <p className="text-foreground/65 leading-relaxed">
            Upload a CSV export of the last 90 days of your closed support tickets. We send
            back a free FAQ Snapshot: the repeat questions we can see, customer wording
            examples, and one sample FAQ entry.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
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
              disabled={submitting}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-foreground/35 focus:outline-none focus:border-primary/60 disabled:opacity-50"
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
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
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
              disabled={submitting}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-foreground/35 focus:outline-none focus:border-primary/60 disabled:opacity-50"
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
            <label htmlFor="companyName" className="block text-sm font-medium text-white mb-2">
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
              disabled={submitting}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-foreground/35 focus:outline-none focus:border-primary/60 disabled:opacity-50"
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
              className="block text-sm font-medium text-white mb-2"
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
              disabled={submitting}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/60 disabled:opacity-50"
              aria-invalid={Boolean(errors.supportPlatform)}
              aria-describedby={
                errors.supportPlatform ? 'supportPlatform-error' : 'supportPlatform-hint'
              }
            >
              <option value="">— Select your support platform —</option>
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
            <label htmlFor="csv" className="block text-sm font-medium text-white mb-2">
              CSV file <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <input
                id="csv"
                type="file"
                accept=".csv,text/csv,application/csv,application/vnd.ms-excel"
                required
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={submitting}
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
              work if repeat questions show up clearly. Max 4 MB. Don&apos;t include PII if
              your export tool can strip it; if not, upload the CSV anyway and we drop PII
              in our intake step before any model sees it.
            </p>
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
              disabled={submitting}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-black font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  Upload CSV — get your free FAQ Snapshot
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
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
