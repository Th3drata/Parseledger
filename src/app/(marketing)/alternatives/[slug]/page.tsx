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
      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-muted-foreground">Comparison</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          A {competitor.name} alternative that proves its numbers
        </h1>
        <p className="mt-4 text-muted-foreground">{competitor.angle}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {competitor.name} is a capable tool and this comparison is kept factual. The
          difference comes down to what happens after parsing.
        </p>
        <div className="mt-6">
          <Link
            href="/app"
            className="rounded-md bg-ink px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Convert a statement
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Side by side</h2>
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Feature</th>
                  <th className="px-4 py-2.5 font-medium">Parseledger</th>
                  <th className="px-4 py-2.5 font-medium">{competitor.name}</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-medium text-ink">{row.feature}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="mr-1.5 text-accent">✓</span>
                      {row.us}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Competitor characteristics summarised from public product pages; verify current
            details on their site.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          The check that makes the difference
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is the live verification engine. Fix the flagged row and watch it pass.
        </p>
        <div className="mt-5">
          <DemoWidget />
        </div>
        <div className="mt-8">
          <Link
            href="/app"
            className="rounded-md bg-ink px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Convert a statement
          </Link>
        </div>
      </section>
    </>
  );
}
