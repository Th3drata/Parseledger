import type { Metadata } from 'next';
import { authEnabled } from '@/lib/auth';
import { AuthForm } from '@/components/app/auth-form';
import { LocalModeNote } from '@/components/app/local-mode-note';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-sm font-semibold tracking-tight text-ink">Open your ledger</h1>
        <p className="mt-2 text-body-sm text-slate">
          Free tier: 10 pages a month, no card. Every page runs the full verification engine.
        </p>
      </div>
      {authEnabled() ? <AuthForm mode="signup" /> : <LocalModeNote />}
    </div>
  );
}
