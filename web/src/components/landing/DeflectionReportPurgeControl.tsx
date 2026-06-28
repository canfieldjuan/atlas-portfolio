'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';

type PurgeState = 'idle' | 'confirming' | 'deleting' | 'deleted';

export function DeflectionReportPurgeControl({ requestId }: { requestId: string }) {
  const [state, setState] = useState<PurgeState>('idle');
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setState('deleting');
    setError(null);
    try {
      const res = await fetch('/api/deflection-report-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setState('deleted');
        return;
      }
      setState('confirming');
      setError(data.error ?? 'Could not finish deletion. Please try again.');
    } catch {
      setState('confirming');
      setError('Could not finish deletion. Please try again.');
    }
  }

  if (state === 'deleted') {
    return (
      <div className="rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground/70">
        <div className="font-medium text-foreground">Upload and report deleted.</div>
        <p className="mt-1 leading-relaxed">
          This results link may stop loading after the page cache refreshes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground/70">
      {state === 'confirming' || state === 'deleting' ? (
        <div className="space-y-3">
          <p className="leading-relaxed">
            Delete the uploaded CSV and hosted report now? This cannot be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={state === 'deleting'}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {state === 'deleting' ? 'Deleting...' : 'Confirm delete'}
            </button>
            <button
              type="button"
              onClick={() => {
                setState('idle');
                setError(null);
              }}
              disabled={state === 'deleting'}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setState('confirming')}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-primary"
        >
          <Trash2 className="h-4 w-4" />
          Delete this upload and report
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
