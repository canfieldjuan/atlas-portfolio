import { cookies, headers } from 'next/headers';
import { Download, FileText, Lock, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { recordAdminAccessEvent } from '@/lib/admin-access-log';
import { ADMIN_INTAKE_COOKIE, adminIntakeConfigured, verifyAdminIntakeCookie } from '@/lib/admin-intake-auth';
import {
  auditIntakeDatabaseConfigured,
  listAuditIntakeRecords,
  type AuditIntakeSummaryRow,
} from '@/lib/audit-intake-database';
import {
  gapReportDatabaseConfigured,
  listGapReportSubmissions,
  type GapReportSummaryRow,
} from '@/lib/gap-report-intake-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

type LoginError = 'invalid' | 'rate_limited';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function label(primary: string | null | undefined, fallback: string | null | undefined) {
  return primary || fallback || 'Not provided';
}

function DetailBlock({ title, body }: { title: string; body: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 text-[10px] font-mono tracking-[0.2em] text-foreground/35 uppercase">
        {title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/70">
        {body || 'Not provided'}
      </p>
    </div>
  );
}

function LoginPanel({ error }: { error?: LoginError }) {
  return (
    <main className="min-h-screen px-6 pb-20 pt-32">
      <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <p className="mb-3 text-[10px] font-mono tracking-[0.25em] text-primary uppercase">
          Private Admin
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">Intake queue</h1>
        <p className="mb-8 text-sm leading-relaxed text-foreground/60">
          Enter the admin intake token to view recent audit requests and deflection CSV submissions.
        </p>

        {!adminIntakeConfigured() ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            Configure <code>ADMIN_INTAKE_TOKEN</code> in Vercel before using this page.
          </div>
        ) : (
          <form action="/admin/intake/login" method="post" className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-foreground/60">Admin token</span>
              <input
                name="token"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary/60"
                placeholder="Paste admin token"
                required
              />
            </label>
            {error === 'invalid' ? (
              <p className="text-sm text-rose-300">Invalid admin token. Try again.</p>
            ) : null}
            {error === 'rate_limited' ? (
              <p className="text-sm text-rose-300">
                Too many failed attempts. Try again in a few minutes.
              </p>
            ) : null}
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-primary/90">
              Open queue
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function LedgerUnavailablePanel() {
  return (
    <main className="min-h-screen px-6 pb-20 pt-32">
      <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="mb-3 text-[10px] font-mono tracking-[0.25em] text-primary uppercase">
          Private Admin
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">
          Access ledger unavailable
        </h1>
        <p className="text-sm leading-relaxed text-foreground/60">
          Configure <code>ADMIN_ACCESS_LOG_DATABASE_URL</code> or a shared intake database before
          viewing customer submissions. Admin access is blocked when the ledger cannot record it.
        </p>
      </section>
    </main>
  );
}

function SubmissionCard({ row }: { row: AuditIntakeSummaryRow }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-mono tracking-[0.2em] text-primary uppercase">
            {formatDate(row.submittedAt)}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{row.fullName}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/55">
            <span className="rounded-full border border-border px-3 py-1">
              {label(row.projectInterestLabel, row.projectInterest)}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {label(row.sourcePageLabel, row.sourcePage)}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {label(row.sourceOfferLabel, row.sourceOffer)}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground/65 lg:min-w-72">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <a href={`mailto:${row.workEmail}`} className="hover:text-primary">
              {row.workEmail}
            </a>
          </div>
          <div className="break-all text-foreground/55">{row.companyOrProjectUrl}</div>
          <div className="mt-3 text-foreground/55">{row.roleAndDecisionScope}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailBlock title="Biggest bottleneck" body={row.biggestBottleneck} />
        <DetailBlock title="Automation / data sources" body={row.automationDataSources} />
        <DetailBlock title="Current ecosystem" body={row.currentTechEcosystem} />
        <DetailBlock title="Deployment constraints" body={row.deploymentConstraints} />
        <DetailBlock title="ROI goal" body={row.roiGoal} />
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 text-[10px] font-mono tracking-[0.2em] text-foreground/35 uppercase">
            Fit signals
          </div>
          <dl className="space-y-2 text-sm text-foreground/70">
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/40">Timeline</dt>
              <dd>{label(row.desiredTimelineLabel, row.desiredTimeline)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/40">Security</dt>
              <dd>{label(row.securityRequirementLabel, row.securityRequirement)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/40">Budget</dt>
              <dd>{label(row.anticipatedInvestmentRangeLabel, row.anticipatedInvestmentRange)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}

function GapReportSubmissionCard({ row }: { row: GapReportSummaryRow }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-mono tracking-[0.2em] text-primary uppercase">
            {formatDate(row.submittedAt)}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{row.companyName}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/55">
            <span className="rounded-full border border-border px-3 py-1">
              {row.supportPlatform || 'platform not specified'}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {row.sourceOffer || 'no offer source'}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {row.notificationStatus}
            </span>
          </div>
          <p className="mt-4 break-all font-mono text-xs text-foreground/35">
            {row.requestId}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground/65 lg:min-w-80">
          <div className="mb-3 flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <a href={`mailto:${row.email}`} className="hover:text-primary">
              {row.email}
            </a>
          </div>
          <div className="mb-4 flex items-center gap-2 break-all text-foreground/55">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            {row.csvFilename}
          </div>
          <a
            href={`/admin/intake/gap-report/${row.requestId}/csv`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        </div>
      </div>
    </article>
  );
}

export default async function AdminIntakePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const isAuthorized = verifyAdminIntakeCookie(cookieStore.get(ADMIN_INTAKE_COOKIE)?.value);

  if (!isAuthorized) {
    const error = params?.error === 'invalid' || params?.error === 'rate_limited'
      ? params.error
      : undefined;
    return <LoginPanel error={error} />;
  }

  const requestHeaders = await headers();
  const accessLog = await recordAdminAccessEvent({
    action: 'admin_intake_view',
    targetType: 'admin_intake_queue',
    headers: requestHeaders,
  });
  if (!accessLog.ok) {
    return <LedgerUnavailablePanel />;
  }

  const rows = await listAuditIntakeRecords(50);
  const gapReportRows = await listGapReportSubmissions(25);

  return (
    <main className="min-h-screen px-6 pb-20 pt-32">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-primary uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private Queue
            </p>
            <h1 className="mb-3 text-4xl font-semibold tracking-tight text-foreground">
              Intake submissions
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/60">
              Recent portfolio audit requests and deflection CSV submissions persisted in the
              dedicated Neon intake database. This view is read-only and intentionally separate
              from the Atlas B2B CRM event stream.
            </p>
          </div>
          <form action="/admin/intake/logout" method="post">
            <button className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm text-foreground/65 transition-colors hover:border-border hover:text-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              Deflection CSV submissions
            </h2>
            {!gapReportDatabaseConfigured() ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
                Configure <code>GAP_REPORT_DATABASE_URL</code> or <code>DATABASE_URL</code> before
                using deflection CSV downloads.
              </div>
            ) : gapReportRows.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-8 text-sm text-foreground/60">
                No deflection CSV submissions have been persisted yet.
              </div>
            ) : (
              <div className="space-y-5">
                {gapReportRows.map((row) => (
                  <GapReportSubmissionCard key={row.requestId} row={row} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
              Audit intake submissions
            </h2>
            {!auditIntakeDatabaseConfigured() ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
                Configure <code>AUDIT_INTAKE_DATABASE_URL</code> or <code>DATABASE_URL</code> before
                using the audit intake database.
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-8 text-sm text-foreground/60">
                No audit requests have been persisted yet.
              </div>
            ) : (
              <div className="space-y-5">
                {rows.map((row) => (
                  <SubmissionCard key={row.requestId} row={row} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
