'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

/** Post-signup landing: the inbox is the next step, with a way to retry. */
export function VerifyEmailCard() {
  const email = useSearchParams().get('email') ?? '';
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function resend() {
    if (!email) return;
    setState('sending');
    const res = await authClient.sendVerificationEmail({ email, callbackURL: '/app' });
    setState(res.error ? 'error' : 'sent');
  }

  return (
    <div className="space-y-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-buttons bg-ledger">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-ink">
          <rect x="2" y="4.5" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 5.5L10 11l7.5-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Check your inbox</h1>
        <p className="mt-2 text-body-sm leading-relaxed text-slate">
          We sent a verification link{email ? <> to <span className="font-medium text-ink">{email}</span></> : null}.
          Click it to activate your account — the link signs you straight in.
        </p>
      </div>
      <div className="space-y-3 rounded-cards border border-hairline bg-ledger/50 p-4">
        <p className="text-caption text-slate">
          Nothing after a couple of minutes? Check the spam folder, or send it again.
        </p>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={!email || state === 'sending'}
          className="rounded-buttons border border-hairline bg-paper px-3.5 py-2 text-body-sm font-medium text-ink transition-colors hover:bg-ledger disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Sent — check again' : 'Resend the email'}
        </button>
        {state === 'error' ? <p className="text-caption text-flag">Could not resend — try again in a minute.</p> : null}
      </div>
      <p className="text-body-sm text-slate">
        Wrong address?{' '}
        <Link href="/signup" className="text-ink underline underline-offset-2 hover:text-ink-soft">
          Start over
        </Link>{' '}
        · Already verified?{' '}
        <Link href="/signin" className="text-ink underline underline-offset-2 hover:text-ink-soft">
          Sign in
        </Link>
      </p>
    </div>
  );
}
