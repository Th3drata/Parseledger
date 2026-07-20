import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security & privacy',
  description:
    'How Parseledger handles bank statement data: EU data residency, transient file storage with auto-purge, no training on your data, and encryption in transit and at rest.',
};

export default function SecurityPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Security and privacy</h1>
      <p className="mt-4 text-muted-foreground">
        Bank statements are among the most sensitive documents a bookkeeper handles. Parseledger
        is built on a simple position: your statements are yours. We process them, prove the
        figures reconcile, hand you the export, and get out of the way.
      </p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-ink">EU data residency</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All application data is stored and processed in the European Union, on Supabase
            infrastructure hosted in EU regions. Nothing is replicated outside the EU.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Transient files, auto-purged</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Uploaded PDFs and photos are held only as long as needed to extract and verify them.
            Source files are purged automatically after processing; you control how long the
            extracted data itself is retained, and you can delete a job — file, data and audit
            trail — at any time.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">No training on your data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your statements are never used to train models — ours or anyone else&apos;s.
            Extraction runs under agreements that exclude customer content from model training.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Encryption throughout</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All traffic is encrypted in transit with TLS, and all stored data is encrypted at
            rest. Access to production systems is restricted and logged.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Verification, not trust</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Security extends to correctness. Every statement must satisfy
            {' '}<span className="tnum">opening + credits − debits = closing</span> and pass
            line-by-line running-balance checks before it is marked Verified — so the file you
            hand to a client is provably consistent with the statement it came from.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <p>
          Parseledger is a data conversion and verification tool. It is not an accountant, does
          not provide accounting, tax or financial advice, and does not replace professional
          judgement. Review flagged rows before relying on any export.
        </p>
      </div>

      <div className="mt-10">
        <Link
          href="/app"
          className="rounded-md bg-ink px-5 py-2.5 font-medium text-background hover:opacity-90"
        >
          Convert a statement
        </Link>
      </div>
    </section>
  );
}
