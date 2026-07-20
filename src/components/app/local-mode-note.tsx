import Link from 'next/link';

export function LocalModeNote() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Running in local mode — accounts are disabled. Your jobs are kept in memory
        for this session only.
      </div>
      <Link
        href="/app"
        className="inline-block rounded-md bg-ink px-4 py-2 text-center text-sm font-medium text-background hover:opacity-90"
      >
        Go to the app
      </Link>
    </div>
  );
}
