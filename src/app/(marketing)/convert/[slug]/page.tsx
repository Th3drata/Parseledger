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

      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="tnum text-caption text-ash">
          /convert/{bank.slug} → {format.slug}
        </p>
        <h1 className="mt-4 font-serif text-heading-lg font-normal text-ink">
          Convert {bank.name} statements to {format.name}
        </h1>
        <p className="mt-5 text-body text-slate">{bank.blurb}</p>
        <p className="mt-3 text-body text-slate">
          Parseledger turns those statements into {format.name}-ready data and proves the result
          reconciles — <span className="tnum">opening + credits − debits = closing</span>, checked
          to the cent — before you import a single row.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper hover:bg-ink-soft"
          >
            Convert a statement
          </Link>
        </div>
        <div className="mt-12">
          <DemoWidget />
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-serif text-heading font-normal text-ink">How it works</h2>
          <ol className="mt-8 space-y-6">
            <li className="flex gap-4">
              <span className="tnum mt-0.5 text-figure text-ash">1</span>
              <div>
                <h3 className="text-body-lg font-medium text-ink">Upload</h3>
                <p className="mt-1 text-body-sm text-ink-soft">
                  Drop in your {bank.name} PDF, scan or photo. Multi-page and batch uploads are
                  handled the same way.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="tnum mt-0.5 text-figure text-ash">2</span>
              <div>
                <h3 className="text-body-lg font-medium text-ink">Verified review</h3>
                <p className="mt-1 text-body-sm text-ink-soft">
                  Every figure is reconciled against the statement&apos;s own balances. Rows that
                  do not add up are flagged; you correct them in place and watch the check pass.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="tnum mt-0.5 text-figure text-ash">3</span>
              <div>
                <h3 className="text-body-lg font-medium text-ink">Export to {format.name}</h3>
                <p className="mt-1 text-body-sm text-ink-soft">{format.blurb}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-serif text-heading font-normal text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-8 space-y-8">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="text-body-lg font-medium text-ink">{f.q}</dt>
                <dd className="mt-2 text-body text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-caption font-semibold uppercase text-slate">
            Also for {bank.name}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {siblingFormats.map((f) => (
              <li key={f.slug}>
                <Link
                  href={`/convert/${convertSlug(bank, f)}`}
                  className="text-body-sm text-slate underline underline-offset-2 hover:text-ink"
                >
                  {bank.name} statements to {f.name}
                </Link>
              </li>
            ))}
            {hub && (
              <li>
                <Link
                  href={hub}
                  className="text-body-sm text-slate underline underline-offset-2 hover:text-ink"
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
