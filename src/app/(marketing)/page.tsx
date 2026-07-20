import Link from 'next/link';
import type { Metadata } from 'next';
import { DemoWidget } from '@/components/marketing/demo-widget';
import { BANKS, FORMATS, convertSlug, getFormat } from '@/lib/seo-banks';
import SplitTextHero from '@/components/motion/SplitTextHero';
import Reveal from '@/components/motion/Reveal';
import { RuledLine } from '@/components/motion/ruled-line';

export const metadata: Metadata = {
  title: 'Parseledger — bank statements to clean data, verified to the cent',
  description:
    'Convert bank statement PDFs and photos into CSV, Excel, QuickBooks and Xero files — and prove opening + credits − debits = closing before you trust a single row. Built for UK and Irish bookkeepers.',
};

function Rule() {
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <RuledLine />
    </div>
  );
}

export default function LandingPage() {
  const xero = getFormat('xero');
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-20 sm:pt-28">
        <div className="max-w-3xl">
          <SplitTextHero
            text="Bank statements to clean data. Verified to the cent."
            mode="words"
            className="font-serif text-heading font-normal text-ink sm:text-heading-lg lg:text-display"
          />
          <Reveal delay={0.35} y={16}>
            <p className="mt-6 max-w-2xl text-body-lg text-slate">
              Convert PDFs and photos of bank statements into CSV, Excel, QuickBooks and Xero files
              — and prove <span className="tnum">opening + credits − debits = closing</span> before
              you trust a single row.
            </p>
          </Reveal>
          <Reveal delay={0.5} y={16}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/app"
                className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
              >
                Convert a statement
              </Link>
              <Link
                href="/pricing"
                className="rounded-buttons border border-hairline px-5 py-2.5 text-body-sm font-medium text-ink hover:bg-ledger"
              >
                View pricing
              </Link>
              <p className="text-body-sm text-slate">Free tier, no card. 10 pages a month.</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 max-w-3xl">
          <DemoWidget />
        </div>
      </section>

      {/* How verification works */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">
              How verification works
            </h2>
            <p className="mt-4 max-w-2xl text-body text-slate">
              Extraction alone is not enough. A misread digit produces a spreadsheet that looks
              right and reconciles wrong. Every statement Parseledger processes must pass two
              checks before it earns the badge.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Reveal delay={0.1}>
              <div className="h-full rounded-cards border border-hairline p-8">
                <h3 className="text-body-lg font-medium text-ink">1. The totals equation</h3>
                <p className="tnum mt-4 rounded-tags bg-ledger px-3 py-2 text-figure text-ink">
                  opening + Σ credits − Σ debits = closing
                </p>
                <p className="mt-4 text-body-sm text-ink-soft">
                  The extracted figures must reproduce the statement&apos;s own closing balance
                  exactly — to the penny, in integer arithmetic. No rounding, no tolerance.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="h-full rounded-cards border border-hairline p-8">
                <h3 className="text-body-lg font-medium text-ink">2. Line-by-line running balance</h3>
                <p className="tnum mt-4 rounded-tags bg-ledger px-3 py-2 text-figure text-ink">
                  balance[n−1] + amount[n] = balance[n]
                </p>
                <p className="mt-4 text-body-sm text-ink-soft">
                  Where the statement prints a running balance, every row is checked against it.
                  A mismatch flags the exact row, so you fix one number — not hunt through a
                  spreadsheet.
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-2xl text-body-sm text-slate">
              A statement is Verified only with zero issues. Anything less stays flagged for
              review, and exporting an unverified statement requires an explicit choice.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Banks */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">Banks we cover</h2>
            <p className="mt-4 max-w-2xl text-body text-slate">
              Trained on the statement layouts UK and Irish bookkeepers actually receive — app
              exports, posted originals and phone photos alike.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BANKS.map((bank) => (
                <Link
                  key={bank.slug}
                  href={xero ? `/convert/${convertSlug(bank, xero)}` : '/app'}
                  className="rounded-cards border border-hairline px-4 py-3 text-body-sm font-medium text-ink transition-colors hover:bg-ledger"
                >
                  {bank.name}
                  <span className="mt-0.5 block text-caption font-normal text-slate">
                    {bank.country === 'UK' ? 'United Kingdom' : 'Ireland'}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Formats */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">Export formats</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((format, i) => (
              <Reveal key={format.slug} delay={0.08 * i}>
                <div className="h-full rounded-cards border border-hairline p-6">
                  <h3 className="text-body-lg font-medium text-ink">{format.name}</h3>
                  <p className="mt-2 text-body-sm text-slate">{format.blurb}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Built for bookkeepers */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">
              Built for bookkeepers
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            <Reveal delay={0.05}>
              <div>
                <h3 className="text-body-lg font-medium text-ink">Multi-client by design</h3>
                <p className="mt-2 text-body-sm text-ink-soft">
                  Client folders keep each engagement&apos;s statements, edits and exports
                  separate. Batch upload a quarter of statements and review them in one sitting.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div>
                <h3 className="text-body-lg font-medium text-ink">Flat pricing, no per-page anxiety</h3>
                <p className="mt-2 text-body-sm text-ink-soft">
                  Predictable monthly plans sized for a solo bookkeeper up to a small practice.
                  Overflow pages cost $9 per 100 and never expire.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.25}>
              <div>
                <h3 className="text-body-lg font-medium text-ink">An audit trail you can stand behind</h3>
                <p className="mt-2 text-body-sm text-ink-soft">
                  Every manual correction is recorded. When a client asks why a figure changed,
                  the answer is on file.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Privacy strip */}
      <Rule />
      <section>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-3 px-6 py-10 text-body-sm text-slate">
          <span>EU data residency</span>
          <span aria-hidden className="hidden text-hairline sm:inline">·</span>
          <span>Files auto-purged after processing</span>
          <span aria-hidden className="hidden text-hairline sm:inline">·</span>
          <span>No training on your data</span>
          <span aria-hidden className="hidden text-hairline sm:inline">·</span>
          <Link href="/security" className="text-ink underline underline-offset-2 hover:text-ink-soft">
            Read the security page
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">Pricing</h2>
            <p className="mt-4 max-w-2xl text-body text-slate">
              Free for 10 pages a month, no card required. Paid plans from $24 a month; most
              practices choose Pro at $59. Pay-as-you-go pages at $9 per 100, on any tier.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="rounded-buttons border border-hairline px-5 py-2.5 text-body-sm font-medium text-ink hover:bg-ledger"
              >
                See full pricing
              </Link>
              <Link
                href="/app"
                className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
              >
                Convert a statement
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
