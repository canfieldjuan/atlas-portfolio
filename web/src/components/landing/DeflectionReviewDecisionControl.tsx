'use client';

import { CheckCircle2, ListChecks, Loader2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

type DeflectionReviewDecision = 'keep_suppressed' | 'promote_to_review';
type PersistenceState = 'configured' | 'unconfigured';
type LoadState = 'idle' | 'loading' | 'ready' | 'saving' | 'error';

type DecisionLoad = {
  decisions: Map<string, DeflectionReviewDecision>;
  persistence: PersistenceState;
};

type DecisionViewState = {
  loadedFor: string;
  loadState: LoadState;
  decision: DeflectionReviewDecision | null;
  persistence: PersistenceState;
  message: string;
  messageTone: 'neutral' | 'error';
};

type DecisionRecord = {
  reviewKey?: unknown;
  review_key?: unknown;
  decision?: unknown;
};

type DeflectionReviewDecisionControlProps = {
  requestId: string;
  reviewKey: string;
  recommendedAction?: string;
  apiPath?: string;
};

const DEFAULT_REVIEW_DECISION_API_PATH = '/api/deflection-review-decisions';
const decisionLoadCache = new Map<string, Promise<DecisionLoad>>();

function isDecision(value: unknown): value is DeflectionReviewDecision {
  return value === 'keep_suppressed' || value === 'promote_to_review';
}

function parsePersistence(value: unknown): PersistenceState {
  return value === 'unconfigured' ? 'unconfigured' : 'configured';
}

function parseDecisionLoad(body: unknown): DecisionLoad {
  const record = typeof body === 'object' && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
  const decisions = new Map<string, DeflectionReviewDecision>();
  const rows = Array.isArray(record.decisions) ? record.decisions : [];

  for (const row of rows) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) continue;
    const decisionRow = row as DecisionRecord;
    const reviewKey = typeof decisionRow.reviewKey === 'string'
      ? decisionRow.reviewKey
      : typeof decisionRow.review_key === 'string'
        ? decisionRow.review_key
        : '';
    if (reviewKey && isDecision(decisionRow.decision)) {
      decisions.set(reviewKey, decisionRow.decision);
    }
  }

  return {
    decisions,
    persistence: parsePersistence(record.persistence),
  };
}

async function fetchDecisionLoad(requestId: string, apiPath: string): Promise<DecisionLoad> {
  const encodedRequestId = encodeURIComponent(requestId);
  let separator = '?';
  if (apiPath.includes('?')) {
    separator = apiPath.endsWith('?') || apiPath.endsWith('&') ? '' : '&';
  }
  const loadUrl = `${apiPath}${separator}requestId=${encodedRequestId}`;
  const response = await fetch(loadUrl, {
    headers: { Accept: 'application/json' },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>).error
      : null;
    throw new Error(typeof error === 'string' && error.trim() ? error : 'Review decisions unavailable.');
  }
  return parseDecisionLoad(body);
}

function cachedDecisionLoad(requestId: string, apiPath: string): Promise<DecisionLoad> {
  const cacheKey = `${apiPath}:${requestId}`;
  const cached = decisionLoadCache.get(cacheKey);
  if (cached) return cached;

  const promise = fetchDecisionLoad(requestId, apiPath).catch((error: unknown) => {
    decisionLoadCache.delete(cacheKey);
    throw error;
  });
  decisionLoadCache.set(cacheKey, promise);
  return promise;
}

function decisionLabel(decision: DeflectionReviewDecision | null): string {
  if (decision === 'keep_suppressed') return 'Keep suppressed';
  if (decision === 'promote_to_review') return 'Promote to review';
  return 'No saved decision';
}

