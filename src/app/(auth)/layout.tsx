import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { authEnabled, getSessionFromContext } from '@/lib/auth';
import { VerifiedBadge } from '@/components/app/verified-badge';

export const dynamic = 'force-dynamic';

/**
 * The door. Form on the left, the house on the right — a scene, not a
 * formula. Already signed in → straight to work.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (authEnabled()) {
    const session = await getSessionFromContext();
    if (session) redirect('/app');
  }

  return (
    <div className="theme-midnight grain flex min-h-screen bg-paper">
      <div className="flex w-full flex-col lg:w-[44%]">
        <header className="px-8 pt-8">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[16px] font-semibold tracking-tight text-ink">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink">
              <path d="M1 3.5h14M1 7h14M1 10.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10.5 12.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Parseledger
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-8 py-12">
          {children}
        </main>
        <footer className="flex items-center gap-4 px-8 pb-6">
          <Link href="/security" className="text-caption text-ash hover:text-slate">
            Security
          </Link>
          <Link href="/pricing" className="text-caption text-ash hover:text-slate">
            Pricing
          </Link>
          <span className="tnum ml-auto text-caption text-ash">EU-hosted · 24h purge</span>
        </footer>
      </div>

      {/* ——— The house panel: the scene, a line, the badge ——— */}
      <aside className="relative hidden flex-1 overflow-hidden border-l border-hairline lg:block">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          sizes="56vw"
          priority
          className="object-cover object-[30%_center]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgba(6,8,12,0.82)] via-[rgba(6,8,12,0.25)] to-transparent" />
        <figure className="absolute inset-x-0 bottom-0 p-10">
          <blockquote className="max-w-md">
            <p className="font-serif text-heading-sm font-normal leading-snug text-white">
              Every statement is proven against its own arithmetic before anyone is asked to
              trust it.
            </p>
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
            <VerifiedBadge state="reconciled" label="Verified to the cent" />
            <span className="text-caption text-white/60">The rule the whole product hangs on.</span>
          </figcaption>
        </figure>
      </aside>
    </div>
  );
}
