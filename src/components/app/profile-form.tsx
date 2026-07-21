'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

export function ProfileForm({
  initialName,
  email,
  emailVerified,
}: {
  initialName: string;
  email: string;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  async function resendVerification() {
    const res = await authClient.sendVerificationEmail({ email, callbackURL: '/app/settings' });
    if (res.error) toast.error(res.error.message ?? 'Could not send the verification email.');
    else toast.success('Verification email sent — check your inbox.');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await authClient.updateUser({ name });
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message ?? 'Could not save your profile.');
      return;
    }
    toast.success('Profile saved.');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-body-sm font-medium text-ink">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-sm rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none focus:bg-paper focus:ring-1 focus:ring-iron"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-body-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          value={email}
          disabled
          className="w-full max-w-sm rounded-inputs bg-mist px-3 py-2.5 text-body-sm text-slate outline-none"
        />
        {emailVerified ? (
          <p className="text-caption text-slate">Verified address.</p>
        ) : (
          <p className="text-caption text-caution">
            Not verified yet —{' '}
            <button type="button" onClick={() => void resendVerification()} className="font-medium underline underline-offset-2">
              resend the link
            </button>
          </p>
        )}
        <p className="text-caption text-ash">Email changes aren&apos;t self-serve yet — contact support.</p>
      </div>
      <button
        type="submit"
        disabled={busy || name.trim() === '' || name === initialName}
        className="rounded-buttons bg-ink px-4 py-2 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