export function DeflectionReviewDecisionControl({
  requestId,
  reviewKey,
  recommendedAction = '',
  apiPath = DEFAULT_REVIEW_DECISION_API_PATH,
}: DeflectionReviewDecisionControlProps) {
  const statusId = useId();
  const currentKey = `${apiPath}:${requestId}:${reviewKey}`;
  const [viewState, setViewState] = useState<DecisionViewState>({
    loadedFor: '',
    loadState: 'loading',
    decision: null,
    persistence: 'configured',
    message: 'Loading saved decision...',
    messageTone: 'neutral',
  });

  useEffect(() => {
    let cancelled = false;
    if (!reviewKey) return;

    cachedDecisionLoad(requestId, apiPath)
      .then((loaded) => {
        if (cancelled) return;
        setViewState({
          loadedFor: currentKey,
          loadState: 'ready',
          decision: loaded.decisions.get(reviewKey) ?? null,
          persistence: loaded.persistence,
          message: loaded.persistence === 'unconfigured' ? 'Decision storage is not configured.' : 'Ready for review.',
          messageTone: loaded.persistence === 'unconfigured' ? 'error' : 'neutral',
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setViewState({
          loadedFor: currentKey,
          loadState: 'error',
          decision: null,
          persistence: 'configured',
          message: error instanceof Error ? error.message : 'Review decisions unavailable.',
          messageTone: 'error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [apiPath, currentKey, requestId, reviewKey]);

  const loadState: LoadState = !reviewKey
    ? 'error'
    : viewState.loadedFor === currentKey
      ? viewState.loadState
      : 'loading';
  const decision = viewState.loadedFor === currentKey ? viewState.decision : null;
  const persistence = viewState.loadedFor === currentKey ? viewState.persistence : 'configured';
  const message = !reviewKey
    ? 'No review handle for this row.'
    : viewState.loadedFor === currentKey
      ? viewState.message
      : 'Loading saved decision...';

  async function saveDecision(nextDecision: DeflectionReviewDecision) {
    if (!reviewKey || loadState === 'saving' || persistence === 'unconfigured') return;

    setViewState({
      loadedFor: currentKey,
      loadState: 'saving',
      decision,
      persistence,
      message: 'Saving decision...',
      messageTone: 'neutral',
    });
    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, reviewKey, decision: nextDecision }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const error = typeof body === 'object' && body !== null && !Array.isArray(body)
          ? (body as Record<string, unknown>).error
          : null;
        throw new Error(typeof error === 'string' && error.trim() ? error : 'Decision was not saved.');
      }

      decisionLoadCache.delete(`${apiPath}:${requestId}`);
      setViewState({
        loadedFor: currentKey,
        loadState: 'ready',
        decision: nextDecision,
        persistence,
        message: `Saved: ${decisionLabel(nextDecision)}.`,
        messageTone: 'neutral',
      });
    } catch (error) {
      setViewState({
        loadedFor: currentKey,
        loadState: 'ready',
        decision,
        persistence,
        message: error instanceof Error ? error.message : 'Decision was not saved.',
        messageTone: 'error',
      });
    }
  }

  const disabled =
    !reviewKey ||
    loadState === 'loading' ||
    loadState === 'saving' ||
    loadState === 'error' ||
    persistence === 'unconfigured';
  const keepSelected = decision === 'keep_suppressed';
  const promoteSelected = decision === 'promote_to_review';
  const messageTone = !reviewKey ? 'error' : viewState.loadedFor === currentKey ? viewState.messageTone : 'neutral';
  const statusMessage = loadState === 'ready' && decision && message === 'Ready for review.'
    ? decisionLabel(decision)
    : message;
  const statusClassName = messageTone === 'error'
    ? 'text-red-300'
    : 'text-foreground/50';

  return (
    <div className="min-w-[220px]" data-smoke="deflectionReviewDecisionControl">
      {recommendedAction ? (
        <p className="text-xs leading-relaxed text-foreground/58">{recommendedAction}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={keepSelected}
          aria-label="Keep suppressed"
          aria-describedby={statusId}
          disabled={disabled}
          title="Keep suppressed"
          onClick={() => saveDecision('keep_suppressed')}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
            keepSelected
              ? 'border-emerald-500/45 bg-emerald-500/12 text-emerald-200'
              : 'border-border bg-background/45 text-foreground/72 hover:border-foreground/30 hover:text-foreground'
          } disabled:cursor-not-allowed disabled:opacity-55`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Keep
        </button>
        <button
          type="button"
          aria-pressed={promoteSelected}
          aria-label="Promote to review"
          aria-describedby={statusId}
          disabled={disabled}
          title="Promote to review"
          onClick={() => saveDecision('promote_to_review')}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
            promoteSelected
              ? 'border-sky-500/45 bg-sky-500/12 text-sky-200'
              : 'border-border bg-background/45 text-foreground/72 hover:border-foreground/30 hover:text-foreground'
          } disabled:cursor-not-allowed disabled:opacity-55`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Promote
        </button>
      </div>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`mt-2 flex items-center gap-1.5 text-[11px] leading-relaxed ${statusClassName}`}
      >
        {loadState === 'loading' || loadState === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        <span>{statusMessage}</span>
      </p>
    </div>
  );
}
