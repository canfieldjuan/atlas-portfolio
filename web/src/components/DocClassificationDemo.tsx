'use client';

import { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Mail,
  Loader2,
  ShieldCheck,
  UserSquare2,
  Receipt,
} from 'lucide-react';

type Stage = 'idle' | 'uploading' | 'parsing' | 'classifying' | 'routing' | 'done';

type SampleDoc = {
  id: string;
  fileName: string;
  fileSize: string;
  description: string;
  icon: React.ReactNode;
};

type ClassificationResult = {
  docId: string;
  fileName: string;
  fileSize: string;
  classification: string;
  confidence: number;
  extracted: { label: string; value: string }[];
  routing: string;
  flags: string[];
};

const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'invoice-acme',
    fileName: 'ACME-Invoice-Q3-2024.pdf',
    fileSize: '127 KB',
    description: 'Vendor invoice with PO match',
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    id: 'resume-smith',
    fileName: 'Smith-Resume.docx',
    fileSize: '84 KB',
    description: 'Inbound candidate resume',
    icon: <UserSquare2 className="w-4 h-4" />,
  },
  {
    id: 'nda-vendor',
    fileName: 'Vendor-NDA-v2.pdf',
    fileSize: '246 KB',
    description: 'Mutual NDA from vendor',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 'support-issue',
    fileName: 'Customer-Issue.eml',
    fileSize: '12 KB',
    description: 'Inbound support email',
    icon: <Mail className="w-4 h-4" />,
  },
];

const STAGES: { id: Stage; label: string }[] = [
  { id: 'uploading', label: 'Upload received' },
  { id: 'parsing', label: 'Document parsed' },
  { id: 'classifying', label: 'Content classified' },
  { id: 'routing', label: 'Routing decided' },
];

const STAGE_INDEX: Record<Stage, number> = {
  idle: -1,
  uploading: 0,
  parsing: 1,
  classifying: 2,
  routing: 3,
  done: 4,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DocClassificationDemo() {
  const [stage, setStage] = useState<Stage>('idle');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const isProcessing = stage !== 'idle' && stage !== 'done';

  async function processDoc(docId: string) {
    const runId = ++runIdRef.current;
    const isCurrent = () => runIdRef.current === runId;

    setActiveDocId(docId);
    setResult(null);
    setError(null);
    setNote(null);
    setStage('uploading');

    const apiPromise = fetch('/api/demo/classify-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Classification failed.');
      }
      return data as { ok: true; result: ClassificationResult; note: string };
    });
    apiPromise.catch(() => {
      /* Abandoned runs (Reset / superseded) skip `await apiPromise`.
         Attach a handler so a later rejection isn't unhandled. */
    });

    try {
      await delay(450);
      if (!isCurrent()) return;
      setStage('parsing');
      await delay(650);
      if (!isCurrent()) return;
      setStage('classifying');
      const data = await apiPromise;
      if (!isCurrent()) return;
      await delay(500);
      if (!isCurrent()) return;
      setStage('routing');
      await delay(450);
      if (!isCurrent()) return;
      setStage('done');
      setResult(data.result);
      setNote(data.note);
    } catch (err) {
      if (!isCurrent()) return;
      setStage('idle');
      setActiveDocId(null);
      setError(err instanceof Error ? err.message : 'Classification failed.');
    }
  }

  function reset() {
    runIdRef.current++;
    setStage('idle');
    setActiveDocId(null);
    setResult(null);
    setError(null);
    setNote(null);
  }

  const currentStageIndex = STAGE_INDEX[stage];

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
            DOCUMENT INTAKE
          </div>
          <h3 className="text-xl font-semibold text-white">Upload, parse, classify, route</h3>
          <p className="text-xs text-foreground/50 mt-1">
            Server-backed demo route: <code className="text-foreground/70">/api/demo/classify-doc</code>. Pick a sample to run the deterministic pipeline.
          </p>
        </div>
        {stage !== 'idle' && (
          <button
            type="button"
            onClick={reset}
            className="px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.02] text-xs font-mono text-foreground/60 hover:border-white/20 hover:text-foreground/80 transition-colors self-start lg:self-end"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
            SAMPLE DOCUMENTS
          </div>
          <div className="space-y-2">
            {SAMPLE_DOCS.map((doc) => {
              const isActive = activeDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => processDoc(doc.id)}
                  aria-pressed={isActive}
                  className={`w-full text-left rounded-md border p-3 transition-colors ${
                    isActive
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20'
                  } ${isProcessing && !isActive ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-foreground/60'
                      }`}
                    >
                      {doc.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="text-sm text-white truncate">{doc.fileName}</div>
                        <div className="text-[11px] font-mono text-foreground/40 shrink-0">{doc.fileSize}</div>
                      </div>
                      <div className="text-xs text-foreground/50 mt-1">{doc.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-[11px] font-mono text-foreground/35 leading-relaxed">
            A production build would replace these sample buttons with real intake events and connect parsing, model classification, routing, and storage.
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-4">
            PIPELINE
          </div>
          <div className="space-y-3 mb-5">
            {STAGES.map((s, index) => {
              const isComplete = currentStageIndex > index;
              const isCurrent = currentStageIndex === index;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                      isComplete
                        ? 'border-primary/50 bg-primary/20 text-primary'
                        : isCurrent
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-white/10 bg-black/30 text-foreground/30'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span className="text-[10px] font-mono">0{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isComplete || isCurrent ? 'text-white' : 'text-foreground/45'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="rounded-md border border-red-400/30 bg-red-500/5 p-3 text-sm text-red-300/90">
              {error}
            </div>
          )}

          {!error && stage === 'idle' && (
            <div className="rounded-md border border-white/5 bg-black/30 p-4 text-sm text-foreground/45 leading-relaxed">
              Pick a sample document to see the parse, classify, and route pipeline run end-to-end.
            </div>
          )}

          {result && stage === 'done' && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <div className="text-sm font-medium text-white truncate">{result.fileName}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-1">
                    CLASSIFICATION
                  </div>
                  <div className="text-sm text-white">{result.classification}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-1">
                    CONFIDENCE
                  </div>
                  <div className="text-sm font-mono text-primary">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">
                EXTRACTED FIELDS
              </div>
              <div className="rounded-md border border-white/10 bg-[#080808] p-3 mb-4 space-y-1.5">
                {result.extracted.map((field) => (
                  <div key={field.label} className="flex items-baseline justify-between gap-3 text-xs font-mono">
                    <span className="text-foreground/45 shrink-0">{field.label}</span>
                    <span className="text-primary/90 text-right truncate">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-2">
                ROUTING DECISION
              </div>
              <div className="text-sm text-white mb-3">{result.routing}</div>

              {result.flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.flags.map((flag) => (
                    <span
                      key={flag}
                      className="text-[11px] font-mono px-2 py-1 rounded border border-white/10 bg-white/[0.04] text-foreground/65"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {note && stage === 'done' && (
            <p className="text-[11px] font-mono text-foreground/35 mt-4 leading-relaxed">{note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
