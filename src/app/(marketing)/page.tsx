import Link from 'next/link';
import type { Metadata } from 'next';
import { DemoWidget } from '@/components/marketing/demo-widget';
import { ExtractArtifact, VerifyArtifact, ReviewArtifact, ExportArtifact } from '@/components/marketing/mocks';
import { ProductTour, type TourStep } from '@/components/marketing/product-tour';
import { VerifiedBadge } from '@/components/app/verified-badge';
import { BANKS, FORMATS, convertSlug, getFormat } from '@/lib/seo-banks';
import SplitTextHero from '@/components/motion/SplitTextHero';
import ScrambleIn from '@/components/motion/ScrambleIn';
import Reveal from '@/components/motion/Reveal';
import { RuledLine } from '@/components/motion/ruled-line';

const TOUR_STEPS: TourStep[] = [
  {
    kicker: '01',
    title: 'Extract',
    body: 'Drop a PDF export from a banking app, a posted original scanned at the office, or a phone photo taken at a client’s kitchen table. Native PDFs take a fast text path; images go through a vision model. Multi-page statements come through as one continuous record, in statement order.',
    note: 'Amounts are captured exactly as printed — signs, separators, CR/DR markers — then normalised into integer pence.',
  },
  {
    kicker: '02',
    title: 'Verify',
    body: 'Both checks execute the moment extraction finishes. If the statement’s own identity holds, it arrives already wearing the badge. If it doesn’t, the reconciliation bar shows exactly how far off it is — computed closing against printed closing — and which rows are responsible.',
    note: 'A statement with no printed running balances still gets the totals check; one bad digit can’t hide either way.',
  },
  {
    kicker: '03',
    title: 'Review',
    body: 'Flagged rows are highlighted in the review table with the printed balance beside the computed one. Click the cell, type what the paper actually says, and reconciliation re-runs on every keystroke. When the last issue clears, the badge flips to green in front of you.',
    note: 'Review is a deliberate step, not a formality — this is financial data, and the product never pretends otherwise.',
  },
  {
    kicker: '04',
    title: 'Export',
    body: 'A verified statement exports to CSV, Excel, QuickBooks (.qbo) and Xero-formatted CSV — files that import cleanly, with dates and signs the way each tool expects them. An unverified statement can still be exported, but only through an explicit choice.',
    note: 'Descriptions are sanitised against spreadsheet formula injection — a small thing, until the day it isn’t.',
  },
];

export const metadata: Metadata = {
  title: 'Parseledger — bank statements to clean data, verified to the cent',
  description:
    'Convert bank statement PDFs and photos into CSV, Excel, QuickBooks and Xero files — and prove opening + credits − debits = closing before you trust a single row. Built for UK and Irish bookkeepers.',
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'How accurate is the extraction?',
    a: 'Accurate enough to be checked, which is the point. Every statement is put through two independent tests — the totals equation and a line-by-line running-balance check — before anything is exported. When extraction misreads a digit, the arithmetic breaks and the exact row is flagged. You are never asked to trust an unverified number.',
  },
  {
    q: 'Does it work on scanned statements and phone photos?',
    a: 'Yes. Native PDFs take a fast text path; scans and photos go through a vision model. Either way the output faces the same verification: a blurry photo that produces a wrong digit will fail reconciliation and be flagged, not silently exported.',
  },
  {
    q: 'What happens when a statement doesn’t reconcile?',
    a: 'The statement stays in review. The reconciliation bar shows the computed closing balance against the printed one, and each broken row carries a flag. You correct the cell — the equation re-runs live as you type — and the badge flips to Verified only when every check passes. Exporting an unverified statement is possible, but it requires an explicit choice.',
  },
  {
    q: 'Which banks are supported?',
    a: 'Fifteen UK and Irish banks at launch, including Monzo, Starling, Revolut, Barclays, Lloyds, HSBC, NatWest, AIB and Bank of Ireland — the statement layouts UK and Irish bookkeepers actually receive. Other banks usually work too; the verification engine tells you immediately whether the extraction held up.',
  },
  {
    q: 'How do I get the data into Xero or QuickBooks?',
    a: 'Export a Xero-formatted CSV and import it under Bank accounts → Import a statement, or download a .qbo file and use QuickBooks’ Upload from file. Plain CSV and Excel exports are there for everything else. Import steps for each are on the Xero and QuickBooks pages.',
  },
  {
    q: 'What happens to my files?',
    a: 'Uploads are processed in the EU, kept only while the job needs them, and purged automatically after 24 hours. We never train models on your data. The exported files are yours; the security page describes the full arrangement in plain language.',
  },
  {
    q: 'What does it cost?',
    a: 'The free tier converts 10 pages a month with no card. Solo is $24 a month for 150 pages, Pro is $59 for 750, Practice is $149 for 3,000 with client folders and API access. Overflow pages cost $9 per 100 and never expire, on any tier.',
  },
  {
    q: 'Is this accounting advice?',
    a: 'No. Parseledger converts and verifies bank statement data. It does not categorise transactions for tax purposes or provide accounting, tax or financial advice — that judgement stays with you.',
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">{children}</p>
  );
}

