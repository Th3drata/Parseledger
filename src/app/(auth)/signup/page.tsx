import type { Metadata } from 'next';
import { authEnabled } from '@/lib/auth';
import { AuthForm } from '@/components/app/auth-form';
import { LocalModeNote } from '@/components/app/local-mode-note';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  const enabled = authEnabled();
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Create account</h1>
        <p className="text-body-sm text-slate">
          Start converting statements in minutes.
        </p>
      </div>
      {enabled ? <AuthForm mode="signup" /> : <LocalModeNote />}
    </div>
  );
}
