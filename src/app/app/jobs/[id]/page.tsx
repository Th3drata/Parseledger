import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJob } from '@/lib/store';
import { resolveOwnerFromContext } from '@/lib/auth';
import { ReviewScreen } from '@/components/app/review-screen';

export const dynamic = 'force-dynamic';

export default async function JobReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = (await resolveOwnerFromContext()) ?? 'local';
  const job = await getJob(id, ownerId);
  if (!job) notFound();

  if (job.status === 'failed') {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-cards border border-hairline bg-ledger px-4 py-3">
          <p className="text-body-sm font-semibold text-ink">Extraction failed</p>
          <p className="mt-1 text-body-sm text-slate">{job.error ?? 'Unknown error.'}</p>
        </div>
      </div>
    );
  }

  if (!job.statement) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-body-sm text-slate">Processing this statement…</p>
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
    <Link href="/app" className="text-body-sm text-slate hover:text-ink">
      ← All jobs
    </Link>
  );
}
