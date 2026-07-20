import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, getUserFromContext } from '@/lib/auth';
import { SignOutButton } from '@/components/app/sign-out-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = authEnabled() ? await getUserFromContext() : null;

  // When auth is enabled, the product is behind a sign-in wall.
  if (authEnabled() && !user) redirect('/signin');

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
            {user && (
              <Link href="/app/account" className="transition-colors hover:text-foreground">
                Account
              </Link>
            )}
            {user && (
              <>
                <span className="text-foreground/80">{user.email}</span>
                <SignOutButton />
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
