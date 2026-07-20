import Link from 'next/link';
import { listJobs } from '@/lib/store';
import { formatTimestamp } from '@/lib/format';
import { UploadDropzone } from '@/components/app/upload-dropzone';
import { StatusChip } from '@/components/app/status-chip';

export const dynamic = 'force-dynamic';

export default function AppHomePage() {
  const jobs = listJobs();
  const demoMode = !process.env.ANTHROPIC_API_KEY;

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Convert a statement</h1>
        <p className="text-sm text-muted-foreground">
          Upload a bank statement and we prove every figure reconciles before you export.
        </p>
        <div className="pt-3">
          <UploadDropzone demoMode={demoMode} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-ink">Recent jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs yet. Upload a statement to begin.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">File</th>
                  <th className="px-4 py-2.5 font-medium">Bank</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/app/jobs/${job.id}`} className="font-medium text-ink hover:underline">
                        {job.fileName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {job.statement?.bankName ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusChip status={job.status} verified={job.result?.verified ?? null} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tnum">
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
