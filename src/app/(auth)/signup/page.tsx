import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Create account — Parseledger' };

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">We're getting ready</h1>
        <p className="max-w-md text-body-base text-slate leading-relaxed">
          Parseledger is in active development. Accounts will open soon — we're
          making sure every cent reconciles before we let anyone in.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-ledger p-6 space-y-3">
        <p className="text-body-sm font-medium text-ink">What's already live</p>
        <ul className="space-y-2 text-body-sm text-slate">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green">✓</span>
            PDF statement extraction with cent-level reconciliation
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green">✓</span>
            Export to CSV, Excel, QuickBooks QBO, Xero
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green">✓</span>
            Live review with re-verification on every edit
          </li>
        </ul>
      </div>

      <p className="text-body-sm text-slate">
        Want early access?{' '}
        <Link href="/app" className="text-slate underline hover:text-ink transition-colors">
          Try the demo →
        </Link>
      </p>
    </div>
  );
}
