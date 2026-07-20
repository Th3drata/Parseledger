import type { JobStatus } from '@/lib/store';
import { statusChipStyle } from '@/lib/format';

export function StatusChip({ status, verified }: { status: JobStatus; verified: boolean | null }) {
  const { label, className } = statusChipStyle(status, verified);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium ${className}`}
    >
      {label}
    </span>
  );
}
