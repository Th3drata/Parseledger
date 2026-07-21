import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="ruled-paper flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="tnum text-caption uppercase tracking-wide text-ash">Page not found</p>
      <h1 className="mt-4 font-serif text-heading font-normal text-ink sm:text-heading-lg">
        404 — This page doesn&rsquo;t balance.
      </h1>
      <p className="tnum mt-6 text-figure text-slate">
        requested − found = <span className="font-medium text-flag">404</span>
      </p>
      <Link
        href="/"
        className="mt-10 inline-block rounded-buttons bg-ink px-5 py-2.5 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft"
      >
        Back to the ledger
      </Link>
    </main>
  );
}
