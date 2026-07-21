import Link from 'next/link';
import type { Metadata } from 'next';
import Reveal from '@/components/motion/Reveal';
import { RuledLine } from '@/components/motion/ruled-line';

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
    tagline:
      'Most practices choose Pro — 750 pages covers a serious client list, with room left for quarter-end.',
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

const PRICING_FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'How does annual billing work?',
    a: 'Pay for the year up front and the monthly rate drops: Solo goes from $24 to $19 a month, Pro from $59 to $49. Same pages, same seats, same engine — billed once a year instead of twelve times. You can cancel any time.',
  },
  {
    q: 'Do pay-as-you-go pages expire?',
    a: 'Never. Pay-as-you-go pages cost $9 per 100 on any tier, including Free, and they sit on your account until you use them. A quiet month costs nothing extra; a heavy quarter-end simply draws the balance down.',
  },
  {
    q: 'Are prices inclusive of VAT?',
    a: 'No. All prices are in USD and exclusive of VAT — where VAT applies, it is added at checkout for customers in jurisdictions that require it.',
  },
];

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iron';

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <Reveal>
        <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
          Plans &amp; metering
        </p>
        <h1 className="mt-4 font-serif text-heading-lg font-normal text-ink">Pricing</h1>
        <p className="mt-4 max-w-2xl text-body text-slate">
          Flat monthly plans. Every tier runs the same verification engine — the difference is
          volume, seats and workflow, never accuracy.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={0.08 * i} className="flex">
          <div
            className={`relative flex w-full flex-col overflow-hidden rounded-cards bg-paper p-8 ${
              tier.highlighted ? 'border border-ink' : 'border border-hairline'
            }`}
          >
            {tier.highlighted && (
              <div aria-hidden className="ruled-paper pointer-events-none absolute inset-0" />
            )}
            <div className="relative flex flex-1 flex-col">
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
                <p className="tnum mt-1 text-caption text-slate">{tier.annualNote}</p>
              )}
              <p
                className={`mt-4 text-body-sm ${
                  tier.highlighted ? 'font-medium text-ink' : 'text-ink-soft'
                }`}
              >
                {tier.tagline}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {FEATURE_ROWS.map((row) => (
                  <li key={row.key} className="flex items-start gap-2.5">
                    {tier.features[row.key] === '—' ? (
                      <span aria-hidden className="mt-0.5 w-4 shrink-0 text-center text-ash">–</span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-slate">
                        <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <span className={`text-body-sm ${tier.features[row.key] === '—' ? 'text-ash' : 'text-ink-soft'}`}>
                      {tier.features[row.key] === '—' ? 'Not included' : tier.features[row.key]}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 rounded-buttons px-4 py-2 text-center text-body-sm font-medium transition-colors ${focusRing} ${
                  tier.highlighted
                    ? 'bg-ink text-paper hover:bg-ink-soft'
                    : 'border border-hairline text-ink hover:border-iron hover:bg-ledger'
                }`}
              >
                Convert a statement
              </Link>
            </div>
          </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-10 rounded-cards border border-hairline bg-ledger p-6">
          <p className="text-body-sm text-ink">
            <span className="font-medium">Pay as you go:</span>{' '}
            <span className="tnum text-ink-soft">$9 per 100 pages</span>, on any tier, including
            Free. Purchased pages never expire.
          </p>
        </div>
      </Reveal>

      {/* ————— Pricing questions ————— */}
      <div className="mt-20">
        <RuledLine />
      </div>
      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_2fr]">
        <Reveal>
          <div>
            <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
              Pricing questions
            </p>
            <h2 className="mt-4 font-serif text-heading-sm font-normal text-ink">
              The details, before you commit
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div>
            {PRICING_FAQ.map((item) => (
              <details key={item.q} className="group border-b border-hairline py-5">
                <summary
                  className={`flex cursor-pointer list-none items-baseline justify-between gap-6 text-body font-medium text-ink ${focusRing} [&::-webkit-details-marker]:hidden`}
                >
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

      <Reveal delay={0.1}>
        <p className="mt-12 text-body-sm text-ash">
          All prices in USD, exclusive of VAT where applicable. Cancel any time; your exported
          files remain yours.
        </p>
      </Reveal>
    </section>
  );
}
