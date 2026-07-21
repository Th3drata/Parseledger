import type { Metadata } from 'next';
import { authEnabled, enabledSocialProviders } from '@/lib/auth';
import { AuthForm } from '@/components/app/auth-form';
import { LocalModeNote } from '@/components/app/local-mode-note';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-2 text-body-sm text-slate">Free tier: 10 pages a month, no card required.</p>
      </div>
      {authEnabled() ? <AuthForm mode="signup" providers={enabledSocialProviders()} /> : <LocalModeNote />}
    </div>
  );
}
