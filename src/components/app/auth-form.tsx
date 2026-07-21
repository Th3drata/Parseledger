'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';
import type { SocialProviders } from '@/lib/auth';

type Mode = 'signin' | 'signup';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.21 7.21 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.36 12.76c-.02-2.05 1.68-3.03 1.75-3.08-.95-1.4-2.44-1.59-2.97-1.61-1.26-.13-2.47.74-3.11.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.03-1.43 2.48-.37 6.16 1.03 8.18.68.99 1.49 2.1 2.56 2.06 1.03-.04 1.42-.66 2.66-.66s1.59.66 2.68.64c1.11-.02 1.81-1 2.48-2 .78-1.15 1.11-2.26 1.13-2.32-.03-.01-2.15-.83-2.17-3.28zM14.3 6.74c.57-.69.95-1.65.85-2.61-.82.03-1.81.55-2.4 1.23-.53.61-.99 1.59-.86 2.53.91.07 1.84-.46 2.41-1.15z" />
    </svg>
  );
}

/**
 * The door — grammar borrowed from the best sign-in flows on the web:
 * providers first (one tap), a quiet divider, then email. Providers render
 * only when their credentials are configured server-side.
 */
export function AuthForm({ mode, providers }: { mode: Mode; providers: SocialProviders }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const hasSocial = providers.google || providers.apple;

  async function social(provider: 'google' | 'apple') {
    setError(null);
    setBusy(provider);
    try {
      await signIn.social({ provider, callbackURL: '/app' });
    } catch {
      setError('Could not reach the sign-in provider. Try again.');
      setBusy(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy('email');
    try {
      const res = isSignup
        ? await signUp.email({ email, password, name: name || email })
        : await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? 'Something went wrong.');
        setBusy(null);
        return;
      }
      router.push('/app');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(null);
    }
  }

  const inputClass =
    'w-full rounded-inputs bg-ledger px-3.5 py-2.5 text-body-sm text-ink outline-none placeholder:text-ash transition-colors focus:bg-paper focus:ring-1 focus:ring-iron';

  return (
    <div className="space-y-5">
      {hasSocial ? (
        <>
          <div className="space-y-2.5">
            {providers.google ? (
              <button
                type="button"
                onClick={() => void social('google')}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-3 rounded-buttons border border-hairline bg-paper px-4 py-2.5 text-body-sm font-medium text-ink transition-colors hover:bg-ledger disabled:opacity-60"
              >
                <GoogleMark />
                {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
              </button>
            ) : null}
            {providers.apple ? (
              <button
                type="button"
                onClick={() => void social('apple')}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-3 rounded-buttons border border-hairline bg-paper px-4 py-2.5 text-body-sm font-medium text-ink transition-colors hover:bg-ledger disabled:opacity-60"
              >
                <AppleMark />
                {busy === 'apple' ? 'Redirecting…' : 'Continue with Apple'}
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-caption uppercase tracking-wide text-ash">or</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>
        </>
      ) : null}

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
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
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
            placeholder="you@practice.co.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="block text-body-sm font-medium text-ink">
              Password
            </label>
            {!isSignup && (
              <Link
                href="/forgot-password"
                className="text-caption text-slate underline underline-offset-2 hover:text-ink"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder={isSignup ? 'At least 8 characters' : '••••••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-tags bg-flag-wash px-3 py-2 text-body-sm text-flag">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy !== null}
          className="w-full rounded-buttons bg-ink px-4 py-2.5 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {busy === 'email' ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="text-body-sm text-slate">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/signin" className="text-ink underline underline-offset-2 hover:text-ink-soft">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Parseledger?{' '}
            <Link href="/signup" className="text-ink underline underline-offset-2 hover:text-ink-soft">
              Create an account
            </Link>
          </>
        )}
      </p>

      {isSignup ? (
        <p className="text-caption leading-relaxed text-ash">
          By creating an account you agree that Parseledger converts and verifies statement data
          and does not provide accounting or tax advice. EU-hosted; files auto-purge within 24h.
        </p>
      ) : null}
    </div>
  );
}
