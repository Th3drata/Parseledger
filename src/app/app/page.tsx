import Link from 'next/link';
import { listJobs } from '@/lib/store';
import { formatTimestamp } from '@/lib/format';
import { resolveOwnerFromContext } from '@/lib/auth';
import { UploadDropzone } from '@/components/app/upload-dropzone';
import { JobsTable, type JobRow } from '@/components/app/jobs-table';

export const dynamic = 'force-dynamic';

export default async function AppHomePage() {
  const ownerId = (await resolveOwnerFromContext()) ?? 'local';
  const jobs = await listJobs(ownerId);
  const demoMode = !process.env.ANTHROPIC_API_KEY;

  const verified = jobs.filter((j) => j.result?.verified).length;
  const inReview = jobs.filter((j) => j.status === 'review' && !j.result?.verified).length;
  const rows = jobs.reduce((n, j) => n + (j.statement?.transactions.length ?? 0), 0);
  const flagged = jobs.reduce((n, j) => n + (j.result?.flaggedRows.length ?? 0), 0);

  return (
    <div className="space-y-10">
      {/* ——— Metric strip — the month at a glance, real data only ——— */}
      <section aria-label="Workspace metrics" className="grid grid-cols-2 gap-px overflow-hidden rounded-cards border border-hairline bg-hairline lg:grid-cols-4">
        {[
          [String(jobs.length), 'statements', 'in this workspace'],
          [String(verified), 'verified', 'to the cent, zero issues'],
          [String(inReview), 'awaiting review', flagged > 0 ? `${flagged} row${flagged === 1 ? '' : 's'} flagged` : 'nothing flagged'],
          [String(rows), 'rows extracted', 'integer pence, no floats'],
        ].map(([n, label, sub]) => (
          <div key={label} className="bg-paper px-5 py-4">
            <p className="tnum figure-glow text-figure-lg font-medium text-ink">{n}</p>
            <p className="mt-1 text-caption font-medium uppercase tracking-wide text-slate">{label}</p>
            <p className="mt-0.5 text-caption text-ash">{sub}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Convert a statement</h1>
          <p className="text-caption text-ash">
            <span className="kbd">⌘K</span> jump anywhere
          </p>
        </div>
        <p className="text-body-sm text-slate">
          Upload a bank statement and the engine proves every figure reconciles before you export.
        </p>
        <div className="pt-3">
          <UploadDropzone demoMode={demoMode} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-body-sm font-semibold tracking-tight text-ink">The ledger</h2>
        <JobsTable
          jobs={jobs.map(
            (job): JobRow => ({
              id: job.id,
              fileName: job.fileName,
              status: job.status,
              bankName: job.statement?.bankName ?? null,
              txCount: job.statement?.transactions.length ?? null,
              verified: job.result?.verified ?? null,
              createdAtLabel: formatTimestamp(job.createdAt),
            }),
          )}
        />
      </section>
    </div>
  );
}
