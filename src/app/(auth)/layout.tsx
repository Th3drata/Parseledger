import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, getSessionFromContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * The door to the instrument. Midnight, like the app behind it: form on the
 * left, the house identity on the right. Already signed in → straight to work.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (authEnabled()) {
    const session = await getSessionFromContext();
    if (session) redirect('/app');
  }

  return (
    <div className="theme-midnight grain flex min-h-screen bg-paper">
      <div className="flex w-full flex-col lg:w-[46%]">
        <header className="px-8 py-6">
          <Link href="/" className="flex items-center gap-2.5 text-[16px] font-semibold tracking-tight text-ink">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink">
              <path d="M1 3.5h14M1 7h14M1 10.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10.5 12.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Parseledger
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-8 pb-24">
          {children}
        </main>
      </div>
      {/* The house panel — the identity, kept lit */}
      <aside className="midnight-glow relative hidden flex-1 items-center justify-center border-l border-hairline bg-ledger lg:flex">
        <div aria-hidden className="ink-grid absolute inset-0 opacity-60" />
        <div className="relative max-w-md px-10">
          <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
            The identity behind every export
          </p>
          <p className="tnum mt-6 text-figure-lg leading-relaxed text-ink">
            opening
            <br />
            <span className="text-ash">+</span> credits
            <br />
            <span className="text-ash">−</span> debits
            <br />
            <span className="text-ash">=</span> <span className="figure-glow text-reconciled">closing</span>
          </p>
          <p className="mt-8 max-w-xs text-body-sm leading-relaxed text-slate">
            Every statement you convert is proven against its own arithmetic before you are
            asked to trust it. Zero issues, or it stays flagged.
          </p>
        </div>
      </aside>
    </div>
  );
}
