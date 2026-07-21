'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message ?? 'Could not change the password.');
      return;
    }
    setCurrent('');
    setNext('');
    toast.success('Password changed. Other sessions were signed out.');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="current-password" className="block text-body-sm font-medium text-ink">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full max-w-sm rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none focus:bg-paper focus:ring-1 focus:ring-iron"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="new-password" className="block text-body-sm font-medium text-ink">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full max-w-sm rounded-inputs bg-ledger px-3 py-2.5 text-body-sm text-ink outline-none focus:bg-paper focus:ring-1 focus:ring-iron"
        />
        <p className="text-caption text-ash">Minimum 8 characters.</p>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-buttons bg-ink px-4 py-2 text-body-sm font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
      >
        {busy ? 'Changing…' : 'Change password'}
      </button>
    </form>
  );
}
