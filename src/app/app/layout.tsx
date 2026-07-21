import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, getUserFromContext } from '@/lib/auth';
import { SignOutButton } from '@/components/app/sign-out-button';
import { CommandPalette } from '@/components/app/command-palette';

function Glyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink">
      <path d="M1 3.5h14M1 7h14M1 10.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 12.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: { userId: string; email: string } | null = null;
  if (authEnabled()) {
    user = await getUserFromContext();
    if (!user) redirect('/signin');
  }
  const demoMode = !process.env.ANTHROPIC_API_KEY;

  return (
    <div className="theme-midnight grain flex min-h-screen bg-paper">
      {/* ——— Sidebar — the instrument's spine ——— */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hairline bg-ledger sm:flex">
        <Link href="/app" className="flex items-center gap-2.5 border-b border-hairline px-5 py-4 text-[16px] font-semibold tracking-tight text-ink">
          <Glyph />
          Parseledger
        </Link>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <Link
            href="/app"
            className="flex items-center justify-between rounded-buttons px-3 py-2 text-body-sm font-medium text-ink hover:bg-mist"
          >
            Workspace
            <span className="kbd">G W</span>
          </Link>
          <Link
            href="/app/account"
            className="flex items-center justify-between rounded-buttons px-3 py-2 text-body-sm font-medium text-slate hover:bg-mist hover:text-ink"
          >
            Account
            <span className="kbd">G A</span>
          </Link>
        </nav>
        <div className="space-y-3 border-t border-hairline px-5 py-4">
          {demoMode ? (
            <p className="flex items-center gap-2 text-caption text-slate">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-caution" />
              Demo mode — sample data
            </p>
          ) : (
            <p className="flex items-center gap-2 text-caption text-slate">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-reconciled" />
              Engine ready
            </p>
          )}
          <p className="tnum text-caption text-ash">opening + credits − debits = closing</p>
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-caption text-slate">{user.email}</span>
              <SignOutButton />
            </div>
          ) : null}
        </div>
      </aside>

      {/* ——— Content ——— */}
      <div className="min-w-0 flex-1">
        {/* Mobile top bar (sidebar hidden) */}
        <header className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:hidden">
          <Link href="/app" className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-ink">
            <Glyph />
            Parseledger
          </Link>
          <Link href="/app/account" className="text-body-sm text-slate">
            Account
          </Link>
        </header>
        <main className="midnight-glow min-h-screen"><div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-8 sm:py-10">{children}</div></main>
      </div>

      <CommandPalette />
    </div>
  );
}
