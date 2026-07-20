import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center px-6">
          <Link href="/" className="text-body-lg font-semibold tracking-tight text-ink">
            Parseledger
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
