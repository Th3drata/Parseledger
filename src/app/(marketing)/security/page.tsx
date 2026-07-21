import Link from 'next/link';
import type { Metadata } from 'next';
import Reveal from '@/components/motion/Reveal';
import { RuledLine } from '@/components/motion/ruled-line';

export const metadata: Metadata = {
  title: 'Security & privacy',
  description:
    'How Parseledger handles bank statement data: EU data residency, transient file storage with auto-purge, no training on your data, and encryption in transit and at rest.',
};

const DATA_PATH: Array<{ kicker: string; title: string; body: string }> = [
  {
    kicker: '01',
    title: 'Upload',
    body: 'The statement leaves your browser over TLS and lands on encrypted EU storage. It is readable to the job that processes it, and to nothing else.',
  },
  {
    kicker: '02',
    title: 'EU processing',
    body: 'Extraction and both verification checks run on infrastructure in EU regions. The file is read, the figures are computed in integer minor units, and the results are written back — the source never leaves the region.',
  },
  {
    kicker: '03',
    title: '24-hour purge',
    body: 'Once you have your export, the source file has done its work. It is deleted automatically within 24 hours of processing — and you can delete the whole job, file, data and audit trail, yourself at any time.',
  },
];

function Chapter({
  no,
  eyebrow,
  title,
  children,
}: {
  no: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="grid gap-4 py-12 lg:grid-cols-[220px_1fr] lg:gap-12">
        <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
          {no} — {eyebrow}
        </p>
        <div>
          <h2 className="font-serif text-heading-sm font-normal text-ink">{title}</h2>
          <div className="mt-4 max-w-2xl space-y-4 text-body-sm leading-relaxed text-ink-soft">
            {children}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function SecurityPage() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24">
      <Reveal>
        <div className="max-w-3xl">
          <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
            How statements are handled
          </p>
          <h1 className="mt-4 font-serif text-heading-lg font-normal text-ink">
            Security and privacy
          </h1>
          <p className="mt-5 text-body-lg text-slate">
            Bank statements are among the most sensitive documents a bookkeeper handles.
            Parseledger is built on a simple position: your statements are yours. We process
            them, prove the figures reconcile, hand you the export, and get out of the way.
          </p>
        </div>
      </Reveal>

      <div className="mt-16">
        <RuledLine />

        <Chapter no="01" eyebrow="Residency" title="Processed in the EU, and only the EU">
          <p>
            All application data is stored and processed in the European Union, on Supabase
            infrastructure hosted in EU regions. Nothing is replicated outside the EU.
          </p>
          <p>
            That is a deliberate constraint, not a hosting accident. Statements belonging to UK
            and Irish clients are not routed wherever compute happens to be cheapest — uploads,
            extracted data, exports and audit trails all live in the same region, under the same
            rules.
          </p>
        </Chapter>
        <RuledLine />

        <Chapter no="02" eyebrow="The data path" title="Where a statement goes, start to finish">
          <p>
            A statement&apos;s life inside Parseledger is short and traceable. This is the whole
            of it:
          </p>
          <ol className="mt-8 border-l border-hairline">
            {DATA_PATH.map((step) => (
              <li key={step.kicker} className="relative pb-10 pl-8 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[3.5px] top-[5px] h-[7px] w-[7px] rounded-full border border-slate bg-paper"
                />
                <p className="tnum text-caption font-medium uppercase tracking-[0.14em] text-slate">
                  {step.kicker} · {step.title}
                </p>
                <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Chapter>
        <RuledLine />

        <Chapter no="03" eyebrow="Retention" title="Transient files, auto-purged">
          <p>
            Uploaded PDFs and photos are held only as long as needed to extract and verify them.
            Uploads exist to be converted, not collected.
          </p>
          <p>
            Source files are purged automatically after processing; you control how long the
            extracted data itself is retained, and you can delete a job — file, data and audit
            trail — at any time.
          </p>
        </Chapter>
        <RuledLine />

        <Chapter no="04" eyebrow="Model training" title="No training on your data">
          <p>
            Your statements are never used to train models — ours or anyone else&apos;s.
            Extraction runs under agreements that exclude customer content from model training.
          </p>
          <p>
            A statement uploaded to be converted is used to convert that statement, and for
            nothing more. Your clients&apos; transactions stay your clients&apos; transactions.
          </p>
        </Chapter>
        <RuledLine />

        <Chapter no="05" eyebrow="Encryption" title="Encrypted in transit and at rest">
          <p>
            All traffic is encrypted in transit with TLS, and all stored data is encrypted at
            rest. The database sits behind the application — no public key can reach it
            directly.
          </p>
          <p>
            Access to production systems is restricted to the people who operate them, and every
            access is logged.
          </p>
        </Chapter>
        <RuledLine />

        <Chapter no="06" eyebrow="Correctness" title="Verification, not trust">
          <p>
            Security extends to correctness. Every statement must satisfy{' '}
            <span className="tnum">opening + credits − debits = closing</span> and pass
            line-by-line running-balance checks before it is marked Verified — so the file you
            hand to a client is provably consistent with the statement it came from.
          </p>
          <p>
            The exports are careful too: transaction descriptions are sanitised against
            spreadsheet formula injection before they ever reach a cell. A small thing, until
            the day it isn&apos;t.
          </p>
        </Chapter>
        <RuledLine />
      </div>

      <Reveal>
        <div className="mt-14 max-w-3xl rounded-cards border border-hairline bg-ledger p-6 text-body-sm text-slate">
          <p>
            Parseledger is a data conversion and verification tool. It is not an accountant,
            does not provide accounting, tax or financial advice, and does not replace
            professional judgement. Review flagged rows before relying on any export.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iron"
          >
            Convert a statement
          </Link>
          <p className="text-body-sm text-slate">10 free pages a month. No card.</p>
        </div>
      </Reveal>
    </section>
  );
}
