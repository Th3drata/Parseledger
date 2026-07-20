import Link from 'next/link';
import { DemoWidget } from '@/components/marketing/demo-widget';
import { BANKS, convertSlug, type ExportFormat } from '@/lib/seo-banks';

/**
 * Shared server-rendered template for the /xero and /quickbooks hub pages:
 * software-specific import instructions plus links to all 15 bank pages.
 */
export function FormatHub({
  format,
  importSteps,
}: {
  format: ExportFormat;
  importSteps: string[];
}) {
  const ukBanks = BANKS.filter((b) => b.country === 'UK');
  const ieBanks = BANKS.filter((b) => b.country === 'IE');

  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-serif text-heading-lg font-normal text-ink">
          Bank statements to {format.name}, verified to the cent
        </h1>
        <p className="mt-5 text-body text-slate">{format.blurb}</p>
        <p className="mt-3 text-body text-slate">
          Before any file leaves Parseledger, the extracted figures must reconcile against the
          statement&apos;s own balances — <span className="tnum">opening + credits − debits =
          closing</span>, checked line by line. What you import into {format.name} is provably
          consistent with the paper.
        </p>
        <div className="mt-8">
          <Link
            href="/app"
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
          <h2 className="font-serif text-heading font-normal text-ink">
            Importing the file into {format.name}
          </h2>
          <ol className="mt-8 space-y-5">
            {importSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="tnum mt-0.5 text-figure text-ash">{i + 1}</span>
                <span className="text-body-sm text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-serif text-heading font-normal text-ink">
            Convert your bank&apos;s statements to {format.name}
          </h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="text-caption font-semibold uppercase text-slate">
                United Kingdom
              </h3>
              <ul className="mt-4 space-y-2">
                {ukBanks.map((bank) => (
                  <li key={bank.slug}>
                    <Link
                      href={`/convert/${convertSlug(bank, format)}`}
                      className="text-body-sm text-slate underline underline-offset-2 hover:text-ink"
                    >
                      {bank.name} statements to {format.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-caption font-semibold uppercase text-slate">
                Ireland
              </h3>
              <ul className="mt-4 space-y-2">
                {ieBanks.map((bank) => (
                  <li key={bank.slug}>
                    <Link
                      href={`/convert/${convertSlug(bank, format)}`}
                      className="text-body-sm text-slate underline underline-offset-2 hover:text-ink"
                    >
                      {bank.name} statements to {format.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
