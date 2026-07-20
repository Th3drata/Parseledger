import Link from 'next/link';
import type { Metadata } from 'next';

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
      pages: '300 pages / month',
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
      pages: '1,000 pages / month',
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
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Pricing</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Flat monthly plans. Every tier runs the same verification engine — the difference is
        volume, seats and workflow, never accuracy.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-lg border bg-card p-6 ${
              tier.highlighted ? 'border-accent shadow-sm' : 'border-border'
            }`}
          >
            {tier.highlighted && (
              <span className="mb-3 inline-block self-start rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                Most practices choose Pro
              </span>
            )}
            <h2 className="text-lg font-semibold text-ink">{tier.name}</h2>
            <p className="tnum mt-1 text-2xl font-semibold text-ink">{tier.monthly}</p>
            {tier.annualNote && (
              <p className="mt-0.5 text-xs text-muted-foreground">{tier.annualNote}</p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">{tier.tagline}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {FEATURE_ROWS.map((row) => (
                <li key={row.key} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-right text-ink">{tier.features[row.key]}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className={`mt-6 rounded-md px-4 py-2 text-center text-sm font-medium ${
                tier.highlighted
                  ? 'bg-ink text-background hover:opacity-90'
                  : 'border border-border text-ink hover:border-muted-foreground'
              }`}
            >
              Convert a statement
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-muted/40 p-5 text-sm">
        <p className="text-ink">
          <span className="font-medium">Pay as you go:</span> $9 per 100 pages, on any tier,
          including Free. Purchased pages never expire.
        </p>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        All prices in USD, exclusive of VAT where applicable. Cancel any time; your exported
        files remain yours.
      </p>
    </section>
  );
}
