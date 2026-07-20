import Link from 'next/link';
import { BANKS, COMPETITORS, FORMATS, convertSlug } from '@/lib/seo-banks';
import { LenisProvider } from '@/components/motion/lenis-provider';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LenisProvider>
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-6 px-6">
          <Link href="/" className="text-[18px] font-semibold tracking-tight text-ink">
            Parseledger
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
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
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden rounded-buttons border border-hairline px-4 py-2 text-body-sm font-medium text-ink hover:bg-ledger sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="rounded-buttons bg-ink px-4 py-2 text-body-sm font-medium text-paper hover:bg-ink-soft"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
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

          <p className="mt-8 text-body-sm text-ash">
            © {new Date().getFullYear()} Parseledger. Parseledger converts and verifies bank
            statement data; it does not provide accounting, tax or financial advice.
          </p>
        </div>
      </footer>
    </div>
    </LenisProvider>
  );
}
