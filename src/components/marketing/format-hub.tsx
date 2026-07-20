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
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Bank statements to {format.name}, verified to the cent
        </h1>
        <p className="mt-4 text-muted-foreground">{format.blurb}</p>
        <p className="mt-3 text-muted-foreground">
          Before any file leaves Parseledger, the extracted figures must reconcile against the
          statement&apos;s own balances — <span className="tnum">opening + credits − debits =
          closing</span>, checked line by line. What you import into {format.name} is provably
          consistent with the paper.
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
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Importing the file into {format.name}
          </h2>
          <ol className="mt-6 space-y-3">
            {importSteps.map((step, i) => (
              <li key={i} className="flex gap-4 text-sm">
                <span className="tnum mt-0.5 text-muted-foreground">{i + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Convert your bank&apos;s statements to {format.name}
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              United Kingdom
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {ukBanks.map((bank) => (
                <li key={bank.slug}>
                  <Link
                    href={`/convert/${convertSlug(bank, format)}`}
                    className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {bank.name} statements to {format.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ireland
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {ieBanks.map((bank) => (
                <li key={bank.slug}>
                  <Link
                    href={`/convert/${convertSlug(bank, format)}`}
                    className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {bank.name} statements to {format.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Try the verification check
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The live engine, on a sample statement. Fix the flagged row and watch it pass.
          </p>
          <div className="mt-5">
            <DemoWidget />
          </div>
        </div>
      </section>
    </>
  );
}
