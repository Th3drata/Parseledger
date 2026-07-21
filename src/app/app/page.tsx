import Link from 'next/link';
import { listJobs } from '@/lib/store';
import { formatTimestamp } from '@/lib/format';
import { resolveOwnerFromContext } from '@/lib/auth';
import { UploadDropzone } from '@/components/app/upload-dropzone';
import { StatusChip } from '@/components/app/status-chip';

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
        {jobs.length === 0 ? (
          <div className="ruled-paper rounded-cards border border-hairline px-6 py-10 text-center">
            <p className="text-body-sm text-ink-soft">Nothing recorded yet.</p>
            <p className="mt-1 text-body-sm text-slate">
              Drop a statement above — the first entry takes about a minute.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-cards border border-hairline">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-iron bg-ledger text-left text-caption font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-2.5">File</th>
                  <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">Bank</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right sm:table-cell">Rows</th>
                  <th scope="col" className="px-4 py-2.5">Status</th>
                  <th scope="col" className="hidden px-4 py-2.5 md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="group border-b border-hairline transition-colors last:border-0 hover:bg-ledger">
                    <td className="px-4 py-2.5">
                      <Link href={`/app/jobs/${job.id}`} className="font-medium text-ink group-hover:underline">
                        {job.fileName}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-2.5 text-ink sm:table-cell">{job.statement?.bankName ?? '—'}</td>
                    <td className="tnum hidden px-4 py-2.5 text-right text-slate sm:table-cell">
                      {job.statement?.transactions.length ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusChip status={job.status} verified={job.result?.verified ?? null} />
                    </td>
                    <td className="tnum hidden px-4 py-2.5 text-slate md:table-cell">{formatTimestamp(job.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
