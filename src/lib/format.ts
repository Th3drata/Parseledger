import type { JobStatus } from './store';

/** Format an ISO yyyy-mm-dd date for display, e.g. "2026-06-01" → "01 Jun 2026". */
export function formatDate(iso: string | null): string {
  if (iso === null || iso === '') return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIdx = Number(mo) - 1;
  const label = months[monthIdx] ?? mo;
  return `${d} ${label} ${y}`;
}

/** Format an epoch-millis timestamp for the job table, e.g. "20 Jul 2026, 14:32". */
export function formatTimestamp(ms: number): string {
  const dt = new Date(ms);
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface StatusChipStyle {
  label: string;
  className: string;
}

/** Achromatic status chips; only the verified/review distinction earns colour later. */
export function statusChipStyle(status: JobStatus, verified: boolean | null): StatusChipStyle {
  switch (status) {
    case 'processing':
      return { label: 'Processing', className: 'bg-muted text-muted-foreground' };
    case 'review':
      return verified
        ? { label: 'Verified', className: 'bg-accent-soft text-accent' }
        : { label: 'Needs review', className: 'bg-danger-soft text-danger' };
    case 'exported':
      return { label: 'Exported', className: 'bg-accent-soft text-accent' };
    case 'failed':
      return { label: 'Failed', className: 'bg-danger-soft text-danger' };
    default:
      return { label: status, className: 'bg-muted text-muted-foreground' };
  }
}
