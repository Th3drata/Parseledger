'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StatusChip } from './status-chip';
import type { JobStatus } from '@/lib/store';

export interface JobRow {
  id: string;
  fileName: string;
  status: JobStatus;
  bankName: string | null;
  txCount: number | null;
  verified: boolean | null;
  createdAtLabel: string;
}

type Filter = 'all' | 'verified' | 'review' | 'broken' | 'failed';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'verified', label: 'Verified' },
  { id: 'review', label: 'Needs review' },
  { id: 'broken', label: "Doesn't balance" },
  { id: 'failed', label: 'Failed' },
];

function matchesFilter(job: JobRow, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'verified':
      return job.verified === true;
    case 'review':
      return job.status === 'review' && job.verified === false;
    case 'broken':
      return job.verified === false;
    case 'failed':
      return job.status === 'failed';
  }
}

/** JOB-2: triage — search by file/bank, filter by verification status, delete. */
export function JobsTable({ jobs }: { jobs: JobRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        matchesFilter(j, filter) &&
        (q === '' || `${j.fileName} ${j.bankName ?? ''}`.toLowerCase().includes(q)),
    );
  }, [jobs, query, filter]);

  async function remove(job: JobRow) {
    if (!window.confirm(`Delete "${job.fileName}" and its extracted data?`)) return;
    setDeleting(job.id);
    const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
    setDeleting(null);
    if (!res.ok) {
      toast.error('Could not delete the statement.');
      return;
    }
    toast.success('Statement deleted.');
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search file or bank…"
          aria-label="Search jobs"
          className="min-w-0 flex-1 rounded-inputs bg-ledger px-3 py-2 text-body-sm text-ink outline-none placeholder:text-ash focus:bg-paper focus:ring-1 focus:ring-iron sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                filter === f.id ? 'bg-ink text-paper' : 'bg-mist text-slate hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="ruled-paper rounded-cards border border-hairline px-6 py-10 text-center">
          <p className="text-body-sm text-slate">
            {jobs.length === 0 ? 'Nothing recorded yet — drop a statement above.' : 'No statements match.'}
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
                <th scope="col" className="w-10 px-2 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.id} className="group border-b border-hairline transition-colors last:border-0 hover:bg-ledger">
                  <td className="px-4 py-2.5">
                    <Link href={`/app/jobs/${job.id}`} className="font-medium text-ink group-hover:underline">
                      {job.fileName}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-2.5 text-ink sm:table-cell">{job.bankName ?? '—'}</td>
                  <td className="tnum hidden px-4 py-2.5 text-right text-slate sm:table-cell">{job.txCount ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <StatusChip status={job.status} verified={job.verified} />
                  </td>
                  <td className="tnum hidden px-4 py-2.5 text-slate md:table-cell">{job.createdAtLabel}</td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => void remove(job)}
                      disabled={deleting === job.id}
                      aria-label={`Delete ${job.fileName}`}
                      className="rounded-tags px-1.5 py-1 text-caption text-ash opacity-0 transition-opacity hover:bg-flag-wash hover:text-flag focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
