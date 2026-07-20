import type { Metadata } from 'next';
import { authEnabled } from '@/lib/auth';
import { AuthForm } from '@/components/app/auth-form';
import { LocalModeNote } from '@/components/app/local-mode-note';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  const enabled = authEnabled();
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="text-body-sm text-slate">
          Access your statements and exports.
        </p>
      </div>
      {enabled ? <AuthForm mode="signin" /> : <LocalModeNote />}
    </div>
  );
}
