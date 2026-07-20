import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, getUserFromContext } from '@/lib/auth';
import { SignOutButton } from '@/components/app/sign-out-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = authEnabled() ? await getUserFromContext() : null;

  // When auth is enabled, the product is behind a sign-in wall.
  if (authEnabled() && !user) redirect('/signin');

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-6">
          <Link href="/" className="text-body-lg font-semibold tracking-tight text-ink">
            Parseledger
          </Link>
          <nav className="flex items-center gap-6 text-body-sm text-slate">
            <Link href="/app" className="transition-colors hover:text-ink">
              Jobs
            </Link>
            {user && (
              <Link href="/app/account" className="transition-colors hover:text-ink">
                Account
              </Link>
            )}
            {user && (
              <>
                <span className="text-caption text-ash">{user.email}</span>
                <SignOutButton />
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] px-6 py-10">{children}</main>
    </div>
  );
}
