import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DemoWidget } from '@/components/marketing/demo-widget';
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
}

const ROWS: ComparisonRow[] = [
  {
    feature: 'Row-level reconciliation proof',
    us: 'Every statement must satisfy opening + credits − debits = closing, plus line-by-line running-balance checks, before export',
    them: 'Extraction accuracy stated, but no per-statement reconciliation proof surfaced to the user',
  },
  {
    feature: 'Flagged-row review before export',
    us: 'Rows that fail the check are highlighted; you fix them in place and the check re-runs instantly',
    them: 'Errors are typically found downstream, in the spreadsheet or the ledger',
  },
  {
    feature: 'UK and Irish bank depth',
    us: '15 UK and IE banks covered specifically, including app-export and scanned-paper layouts',
    them: 'Generic multi-country parsing; UK/IE layout quirks handled generically',
  },
  {
    feature: 'Accounting exports',
    us: 'Xero and QuickBooks pre-mapped CSVs, plus Excel and plain CSV',
    them: 'CSV or Excel output; accounting-software mapping varies',
  },
  {
    feature: 'Pricing model',
    us: 'Flat monthly plans from $0; overflow at $9 per 100 pages, credits never expire',
    them: 'Typically credit- or page-based pricing that resets or expires',
  },
];

export default async function AlternativePage({ params }: PageProps) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) notFound();

  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-caption font-semibold uppercase text-slate">Comparison</p>
        <h1 className="mt-3 font-serif text-heading-lg font-normal text-ink">
          A {competitor.name} alternative that proves its numbers
        </h1>
        <p className="mt-5 text-body text-slate">{competitor.angle}</p>
        <p className="mt-3 text-body-sm text-slate">
          {competitor.name} is a capable tool and this comparison is kept factual. The
          difference comes down to what happens after parsing.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
          >
            Convert a statement
          </Link>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-serif text-heading font-normal text-ink">Side by side</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-iron text-left">
                  <th className="py-3 pr-4 text-caption font-semibold uppercase text-slate">Feature</th>
                  <th className="py-3 pr-4 text-caption font-semibold uppercase text-slate">Parseledger</th>
                  <th className="py-3 text-caption font-semibold uppercase text-slate">{competitor.name}</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-hairline align-top">
                    <td className="py-4 pr-4 text-body-sm font-medium text-ink">{row.feature}</td>
                    <td className="py-4 pr-4 text-body-sm text-ink-soft">
                      <span className="mr-1.5 inline-flex align-middle text-reconciled">
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
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-serif text-heading font-normal text-ink">
            The check that makes the difference
          </h2>
          <p className="mt-3 text-body text-slate">
            This is the live verification engine. Fix the flagged row and watch it pass.
          </p>
          <div className="mt-8">
            <DemoWidget />
          </div>
          <div className="mt-10">
            <Link
              href="/signup"
              className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
            >
              Convert a statement
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
