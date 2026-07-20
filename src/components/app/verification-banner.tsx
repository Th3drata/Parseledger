import type { VerificationResult } from '@/types';

export function VerificationBanner({ result }: { result: VerificationResult }) {
  if (result.verified) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3">
        <span aria-hidden className="mt-0.5 text-accent">✓</span>
        <p className="text-sm font-medium text-accent">
          Verified to the cent — opening + credits − debits reconciles to the closing balance.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3">
      <p className="text-sm font-semibold text-danger">
        Not verified — {result.issues.length} issue{result.issues.length === 1 ? '' : 's'} to resolve
        before this reconciles.
      </p>
      <ul className="mt-2 space-y-1.5">
        {result.issues.map((issue, i) => (
          <li key={`${issue.code}-${issue.rowIndex ?? 'stmt'}-${i}`} className="flex gap-2 text-sm text-danger">
            <span aria-hidden className="select-none">•</span>
            <span>
              {issue.rowIndex !== null && (
                <span className="font-medium">Row {issue.rowIndex + 1}: </span>
              )}
              {issue.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
