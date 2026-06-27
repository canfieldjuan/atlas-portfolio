import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { DeflectionReviewDecisionControl } from '@/components/landing/DeflectionReviewDecisionControl';

export const dynamic = 'force-dynamic';

const SMOKE_API_PATH = '/api/deflection-review-control-smoke';
const SUCCESS_REVIEW_KEY = 'review_111111111111111111111111';
const FAILURE_REVIEW_KEY = 'review_222222222222222222222222';

function SmokeCase({
  title,
  children,
  marker,
}: {
  title: string;
  children: ReactNode;
  marker: string;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-card/82 p-5 shadow-sm"
      data-smoke={marker}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DeflectionReviewControlSmokePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/48">
          Local smoke harness
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Deflection review decision controls
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/62">
          This development-only page renders the real suppressed-repeat review control against a deterministic smoke API.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SmokeCase title="Saved state and successful save" marker="review-control-success">
            <DeflectionReviewDecisionControl
              requestId="smoke-review-control"
              reviewKey={SUCCESS_REVIEW_KEY}
              recommendedAction="Starts with a saved keep decision, then the browser smoke promotes it."
              apiPath={SMOKE_API_PATH}
            />
          </SmokeCase>

          <SmokeCase title="Missing hosted-safe review key" marker="review-control-no-key">
            <DeflectionReviewDecisionControl
              requestId="smoke-review-control"
              reviewKey=""
              recommendedAction="Rows without a hosted-safe review key must stay display-only."
              apiPath={SMOKE_API_PATH}
            />
          </SmokeCase>

          <SmokeCase title="Unconfigured decision storage" marker="review-control-unconfigured">
            <DeflectionReviewDecisionControl
              requestId="smoke-review-control-unconfigured"
              reviewKey={SUCCESS_REVIEW_KEY}
              recommendedAction="The controls are visible but disabled when persistence is unavailable."
              apiPath={SMOKE_API_PATH}
            />
          </SmokeCase>

          <SmokeCase title="Failed save remains retryable" marker="review-control-save-failure">
            <DeflectionReviewDecisionControl
              requestId="smoke-review-control-failure"
              reviewKey={FAILURE_REVIEW_KEY}
              recommendedAction="The smoke API rejects this key so the browser can prove the error state."
              apiPath={SMOKE_API_PATH}
            />
          </SmokeCase>
        </div>
      </div>
    </main>
  );
}
