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
      return { label: 'Processing', className: 'bg-mist text-slate' };
    case 'review':
      // Verified/needs-review ARE engine verification states — colour is earned here.
      return verified
        ? { label: 'Verified', className: 'bg-reconciled-wash text-reconciled' }
        : { label: 'Needs review', className: 'bg-caution-wash text-caution' };
    case 'exported':
      // A neutral outcome, not a live verification state — keep it achromatic.
      return { label: 'Exported', className: 'bg-mist text-ink-soft' };
    case 'failed':
      // A genuinely broken state earns the flag hue.
      return { label: 'Failed', className: 'bg-flag-wash text-flag' };
    default:
      return { label: status, className: 'bg-mist text-slate' };
  }
}
