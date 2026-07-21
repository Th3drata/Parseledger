import Link from 'next/link';
import { DemoWidget } from '@/components/marketing/demo-widget';
import Reveal from '@/components/motion/Reveal';
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
      {/* ————— Hero on ruled paper ————— */}
      <section className="relative">
        <div aria-hidden className="ruled-paper absolute inset-x-0 top-0 h-[520px]" />
        <div className="relative mx-auto max-w-3xl px-6 py-24">
          <h1 className="font-serif text-heading-lg font-normal text-ink">
            Bank statements to {format.name}, verified to the cent
          </h1>
          <Reveal delay={0.1} y={16}>
            <p className="mt-5 text-body text-slate">{format.blurb}</p>
            <p className="mt-3 text-body text-slate">
              Before any file leaves Parseledger, the extracted figures must reconcile against the
              statement&apos;s own balances — the statement&apos;s own balances, checked line by line. What you import into {format.name} is provably
              consistent with the paper.
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
          <Reveal delay={0.25} y={20}>
            <div className="mt-12">
              <DemoWidget />
            </div>
            <p className="mt-3 text-caption text-ash">
              Live demo — this is the real verification engine. Click the flagged amount and fix it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ————— Import steps ————— */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">
              Importing the file into {format.name}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <ol className="mt-10">
              {importSteps.map((step, i) => (
                <li key={i} className="relative flex gap-5 pb-10 last:pb-0">
                  {i < importSteps.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[3.5px] top-[21px] w-px bg-hairline"
                    />
                  )}
                  <span
                    aria-hidden
                    className="mt-[7px] h-2 w-2 shrink-0 rounded-full border border-iron bg-paper"
                  />
                  <div>
                    <span className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="mt-1 text-body-sm text-ink-soft">{step}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ————— Bank index ————— */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-serif text-heading font-normal text-ink">
              Convert your bank&apos;s statements to {format.name}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="tnum text-caption font-semibold uppercase tracking-[0.14em] text-slate">
                  United Kingdom
                </h3>
                <ul className="mt-4 space-y-2">
                  {ukBanks.map((bank) => (
                    <li key={bank.slug}>
                      <Link
                        href={`/convert/${convertSlug(bank, format)}`}
                        className="text-body-sm text-slate underline underline-offset-2 hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iron"
                      >
                        {bank.name} statements to {format.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="tnum text-caption font-semibold uppercase tracking-[0.14em] text-slate">
                  Ireland
                </h3>
                <ul className="mt-4 space-y-2">
                  {ieBanks.map((bank) => (
                    <li key={bank.slug}>
                      <Link
                        href={`/convert/${convertSlug(bank, format)}`}
                        className="text-body-sm text-slate underline underline-offset-2 hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iron"
                      >
                        {bank.name} statements to {format.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
