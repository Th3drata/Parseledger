import Link from 'next/link';
import { BANKS, COMPETITORS, FORMATS, convertSlug } from '@/lib/seo-banks';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-base font-semibold tracking-tight text-ink">
            Parseledger
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/security" className="text-muted-foreground hover:text-foreground">
              Security
            </Link>
            <Link href="/app" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Sign in
            </Link>
            <Link
              href="/app"
              className="rounded-md bg-ink px-3 py-1.5 font-medium text-background hover:opacity-90"
            >
              Convert a statement
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-muted/50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((format) => (
              <div key={format.slug}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Statements to {format.name}
                </h3>
                <ul className="space-y-1">
                  {BANKS.map((bank) => (
                    <li key={bank.slug}>
                      <Link
                        href={`/convert/${convertSlug(bank, format)}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {bank.name} to {format.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-xs">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/security" className="text-muted-foreground hover:text-foreground">
              Security
            </Link>
            <Link href="/xero" className="text-muted-foreground hover:text-foreground">
              Xero
            </Link>
            <Link href="/quickbooks" className="text-muted-foreground hover:text-foreground">
              QuickBooks
            </Link>
            {COMPETITORS.map((c) => (
              <Link
                key={c.slug}
                href={`/alternatives/${c.slug}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {c.name} alternative
              </Link>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Parseledger. Parseledger converts and verifies bank
            statement data; it does not provide accounting, tax or financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
