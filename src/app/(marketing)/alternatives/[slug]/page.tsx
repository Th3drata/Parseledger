import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DemoWidget } from '@/components/marketing/demo-widget';
import Reveal from '@/components/motion/Reveal';
import { COMPETITORS, SITE_URL, getCompetitor } from '@/lib/seo-banks';

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) return {};
  return {
    title: `${competitor.name} alternative — Parseledger`,
    description: `Comparing Parseledger with ${competitor.name} for bank statement conversion: row-level reconciliation proof, UK and Irish bank depth, and flat pricing.`,
    alternates: { canonical: `${SITE_URL}/alternatives/${slug}` },
  };
}

interface ComparisonRow {
  feature: string;
  us: string;
  them: string;
  /** True only for rows about verification — the sole rows allowed a green check. */
  verification: boolean;
}

const ROWS: ComparisonRow[] = [
  {
    feature: 'Row-level reconciliation proof',
    us: 'Every statement must satisfy opening + credits − debits = closing, plus line-by-line running-balance checks, before export',
    them: 'Extraction accuracy stated, but no per-statement reconciliation proof surfaced to the user',
    verification: true,
  },
  {
    feature: 'Flagged-row review before export',
    us: 'Rows that fail the check are highlighted; you fix them in place and the check re-runs instantly',
    them: 'Errors are typically found downstream, in the spreadsheet or the ledger',
    verification: true,
  },
  {
    feature: 'UK and Irish bank depth',
    us: '15 UK and IE banks covered specifically, including app-export and scanned-paper layouts',
    them: 'Generic multi-country parsing; UK/IE layout quirks handled generically',
    verification: false,
  },
  {
    feature: 'Accounting exports',
    us: 'Xero and QuickBooks pre-mapped CSVs, plus Excel and plain CSV',
    them: 'CSV or Excel output; accounting-software mapping varies',
    verification: false,
  },
  {
    feature: 'Pricing model',
    us: 'Flat monthly plans from $0; overflow at $9 per 100 pages, credits never expire',
    them: 'Typically credit- or page-based pricing that resets or expires',
    verification: false,
  },
];

export default async function AlternativePage({ params }: PageProps) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

  return (
    <>
      {/* ————— Hero ————— */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
          Comparison
        </p>
        <h1 className="mt-4 font-serif text-heading-lg font-normal text-ink">
          A {competitor.name} alternative that proves its numbers
        </h1>
        <Reveal delay={0.1} y={16}>
          <p className="mt-5 text-body text-slate">{competitor.angle}</p>
          <p className="mt-3 text-body-sm text-slate">
            {competitor.name} is a capable tool and this comparison is kept factual. The
            difference comes down to what happens after parsing.
          </p>
        </Reveal>
        <Reveal delay={0.2} y={16}>
          <div className="mt-8">
            <Link
              href="/signup"
              className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iron"
            >
              Convert a statement
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ————— Comparison table ————— */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">Side by side</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-iron text-left">
                    <th className="py-3 pr-4 text-caption font-semibold uppercase tracking-[0.14em] text-slate">
                      Feature
                    </th>
                    <th className="py-3 pr-4 text-caption font-semibold uppercase tracking-[0.14em] text-slate">
                      Parseledger
                    </th>
                    <th className="py-3 text-caption font-semibold uppercase tracking-[0.14em] text-slate">
                      {competitor.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-hairline align-top transition-colors hover:bg-ledger"
                    >
                      <td className="py-4 pr-4 text-body-sm font-medium text-ink">{row.feature}</td>
                      <td className="py-4 pr-4 text-body-sm text-ink-soft">
                        <span
                          className={`mr-1.5 inline-flex align-middle ${
                            row.verification ? 'text-reconciled' : 'text-slate'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {row.us}
                      </td>
                      <td className="py-4 text-body-sm text-slate">{row.them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-caption text-ash">
              Competitor characteristics summarised from public product pages; verify current
              details on their site.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ————— Live demo ————— */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">
              The check that makes the difference
            </h2>
            <p className="mt-3 text-body text-slate">
              This is the live verification engine. Fix the flagged row and watch it pass.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8">
              <DemoWidget />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10">
              <Link
                href="/signup"
                className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iron"
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
