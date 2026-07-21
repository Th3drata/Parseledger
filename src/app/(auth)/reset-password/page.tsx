'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token || params.get('error')) {
    return (
      <div className="space-y-4">
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Link expired</h1>
        <p className="text-body-sm text-slate">
          This reset link is invalid or has expired. Request a fresh one.
        </p>
        <Link href="/forgot-password" className="inline-block text-body-sm text-slate underline underline-offset-2 hover:text-ink">
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await authClient.resetPassword({ newPassword: password, token: token ?? '' });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? 'Something went wrong.');
      return;
    }
    router.push('/signin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Choose a new password</h1>
        <p className="mt-2 text-body-sm text-slate">Minimum 8 characters.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-body-sm font-medium text-ink">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none placeholder:text-ash focus:bg-paper focus:ring-1 focus:ring-iron"
          />
        </div>
        {error ? <p className="text-body-sm text-flag">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-buttons bg-ink px-4 py-2.5 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Set password and sign in'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
