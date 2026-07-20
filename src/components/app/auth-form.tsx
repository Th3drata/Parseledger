'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';

type Mode = 'signin' | 'signup';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = isSignup
        ? await signUp.email({ email, password, name: name || email })
        : await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? 'Something went wrong.');
        setBusy(false);
        return;
      }
      router.push('/app');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isSignup && (
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-body-sm font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none placeholder:text-ash focus:bg-paper focus:ring-1 focus:ring-iron"
          />
        </div>
      )}
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
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-body-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none placeholder:text-ash focus:bg-paper focus:ring-1 focus:ring-iron"
        />
      </div>

      {error && <p className="text-body-sm text-flag">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-buttons bg-ink px-4 py-2.5 text-body-sm font-medium text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
      >
        {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
      </button>

      <p className="text-body-sm text-slate">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/signin" className="text-slate underline hover:text-ink">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{' '}
            <Link href="/signup" className="text-slate underline hover:text-ink">
              Create one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
