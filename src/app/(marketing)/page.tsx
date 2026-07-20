import Link from 'next/link';
import type { Metadata } from 'next';
import { DemoWidget } from '@/components/marketing/demo-widget';
import { BANKS, FORMATS, convertSlug, getFormat } from '@/lib/seo-banks';

export const metadata: Metadata = {
  title: 'Parseledger — bank statements to clean data, verified to the cent',
  description:
    'Convert bank statement PDFs and photos into CSV, Excel, QuickBooks and Xero files — and prove opening + credits − debits = closing before you trust a single row. Built for UK and Irish bookkeepers.',
};

export default function LandingPage() {
  const xero = getFormat('xero');
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-16 sm:pt-24">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Bank statements to clean data. Verified to the cent.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Convert PDFs and photos of bank statements into CSV, Excel, QuickBooks and Xero files
          — and prove <span className="tnum">opening + credits − debits = closing</span> before
          you trust a single row.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href="/app"
            className="rounded-md bg-ink px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Convert a statement
          </Link>
          <p className="text-sm text-muted-foreground">Free tier, no card. 10 pages a month.</p>
        </div>

        <div className="mt-12">
          <DemoWidget />
        </div>
      </section>

      {/* How verification works */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            How verification works
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Extraction alone is not enough. A misread digit produces a spreadsheet that looks
            right and reconciles wrong. Every statement Parseledger processes must pass two
            checks before it earns the badge.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-medium text-ink">1. The totals equation</h3>
              <p className="tnum mt-3 rounded bg-muted px-3 py-2 text-sm">
                opening + Σ credits − Σ debits = closing
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                The extracted figures must reproduce the statement&apos;s own closing balance
                exactly — to the penny, in integer arithmetic. No rounding, no tolerance.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-medium text-ink">2. Line-by-line running balance</h3>
              <p className="tnum mt-3 rounded bg-muted px-3 py-2 text-sm">
                balance[n−1] + amount[n] = balance[n]
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Where the statement prints a running balance, every row is checked against it.
                A mismatch flags the exact row, so you fix one number — not hunt through a
                spreadsheet.
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
            A statement is <span className="font-medium text-accent">Verified</span> only with
            zero issues. Anything less stays flagged for review, and exporting an unverified
            statement requires an explicit choice.
          </p>
        </div>
      </section>

      {/* Banks */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Banks we cover</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Trained on the statement layouts UK and Irish bookkeepers actually receive — app
          exports, posted originals and phone photos alike.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BANKS.map((bank) => (
            <Link
              key={bank.slug}
              href={xero ? `/convert/${convertSlug(bank, xero)}` : '/app'}
              className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-ink hover:border-muted-foreground"
            >
              {bank.name}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {bank.country === 'UK' ? 'United Kingdom' : 'Ireland'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Formats */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Export formats</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((format) => (
              <div key={format.slug} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-medium text-ink">{format.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{format.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for bookkeepers */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Built for bookkeepers
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-medium text-ink">Multi-client by design</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Client folders keep each engagement&apos;s statements, edits and exports
                separate. Batch upload a quarter of statements and review them in one sitting.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-ink">Flat pricing, no per-page anxiety</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Predictable monthly plans sized for a solo bookkeeper up to a small practice.
                Overflow pages cost $9 per 100 and never expire.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-ink">An audit trail you can stand behind</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every manual correction is recorded. When a client asks why a figure changed,
                the answer is on file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy strip */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-8 text-sm text-muted-foreground">
          <span>EU data residency</span>
          <span aria-hidden className="hidden text-border sm:inline">·</span>
          <span>Files auto-purged after processing</span>
          <span aria-hidden className="hidden text-border sm:inline">·</span>
          <span>No training on your data</span>
          <span aria-hidden className="hidden text-border sm:inline">·</span>
          <Link href="/security" className="underline underline-offset-2 hover:text-foreground">
            Read the security page
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Pricing</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Free for 10 pages a month, no card required. Paid plans from $24 a month; most
            practices choose Pro at $59. Pay-as-you-go pages at $9 per 100, on any tier.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/pricing"
              className="rounded-md border border-border bg-card px-5 py-2.5 font-medium text-ink hover:border-muted-foreground"
            >
              See full pricing
            </Link>
            <Link
              href="/app"
              className="rounded-md bg-ink px-5 py-2.5 font-medium text-background hover:opacity-90"
            >
              Convert a statement
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
