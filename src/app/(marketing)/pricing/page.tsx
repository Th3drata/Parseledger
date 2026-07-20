import Link from 'next/link';
import type { Metadata } from 'next';
import Reveal from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Parseledger pricing: free for 10 pages a month, Solo at $24, Pro at $59, Practice at $149. Pay-as-you-go pages at $9 per 100, never expiring, on any tier.',
};

interface Tier {
  name: string;
  monthly: string;
  annualNote: string | null;
  tagline: string;
  highlighted: boolean;
  features: {
    pages: string;
    users: string;
    exports: string;
    batch: string;
    folders: string;
    api: string;
    audit: string;
  };
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    monthly: '$0',
    annualNote: 'No card required',
    tagline: 'Try the verification engine on real statements.',
    highlighted: false,
    features: {
      pages: '10 pages / month',
      users: '1 user',
      exports: 'CSV, Excel',
      batch: '—',
      folders: '—',
      api: '—',
      audit: '—',
    },
  },
  {
    name: 'Solo',
    monthly: '$24/mo',
    annualNote: '$19/mo billed annually',
    tagline: 'For a solo bookkeeper with a steady client list.',
    highlighted: false,
    features: {
      pages: '150 pages / month',
      users: '1 user',
      exports: 'CSV, Excel, QuickBooks, Xero',
      batch: 'Batch upload',
      folders: 'Client folders',
      api: '—',
      audit: 'Audit trail',
    },
  },
  {
    name: 'Pro',
    monthly: '$59/mo',
    annualNote: '$49/mo billed annually',
    tagline: 'Most practices choose Pro.',
    highlighted: true,
    features: {
      pages: '750 pages / month',
      users: '3 users',
      exports: 'CSV, Excel, QuickBooks, Xero',
      batch: 'Batch upload',
      folders: 'Client folders',
      api: 'API access',
      audit: 'Audit trail',
    },
  },
  {
    name: 'Practice',
    monthly: '$149/mo',
    annualNote: null,
    tagline: 'For small practices with several bookkeepers.',
    highlighted: false,
    features: {
      pages: '3,000 pages / month',
      users: '10 users',
      exports: 'CSV, Excel, QuickBooks, Xero',
      batch: 'Batch upload',
      folders: 'Client folders',
      api: 'API access',
      audit: 'Audit trail',
    },
  },
];

const FEATURE_ROWS: { label: string; key: keyof Tier['features'] }[] = [
  { label: 'Pages per month', key: 'pages' },
  { label: 'Users', key: 'users' },
  { label: 'Export formats', key: 'exports' },
  { label: 'Batch upload', key: 'batch' },
  { label: 'Client folders', key: 'folders' },
  { label: 'API', key: 'api' },
  { label: 'Audit trail', key: 'audit' },
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <h1 className="font-serif text-heading-lg font-normal text-ink">Pricing</h1>
      <p className="mt-4 max-w-2xl text-body text-slate">
        Flat monthly plans. Every tier runs the same verification engine — the difference is
        volume, seats and workflow, never accuracy.
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={0.08 * i} className="flex">
          <div
            className={`flex w-full flex-col rounded-cards bg-paper p-8 ${
              tier.highlighted ? 'border border-ink' : 'border border-hairline'
            }`}
          >
            {tier.highlighted && (
              <span className="mb-4 inline-block self-start rounded-full bg-ink px-2.5 py-0.5 text-caption font-medium text-paper">
                Most popular
              </span>
            )}
            <h2 className="text-body-sm font-semibold uppercase text-slate">{tier.name}</h2>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="tnum text-figure-lg font-medium text-ink">{tier.monthly}</span>
            </p>
            {tier.annualNote && (
              <p className="mt-1 text-caption text-slate">{tier.annualNote}</p>
            )}
            <p className="mt-4 text-body-sm text-ink-soft">{tier.tagline}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {FEATURE_ROWS.map((row) => (
                <li key={row.key} className="flex items-start gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-slate">
                    <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-body-sm text-ink-soft">{tier.features[row.key]}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className={`mt-8 rounded-buttons px-4 py-2 text-center text-body-sm font-medium ${
                tier.highlighted
                  ? 'bg-ink text-paper hover:bg-ink-soft'
                  : 'border border-hairline text-ink hover:bg-ledger'
              }`}
            >
              Convert a statement
            </Link>
          </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 rounded-cards border border-hairline bg-ledger p-6">
        <p className="text-body-sm text-ink">
          <span className="font-medium">Pay as you go:</span> $9 per 100 pages, on any tier,
          including Free. Purchased pages never expire.
        </p>
      </div>

      <p className="mt-8 text-body-sm text-ash">
        All prices in USD, exclusive of VAT where applicable. Cancel any time; your exported
        files remain yours.
      </p>
    </section>
  );
}