function Rule() {
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <RuledLine />
    </div>
  );
}

export default function LandingPage() {
  const xero = getFormat('xero');
  const ukBanks = BANKS.filter((b) => b.country === 'UK');
  const ieBanks = BANKS.filter((b) => b.country === 'IE');
  return (
    <>
      {/* ————— Hero ————— */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <Eyebrow>Statement conversion for UK &amp; Irish bookkeepers</Eyebrow>
          <div className="mt-4">
            <SplitTextHero
              text="Bank statements to clean data. Verified to the cent."
              mode="words"
              className="font-serif text-heading font-normal text-ink sm:text-heading-lg lg:text-display"
            />
          </div>
          <Reveal delay={0.35} y={16}>
            <p className="mt-6 max-w-2xl text-body-lg text-slate">
              Parseledger turns PDFs and photos of bank statements into accounting-ready CSV,
              Excel, QuickBooks and Xero files — then proves every figure with the same identity
              an auditor would use: <span className="tnum text-ink-soft">opening + credits − debits = closing</span>.
              Nothing is exported on trust.
            </p>
          </Reveal>
          <Reveal delay={0.5} y={16}>
            <form action="/app" className="mt-8 flex max-w-xl flex-wrap items-center gap-3">
              <input
                type="email"
                name="email"
                placeholder="Enter your work email"
                aria-label="Work email"
                className="min-w-0 flex-1 rounded-inputs bg-ledger px-4 py-2.5 text-body-sm text-ink placeholder:text-ash focus:bg-paper focus:outline-none focus:ring-1 focus:ring-iron"
              />
              <button
                type="submit"
                className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
              >
                Start free
              </button>
              <Link
                href="/pricing"
                className="rounded-buttons border border-hairline px-5 py-2.5 text-body-sm font-medium text-ink hover:bg-ledger"
              >
                View pricing
              </Link>
            </form>
            <p className="mt-3 text-body-sm text-slate">Free tier, no card. 10 pages a month.</p>
          </Reveal>
        </div>
        <div className="mt-14 max-w-3xl">
          <DemoWidget />
          <p className="mt-3 text-caption text-ash">
            Live demo — this is the real verification engine. Click the flagged amount and fix it.
          </p>
        </div>
      </section>

      {/* ————— Proof band (inverted ink stack) ————— */}
      <section aria-label="How Parseledger is built" className="bg-ink">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <Reveal>
            <h2 className="max-w-2xl font-serif text-heading font-normal text-paper">
              Built like the ledger it feeds.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-x-0 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['2', 'independent checks on every statement, before anything earns the badge'],
              ['0', 'floating-point operations on money — every figure is integer minor units'],
              ['24h', 'maximum file retention. Statements are purged once you have your export'],
              ['15', 'UK & Irish banks covered at launch, from Monzo to Bank of Ireland'],
            ].map(([n, label], i) => (
              <div
                key={n}
                className={`lg:px-8 ${i > 0 ? 'lg:border-l lg:border-paper/15' : 'lg:pl-0'}`}
              >
                <ScrambleIn
                  text={String(n)}
                  delay={i * 140}
                  className="tnum block text-[52px] font-medium leading-none text-paper"
                />
                <p className="mt-4 max-w-[26ch] text-body-sm leading-relaxed text-paper/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— The argument ————— */}
      <Rule />
      <section id="verification">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>Why verification</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                Parsing was never the hard part
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-6 space-y-5 text-body text-ink-soft">
                <p>
                  Any converter can read a statement. Most of the time, most of them read it
                  correctly. The problem is the other times: a 6 read as an 8, a debit filed as a
                  credit, a row silently dropped from a fold-creased scan. The output is a
                  spreadsheet that looks perfectly plausible — and reconciles wrong three weeks
                  later, when finding the error costs an afternoon.
                </p>
                <p>
                  Bank statements carry their own proof. The opening balance, every transaction
                  and the closing balance form an identity that either holds or doesn&apos;t.
                  Parseledger computes it on every statement, in integer arithmetic, to the penny
                  — the same arithmetic your ledger will face.
                </p>
                <p>
                  That changes what an error looks like. Instead of a wrong number hiding in a
                  clean-looking export, it&apos;s a red flag on the exact row that broke the
                  equation, waiting for a ten-second fix — before the data ever leaves the page.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal delay={0.1}>
              <div className="h-full rounded-cards border border-hairline p-8">
                <h3 className="text-body-lg font-medium text-ink">1. The totals equation</h3>
                <p className="tnum mt-4 rounded-tags bg-ledger px-3 py-2 text-figure text-ink">
                  opening + Σ credits − Σ debits = closing
                </p>
                <p className="mt-4 text-body-sm text-ink-soft">
                  The extracted figures must reproduce the statement&apos;s own closing balance
                  exactly. No rounding, no tolerance, no &ldquo;close enough&rdquo; — a
                  one-penny discrepancy fails the statement.
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
                  A mismatch flags the precise row — one error produces one flag, not a cascade
                  of noise down the page.
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-cards border border-hairline bg-ledger px-6 py-5">
              <span className="text-body-sm text-ink-soft">One badge, three truths:</span>
              <VerifiedBadge state="reconciled" label="Verified to the cent" />
              <VerifiedBadge state="caution" label="2 rows to review" />
              <VerifiedBadge state="flag" label="Doesn’t balance" />
              <span className="text-body-sm text-slate">
                Green is earned, never decorative. A statement is Verified only with zero issues.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————— Workflow narrative ————— */}
      <section id="workflow" className="bg-ledger">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>The workflow</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                From statement to ledger, without the re-keying
              </h2>
              <p className="mt-5 text-body text-slate">
                A quarter of statements used to be an evening of manual entry and a second
                evening of finding the typo. Here it is four steps, and the second evening
                doesn&apos;t exist.
              </p>
            </Reveal>
          </div>

          <div className="mt-16">
            <ProductTour steps={TOUR_STEPS}>
              <ExtractArtifact />
              <VerifyArtifact />
              <ReviewArtifact />
              <ExportArtifact />
            </ProductTour>
          </div>
        </div>
      </section>

      {/* ————— Personas ————— */}
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>Who it&apos;s for</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                Built around a bookkeeper&apos;s month
              </h2>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal delay={0.05}>
              <div className="h-full rounded-cards border border-hairline p-8">
                <h3 className="text-body-lg font-medium text-ink">The solo bookkeeper</h3>
                <p className="mt-3 text-body-sm text-ink-soft">
                  A dozen clients, statements arriving as app exports, paper and the occasional
                  photograph. The job is to get them into Xero accurately — and to be able to
                  say so.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Convert a statement and be reviewing it in under a minute',
                    'Verification badge to lean on when a client questions a figure',
                    'Solo plan covers 150 pages a month at a flat $24',
                    'Overflow at $9 per 100 pages that never expires — quiet months cost nothing extra',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-body-sm text-ink-soft">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-slate">
                        <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="h-full rounded-cards border border-hairline p-8">
                <h3 className="text-body-lg font-medium text-ink">The growing practice</h3>
                <p className="mt-3 text-body-sm text-ink-soft">
                  Hundreds of statements a month across staff and clients. The risk isn&apos;t
                  one wrong number — it&apos;s not knowing which of ten thousand numbers is
                  wrong.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Client folders keep every engagement’s statements and exports separate',
                    'Batch upload a quarter of statements and review them in one sitting',
                    'Every manual correction is recorded — an audit trail you can stand behind',
                    'Practice plan: 3,000 pages, unlimited users and API access at $149',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-body-sm text-ink-soft">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-slate">
                        <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ————— Banks ————— */}
      <Rule />
      <section id="banks">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>Coverage</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                The statements UK and Irish bookkeepers actually receive
              </h2>
              <p className="mt-5 text-body text-slate">
                US-centric converters treat a Monzo export and an AIB paper statement as
                afterthoughts. They are our beachhead: app-generated PDFs, quarterly posted
                originals, and the phone photos clients send at month-end — each bank&apos;s
                real layouts, not a generic parser squinting at them.
              </p>
            </Reveal>
          </div>
          {[
            ['United Kingdom', ukBanks],
            ['Ireland', ieBanks],
          ].map(([label, banks], gi) => (
            <Reveal key={String(label)} delay={0.1 + gi * 0.05}>
              <div className="mt-10">
                <h3 className="text-caption font-semibold uppercase tracking-wide text-slate">
                  {String(label)}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {(banks as typeof BANKS).map((bank) => (
                    <Link
                      key={bank.slug}
                      href={xero ? `/convert/${convertSlug(bank, xero)}` : '/app'}
                      className="rounded-cards border border-hairline px-4 py-3 text-body-sm font-medium text-ink transition-colors hover:bg-ledger"
                    >
                      {bank.name}
                      <span className="mt-0.5 block text-caption font-normal text-slate">
                        Statement to Xero →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.1}>
            <p className="mt-8 text-body-sm text-slate">
              Using another bank? Upload the statement anyway — verification tells you within a
              minute whether the extraction held up.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ————— Formats ————— */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>Exports</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                Files that import first time
              </h2>
              <p className="mt-5 text-body text-slate">
                Each exporter writes what the destination actually expects — Xero&apos;s
                dd/mm/yyyy dates and signed amounts, QuickBooks&apos; OFX structure with stable
                transaction IDs, Excel with real numeric cells rather than text pretending to be
                numbers.
              </p>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((format, i) => (
              <Reveal key={format.slug} delay={0.07 * i}>
                <div className="h-full rounded-cards border border-hairline p-6">
                  <h3 className="text-body-lg font-medium text-ink">{format.name}</h3>
                  <p className="mt-2 text-body-sm text-slate">{format.blurb}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-body-sm">
              <Link href="/xero" className="text-ink underline underline-offset-2 hover:text-ink-soft">
                How to import into Xero →
              </Link>
              <Link href="/quickbooks" className="text-ink underline underline-offset-2 hover:text-ink-soft">
                How to import into QuickBooks →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————— Privacy band ————— */}
      <section className="bg-ledger">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>Privacy</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                Your clients&apos; statements are not our asset
              </h2>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['EU data residency', 'Files are stored and processed in the EU, on infrastructure chosen for it — not routed wherever compute is cheapest.'],
              ['24-hour purge', 'Uploads exist to be converted, not collected. Once the job is done, the source files are deleted automatically.'],
              ['No training on your data', 'Statements are never used to train models. Your clients’ transactions stay your clients’ transactions.'],
              ['Encrypted throughout', 'TLS in transit, encryption at rest, and a database that no public key can reach.'],
            ].map(([title, body], i) => (
              <Reveal key={String(title)} delay={0.06 * i}>
                <div>
                  <h3 className="text-body font-medium text-ink">{title}</h3>
                  <p className="mt-2 text-body-sm text-slate">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-10 text-body-sm text-slate">
              The full arrangement, in plain language, on the{' '}
              <Link href="/security" className="text-ink underline underline-offset-2 hover:text-ink-soft">
                security page
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* ————— Pricing teaser ————— */}
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                Flat plans, one engine
              </h2>
              <p className="mt-5 text-body text-slate">
                Every tier runs the same verification. The difference is volume, seats and
                workflow — never accuracy.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <tbody>
                  {[
                    ['Free', '$0', '10 pages a month, no card — the full engine, small doses'],
                    ['Solo', '$24/mo', '150 pages, every export format, one user'],
                    ['Pro', '$59/mo', '750 pages, batch upload, three users — most practices land here'],
                    ['Practice', '$149/mo', '3,000 pages, unlimited users, client folders, API, audit trail'],
                  ].map(([name, price, blurb]) => (
                    <tr key={String(name)} className="border-b border-hairline last:border-0">
                      <td className="py-4 pr-6 text-body font-medium text-ink">{name}</td>
                      <td className="tnum py-4 pr-6 text-figure text-ink">{price}</td>
                      <td className="py-4 text-body-sm text-slate">{blurb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-body-sm text-slate">
              Pay as you go on any tier: <span className="tnum text-ink-soft">$9 per 100 pages</span>,
              never expires. Annual billing takes Solo to $19 and Pro to $49.
            </p>
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
                Start free
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ————— FAQ ————— */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <div>
                <Eyebrow>Questions</Eyebrow>
                <h2 className="mt-4 font-serif text-heading font-normal text-ink">
                  Asked before trusting us with the books
                </h2>
                <p className="mt-5 text-body-sm text-slate">
                  Fair questions. Financial data deserves direct answers.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                {FAQ.map((item) => (
                  <details key={item.q} className="group border-b border-hairline py-5">
                    <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 text-body font-medium text-ink [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span aria-hidden className="tnum text-slate transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-body-sm leading-relaxed text-ink-soft">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ————— Final CTA ————— */}
      <Rule />
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-28">
          <div className="max-w-2xl">
            <Reveal>
              <h2 className="font-serif text-heading font-normal text-ink sm:text-heading-lg">
                The first statement takes a minute. The badge takes zero errors.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/app"
                  className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
                >
                  Convert a statement
                </Link>
                <p className="text-body-sm text-slate">10 free pages a month. No card.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
    </>
  );
}
