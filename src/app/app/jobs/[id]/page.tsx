import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJob } from '@/lib/store';
import { ReviewScreen } from '@/components/app/review-screen';

export const dynamic = 'force-dynamic';

export default async function JobReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  if (job.status === 'failed') {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
          <p className="text-sm font-semibold text-danger">Extraction failed</p>
          <p className="mt-1 text-sm text-danger">{job.error ?? 'Unknown error.'}</p>
        </div>
      </div>
    );
  }

  if (!job.statement) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Processing this statement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink />
      <ReviewScreen jobId={job.id} initialStatement={job.statement} />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">
      ← All jobs
    </Link>
  );
}
