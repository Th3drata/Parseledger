'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Check your inbox</h1>
        <p className="text-body-sm leading-relaxed text-slate">
          If an account exists for <span className="text-ink">{email}</span>, a reset link is on
          its way. It expires in one hour.
        </p>
        <Link href="/signin" className="inline-block text-body-sm text-slate underline underline-offset-2 hover:text-ink">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Reset your password</h1>
        <p className="mt-2 text-body-sm text-slate">
          Enter your account email and we&apos;ll send a reset link.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-body-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none placeholder:text-ash focus:bg-paper focus:ring-1 focus:ring-iron"
          />
        </div>
        {error ? <p className="text-body-sm text-flag">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-buttons bg-ink px-4 py-2.5 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="text-body-sm text-slate">
          <Link href="/signin" className="underline underline-offset-2 hover:text-ink">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
