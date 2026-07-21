import Link from 'next/link';
import { BANKS, COMPETITORS, FORMATS, convertSlug } from '@/lib/seo-banks';
import { LenisProvider } from '@/components/motion/lenis-provider';
import { NavLink } from '@/components/marketing/nav-link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
    <div className="grain flex min-h-screen flex-col bg-paper">
      {/* Split-header à metrics — wordmark bordé · liens mono · statut diégétique · CTA */}
      <header className="glass-paper sticky top-0 z-40 border-b border-hairline">
        <div className="mx-auto flex h-[64px] max-w-[1200px] items-stretch justify-between px-6">
          <div className="flex items-stretch">
            <Link
              href="/"
              className="flex items-center gap-2.5 border-x border-hairline px-5 text-[17px] font-semibold tracking-tight text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink">
                <path d="M1 3.5h14M1 7h14M1 10.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10.5 12.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Parseledger
            </Link>
            <nav className="hidden items-center gap-7 border-r border-hairline px-7 lg:flex">
              <NavLink href="/#workflow" label="Workflow" />
              <NavLink href="/#verification" label="Verification" />
              <NavLink href="/#banks" label="Banks" />
              <NavLink href="/pricing" label="Pricing" />
              <NavLink href="/security" label="Security" />
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="hidden whitespace-nowrap rounded-buttons border border-hairline px-4 py-2 text-body-sm font-medium text-ink hover:bg-ledger sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-buttons bg-ink px-4 py-2 text-body-sm font-medium text-paper hover:bg-ink-soft"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          {/* Manifest — the footer opens the way a statement closes: balanced. */}
          <div className="mb-12 flex flex-col gap-4 border-b border-hairline pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-ink">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-ink">
                  <path d="M1 3.5h14M1 7h14M1 10.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10.5 12.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Parseledger
              </p>
              <p className="mt-3 font-serif text-subheading font-normal text-ink">
                Verified to the cent.
              </p>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((format) => (
              <div key={format.slug}>
                <h3 className="mb-3 text-caption font-semibold uppercase text-slate">
                  Statements to {format.name}
                </h3>
                <ul className="space-y-2">
                  {BANKS.map((bank) => (
                    <li key={bank.slug}>
                      <Link
                        href={`/convert/${convertSlug(bank, format)}`}
                        className="text-body-sm text-slate hover:text-ink"
                      >
                        {bank.name} to {format.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline pt-8">
            <Link href="/pricing" className="text-body-sm text-slate hover:text-ink">
              Pricing
            </Link>
            <Link href="/security" className="text-body-sm text-slate hover:text-ink">
              Security
            </Link>
            <Link href="/xero" className="text-body-sm text-slate hover:text-ink">
              Xero
            </Link>
            <Link href="/quickbooks" className="text-body-sm text-slate hover:text-ink">
              QuickBooks
            </Link>
            {COMPETITORS.map((c) => (
              <Link
                key={c.slug}
                href={`/alternatives/${c.slug}`}
                className="text-body-sm text-slate hover:text-ink"
              >
                {c.name} alternative
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-body-sm text-ash">
              © {new Date().getFullYear()} Parseledger. Parseledger converts and verifies bank
              statement data; it does not provide accounting, tax or financial advice.
            </p>
            <p className="tnum shrink-0 text-caption text-ash">0 floats · 2 checks · 24h purge</p>
          </div>
        </div>
      </footer>
    </div>
    </LenisProvider>
  );
}
