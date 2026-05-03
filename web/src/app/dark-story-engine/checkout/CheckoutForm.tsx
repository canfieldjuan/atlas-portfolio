'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Hash,
  Lock,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export type PlanInfo = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  videos: string;
};

type CheckoutFormProps = {
  plan: PlanInfo;
};

type FormFields = {
  fullName: string;
  email: string;
  channelName: string;
  channelUrl: string;
  storyPrefs: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;

export default function CheckoutForm({ plan }: CheckoutFormProps) {
  const [form, setForm] = useState<FormFields>({
    fullName: '',
    email: '',
    channelName: '',
    channelUrl: '',
    storyPrefs: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange =
    (field: keyof FormFields) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.fullName.trim()) next.fullName = 'Required.';
    if (!form.email.trim()) next.email = 'Required.';
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) next.email = 'Enter a valid email.';
    if (!form.channelName.trim()) next.channelName = 'Required.';
    if (!form.channelUrl.trim()) next.channelUrl = 'Required.';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Map to existing /api/audit payload shape; no backend changes.
      const payload = {
        fullName: form.fullName.trim(),
        workEmail: form.email.trim(),
        companyOrProjectUrl: form.channelUrl.trim(),
        roleAndDecisionScope: 'YouTube channel owner (dark-story-engine checkout)',
        projectInterest: 'content-generation',
        biggestBottleneck: `Subscribing to Dark Story Engine — ${plan.name} (${plan.price}${plan.cadence}). Channel: ${form.channelName.trim()}.`,
        automationDataSources: `Channel: ${form.channelName.trim()}. Channel URL: ${form.channelUrl.trim()}.${form.storyPrefs.trim() ? ` Story preferences / sub-niche: ${form.storyPrefs.trim()}` : ''}`,
        currentTechEcosystem: '',
        desiredTimeline: 'asap',
        securityRequirement: 'none',
        deploymentConstraints: '',
        roiGoal: `Recurring YouTube script production — ${plan.name} plan`,
        anticipatedInvestmentRange: 'phase1',
      };

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Submission failed.');
      }
      setSubmitted(true);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/30 bg-primary/5 p-8 md:p-10 text-center"
      >
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-5" />
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
          Subscription request received.
        </h2>
        <p className="text-foreground/65 leading-relaxed mb-6 max-w-xl mx-auto">
          We&apos;ll email you within one business day to confirm onboarding details and complete payment. Your first delivery starts as soon as billing is set up and you&apos;ve sent us your first topic.
        </p>
        <div className="rounded-lg border border-white/10 bg-black/30 p-5 max-w-md mx-auto text-left mb-6">
          <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
            WHAT YOU SIGNED UP FOR
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/55">Plan</span>
              <span className="text-white font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/55">Price</span>
              <span className="text-white font-medium">
                {plan.price}
                <span className="text-foreground/55">{plan.cadence}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/55">Channel</span>
              <span className="text-white font-medium">{form.channelName}</span>
            </div>
          </div>
        </div>
        <Link
          href="/dark-story-engine"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-md hover:bg-white/5 transition-colors text-sm text-foreground/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to overview
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div>
          <Link
            href="/dark-story-engine#pricing"
            className="inline-flex items-center gap-2 text-xs text-foreground/55 hover:text-foreground/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to plan selection
          </Link>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            CHECKOUT — STEP 1 OF 2
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3">
            Tell us about your channel.
          </h1>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Five quick fields. We use this to set up your subscription and calibrate voice matching against your existing uploads before delivery one.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-xs font-mono text-foreground/40 tracking-widest">CONTACT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="fullName">
                Your name <span className="text-primary">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                disabled={isSubmitting}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                  errors.fullName ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="Alex Doe"
                required
                aria-invalid={!!errors.fullName}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm">{errors.fullName}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="email">
                Work email <span className="text-primary">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                disabled={isSubmitting}
                className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                  errors.email ? 'border-red-400/80' : 'border-white/10'
                }`}
                placeholder="alex@yourchannel.com"
                required
                aria-invalid={!!errors.email}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-mono text-foreground/40 tracking-widest">YOUR CHANNEL</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="channelName">
              Channel name <span className="text-primary">*</span>
            </label>
            <input
              id="channelName"
              type="text"
              value={form.channelName}
              onChange={handleChange('channelName')}
              disabled={isSubmitting}
              className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                errors.channelName ? 'border-red-400/80' : 'border-white/10'
              }`}
              placeholder="The Quiet Hour"
              required
              aria-invalid={!!errors.channelName}
            />
            {errors.channelName && <p className="text-red-400 text-sm">{errors.channelName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="channelUrl">
              Channel link or sample video URL <span className="text-primary">*</span>
            </label>
            <p className="text-xs text-foreground/45">
              Your YouTube channel URL or a recent upload. We use this to calibrate voice matching against your existing pacing and tone.
            </p>
            <input
              id="channelUrl"
              type="url"
              value={form.channelUrl}
              onChange={handleChange('channelUrl')}
              disabled={isSubmitting}
              className={`w-full bg-background border rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors ${
                errors.channelUrl ? 'border-red-400/80' : 'border-white/10'
              }`}
              placeholder="https://youtube.com/@yourchannel"
              required
              aria-invalid={!!errors.channelUrl}
              autoComplete="url"
            />
            {errors.channelUrl && (
              <p className="text-red-400 text-sm">{errors.channelUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="storyPrefs">
              Story preferences (optional)
            </label>
            <p className="text-xs text-foreground/45">
              Sub-niche, story sources you prefer (Reddit, folklore, paranormal investigation, urban legends, etc.), tonal preferences, anything off-limits for your audience.
            </p>
            <textarea
              id="storyPrefs"
              rows={3}
              value={form.storyPrefs}
              onChange={handleChange('storyPrefs')}
              disabled={isSubmitting}
              className="w-full bg-background border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="e.g. r/LetsNotMeet style, no jump-scares, prefer slow burn, avoid first-person trauma..."
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-mono text-foreground/40 tracking-widest">
            CHECKOUT — STEP 2 OF 2
          </h2>
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white mb-1">Payment</div>
                <p className="text-xs text-foreground/55 leading-relaxed">
                  Card processing is launching soon. For now, you submit this request and we email you within one business day with a secure payment link to complete signup before your first delivery.
                </p>
              </div>
            </div>
            <div className="rounded-md border border-white/5 bg-black/40 p-3 flex items-center gap-3 text-xs text-foreground/45">
              <Lock className="w-3.5 h-3.5" />
              <span>
                Your information is sent directly to us. No payment data is collected on this page.
              </span>
            </div>
          </div>
        </section>

        {submissionError && (
          <div className="rounded-md border border-red-400/30 bg-red-500/5 p-4 text-sm text-red-300/90">
            {submissionError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full group px-6 py-4 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isSubmitting
            ? 'Submitting subscription request...'
            : `Submit Subscription Request (${plan.price}${plan.cadence})`}
        </button>
        <p className="text-center text-xs text-foreground/45">
          No payment is collected on this page. We email a secure payment link within one business day.
        </p>
      </form>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-primary" />
            <div className="text-[10px] font-mono text-primary/80 tracking-widest">
              ORDER SUMMARY
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">{plan.name}</h2>
          <p className="text-xs text-foreground/55 mb-5">{plan.description}</p>

          <div className="rounded-lg border border-white/10 bg-black/30 p-4 mb-5">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-foreground/55 text-sm">Price</span>
              <span>
                <span className="text-2xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-foreground/55">{plan.cadence}</span>
              </span>
            </div>
            <div className="flex justify-between text-sm mt-3">
              <span className="text-foreground/55">Volume</span>
              <span className="text-white font-medium">{plan.videos}</span>
            </div>
          </div>

          <ul className="space-y-2 mb-5">
            {[
              'Voice-matched to your channel',
              '3 business day turnaround per package',
              'One round of revisions per asset',
              'Cancel anytime',
              'You own everything',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-foreground/65 leading-snug"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/dark-story-engine#pricing"
            className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
          >
            Compare plans
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
