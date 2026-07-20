import Link from 'next/link';

export function LocalModeNote() {
  return (
    <div className="space-y-4">
      <div className="rounded-cards border border-hairline bg-ledger p-4 text-body-sm text-slate">
        Running in local mode — accounts are disabled. Your jobs are kept in memory
        for this session only.
      </div>
      <Link
        href="/app"
        className="inline-block rounded-buttons bg-ink px-4 py-2.5 text-center text-body-sm font-medium text-white transition-colors hover:bg-ink-soft"
      >
        Go to the app
      </Link>
    </div>
  );
}
