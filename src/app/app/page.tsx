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

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Convert a statement</h1>
        <p className="text-body-sm text-slate">
          Upload a bank statement and we prove every figure reconciles before you export.
        </p>
        <div className="pt-3">
          <UploadDropzone demoMode={demoMode} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-body-sm font-semibold tracking-tight text-ink">Recent jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-body-sm text-slate">No jobs yet. Upload a statement to begin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-iron text-left text-caption font-semibold uppercase tracking-wide text-slate">
                  <th className="px-4 py-2.5">File</th>
                  <th className="px-4 py-2.5">Bank</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-hairline odd:bg-paper even:bg-ledger">
                    <td className="px-4 py-2.5">
                      <Link href={`/app/jobs/${job.id}`} className="font-medium text-ink hover:underline">
                        {job.fileName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-ink">
                      {job.statement?.bankName ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusChip status={job.status} verified={job.result?.verified ?? null} />
                    </td>
                    <td className="tnum px-4 py-2.5 text-slate">
                      {formatTimestamp(job.createdAt)}
                    </td>
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
