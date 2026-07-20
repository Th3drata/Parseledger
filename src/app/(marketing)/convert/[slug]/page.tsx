import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DemoWidget } from '@/components/marketing/demo-widget';
import {
  BANKS,
  FORMATS,
  SITE_URL,
  convertSlug,
  parseConvertSlug,
  type Bank,
  type ExportFormat,
} from '@/lib/seo-banks';

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return BANKS.flatMap((bank) =>
    FORMATS.map((format) => ({ slug: convertSlug(bank, format) })),
  );
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseConvertSlug(slug);
  if (!parsed) return {};
  const { bank, format } = parsed;
  const region = bank.country === 'UK' ? 'UK' : 'Irish';
  return {
    title: `Convert ${bank.name} statements to ${format.name}`,
    description: `Turn ${bank.name} bank statement PDFs and scans into ${format.name}-ready files, with every figure proven to reconcile to the cent. Built for ${region} bookkeepers.`,
    alternates: { canonical: `${SITE_URL}/convert/${slug}` },
  };
}

interface Faq {
  q: string;
  a: string;
}

function buildFaq(bank: Bank, format: ExportFormat): Faq[] {
  const currency = bank.country === 'IE' ? 'euro' : 'sterling';
  return [
    {
      q: `Does it work with scanned or photographed ${bank.name} statements?`,
      a: `Yes. Parseledger reads text PDFs, scans and phone photos of ${bank.name} statements. Whatever the source, the same rule applies: the extracted figures must satisfy opening + credits − debits = closing and pass line-by-line running-balance checks before the statement is marked Verified. A blurry scan cannot silently corrupt your numbers — a misread digit is flagged, not exported.`,
    },
    {
      q: `Can it handle multi-page ${bank.name} statements?`,
      a: `Yes. Statements spanning many pages are processed as one document, and the reconciliation runs across the full period, so a transaction dropped at a page break shows up immediately as a totals mismatch.`,
    },
    {
      q: 'How accurate is the conversion?',
      a: `Accuracy is proven rather than promised. Every ${bank.name} statement is checked against its own printed balances: the totals equation must hold exactly in integer ${currency} minor units, and each row with a printed running balance is verified line by line. Only a statement with zero issues earns the Verified badge; anything else is flagged for a one-click review before export.`,
    },
    {
      q: `What exactly do I get in the ${format.name} export?`,
      a: format.blurb,
    },
  ];
}

export default async function ConvertPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseConvertSlug(slug);
  if (!parsed) notFound();
  const { bank, format } = parsed;

  const faq = buildFaq(bank, format);
  const siblingFormats = FORMATS.filter((f) => f.slug !== format.slug);
  const region = bank.country === 'UK' ? 'United Kingdom' : 'Ireland';
  const hub = format.slug === 'xero' || format.slug === 'quickbooks' ? `/${format.slug}` : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-muted-foreground">
          {region} · {bank.name} · {format.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Convert {bank.name} statements to {format.name}
        </h1>
        <p className="mt-4 text-muted-foreground">{bank.blurb}</p>
        <p className="mt-3 text-muted-foreground">
          Parseledger turns those statements into {format.name}-ready data and proves the result
          reconciles — <span className="tnum">opening + credits − debits = closing</span>, checked
          to the cent — before you import a single row.
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
          <h2 className="text-xl font-semibold tracking-tight text-ink">How it works</h2>
          <ol className="mt-6 space-y-4">
            <li className="flex gap-4">
              <span className="tnum mt-0.5 text-sm text-muted-foreground">1</span>
              <div>
                <h3 className="font-medium text-ink">Upload</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drop in your {bank.name} PDF, scan or photo. Multi-page and batch uploads are
                  handled the same way.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="tnum mt-0.5 text-sm text-muted-foreground">2</span>
              <div>
                <h3 className="font-medium text-ink">Verified review</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every figure is reconciled against the statement&apos;s own balances. Rows that
                  do not add up are flagged; you correct them in place and watch the check pass.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="tnum mt-0.5 text-sm text-muted-foreground">3</span>
              <div>
                <h3 className="font-medium text-ink">Export to {format.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{format.blurb}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Try the verification check
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is the live engine, running in your browser on a sample statement.
        </p>
        <div className="mt-5">
          <DemoWidget />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-6">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="font-medium text-ink">{f.q}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Also for {bank.name}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {siblingFormats.map((f) => (
              <li key={f.slug}>
                <Link
                  href={`/convert/${convertSlug(bank, f)}`}
                  className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {bank.name} statements to {f.name}
                </Link>
              </li>
            ))}
            {hub && (
              <li>
                <Link
                  href={hub}
                  className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  All banks to {format.name}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
