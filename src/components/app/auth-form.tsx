'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient, signIn, signUp } from '@/lib/auth-client';
import type { SocialProviders } from '@/lib/auth';

type Mode = 'signin' | 'signup';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.29a7.21 7.21 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
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

function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-tags p-1 text-ash hover:text-slate"
    >
      {shown ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 2l12 12M6.7 6.8a2 2 0 0 0 2.6 2.6M4.5 4.7C3 5.7 1.9 7.1 1.3 8c1.5 2.4 3.9 4 6.7 4 1 0 2-.2 2.9-.6M7 4.1c.3 0 .7-.1 1-.1 2.8 0 5.2 1.6 6.7 4-.4.6-.9 1.3-1.6 1.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M1.3 8C2.8 5.6 5.2 4 8 4s5.2 1.6 6.7 4C13.2 10.4 10.8 12 8 12S2.8 10.4 1.3 8z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
    </button>
  );
}

/** Neutral strength read (colour stays reserved for verification state). */
function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length === 0) return { score: 0, label: '' };
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/\d/.test(pw)) variety++;
  if (/[^a-zA-Z0-9]/.test(pw)) variety++;
  if (pw.length < 8) return { score: 1, label: 'Too short — 8 characters minimum' };
  if (pw.length >= 12 && variety >= 3) return { score: 3, label: 'Strong password' };
  if (pw.length >= 10 && variety >= 2) return { score: 2, label: 'Good password' };
  return { score: 1, label: 'Weak — longer is stronger' };
}

/** Friendly copy for the error codes people actually hit. */
function humanError(code: string | undefined, message: string | undefined, mode: Mode): string {
  switch (code) {
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'An account with this email already exists — sign in below instead.';
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Email or password doesn’t match. Check both, or reset your password.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Your email isn’t verified yet — check your inbox, or resend the link below.';
    case 'INVALID_EMAIL':
      return 'That doesn’t look like a valid email address.';
    default:
      return message ?? (mode === 'signup' ? 'Could not create the account.' : 'Could not sign you in.');
  }
}

/** What the ?error= param from an aborted/failed OAuth round-trip means. */
function oauthErrorCopy(error: string): string {
  if (error === 'access_denied' || error === 'user_cancelled' || error === 'oauth_cancelled') {
    return 'Sign-in was cancelled before finishing. Nothing happened — pick a method below to try again.';
  }
  if (error === 'account_not_linked') {
    return 'This email already has an account with a different sign-in method. Sign in with your original method, then link providers in Settings.';
  }
  return 'The sign-in provider returned an error before finishing. Nothing happened — try again, or use email and password.';
}

function AuthFormInner({ mode, providers }: { mode: Mode; providers: SocialProviders }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/app';
  const urlError = params.get('error');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(urlError ? oauthErrorCopy(urlError) : null);
  const [offerResend, setOfferResend] = useState(false);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const hasSocial = providers.google || providers.apple;
  const strength = useMemo(() => passwordStrength(password), [password]);
  const confirmMismatch = isSignup && confirm.length > 0 && confirm !== password;

  // Coming back via the browser Back button restores this page from the
  // bfcache with stale state — reset so buttons never stay stuck.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(null);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  async function social(provider: 'google' | 'apple') {
    setError(null);
    setBusy(provider);
    // If the provider window never takes over (popup blocked, network), free the button.
    const fallback = setTimeout(() => {
      setBusy(null);
      setError('The sign-in page didn’t open. Check your popup blocker and try again.');
    }, 20_000);
    try {
      await signIn.social({
        provider,
        callbackURL: next,
        errorCallbackURL: `${window.location.pathname}?error=oauth_failed`,
      });
    } catch {
      clearTimeout(fallback);
      setError('Could not reach the sign-in provider. Try again, or use email and password.');
      setBusy(null);
    }
  }

  async function resendVerification() {
    setResent(false);
    const res = await authClient.sendVerificationEmail({ email, callbackURL: '/app' });
    if (res.error) {
      setError(res.error.message ?? 'Could not resend the verification email.');
      return;
    }
    setResent(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOfferResend(false);
    if (isSignup && password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setBusy('email');
    try {
      const res = isSignup
        ? await signUp.email({ email, password, name: name.trim() || email })
        : await signIn.email({ email, password });
      if (res.error) {
        const code = (res.error as { code?: string }).code;
        setError(humanError(code, res.error.message ?? undefined, mode));
        if (code === 'EMAIL_NOT_VERIFIED') setOfferResend(true);
        setBusy(null);
        return;
      }
      // Signup with verification enforced: no session yet — guide to the inbox.
      if (isSignup && res.data && !('token' in res.data && res.data.token)) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      router.push(next);
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
                {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
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
                {busy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
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

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {isSignup && (
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-body-sm font-medium text-ink">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
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
            autoFocus={!isSignup}
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
              <Link href="/forgot-password" className="text-caption text-slate underline underline-offset-2 hover:text-ink">
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'At least 8 characters' : '••••••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
              onBlur={() => setCapsLock(false)}
              className={`${inputClass} pr-10`}
            />
            <EyeToggle shown={showPw} onToggle={() => setShowPw((v) => !v)} />
          </div>
          {capsLock ? <p className="text-caption text-caution">Caps Lock is on.</p> : null}
          {isSignup && strength.label ? (
            <div className="flex items-center gap-2 pt-0.5" aria-live="polite">
              <span className="flex gap-1" aria-hidden>
                {[1, 2, 3].map((seg) => (
                  <span
                    key={seg}
                    className={`h-1 w-8 rounded-full ${strength.score >= seg ? (strength.score >= 3 ? 'bg-ink' : 'bg-slate') : 'bg-mist'}`}
                  />
                ))}
              </span>
              <span className="text-caption text-slate">{strength.label}</span>
            </div>
          ) : null}
        </div>
        {isSignup && (
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-body-sm font-medium text-ink">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Same password again"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={confirmMismatch}
              className={`${inputClass} ${confirmMismatch ? 'ring-1 ring-flag' : ''}`}
            />
            {confirmMismatch ? (
              <p className="text-caption text-flag">These don’t match yet.</p>
            ) : isSignup && confirm.length > 0 ? (
              <p className="text-caption text-slate">Passwords match.</p>
            ) : null}
          </div>
        )}

        {error && (
          <div role="alert" className="space-y-2 rounded-tags bg-flag-wash px-3 py-2">
            <p className="text-body-sm text-flag">{error}</p>
            {offerResend ? (
              resent ? (
                <p className="text-caption text-slate">Verification email sent — check your inbox.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => void resendVerification()}
                  className="text-caption font-medium text-ink underline underline-offset-2"
                >
                  Resend the verification email
                </button>
              )
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={busy !== null || confirmMismatch}
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

/**
 * The door — grammar borrowed from the best sign-in flows on the web, with
 * the failure paths handled: OAuth cancellation, popup blockers, back-button
 * bfcache, unverified emails, duplicate accounts, mismatched passwords.
 */
export function AuthForm(props: { mode: Mode; providers: SocialProviders }) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner {...props} />
    </Suspense>
  );
}
