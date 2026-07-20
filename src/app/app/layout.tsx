import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
            Parseledger
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/app" className="transition-colors hover:text-foreground">
              Jobs
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
