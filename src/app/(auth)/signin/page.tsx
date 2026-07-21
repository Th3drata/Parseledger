import type { Metadata } from 'next';
import { authEnabled, enabledSocialProviders } from '@/lib/auth';
import { AuthForm } from '@/components/app/auth-form';
import { LocalModeNote } from '@/components/app/local-mode-note';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-2 text-body-sm text-slate">Sign in to your workspace.</p>
      </div>
      {authEnabled() ? <AuthForm mode="signin" providers={enabledSocialProviders()} /> : <LocalModeNote />}
    </div>
  );
}
