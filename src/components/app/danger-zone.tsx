'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

/**
 * The privacy promise, executable. Wipe statements keeps the account; delete
 * account removes everything (better-auth deleteUser + server-side purge of
 * domain rows via the afterDelete hook).
 */
export function DangerZone({ authEnabled }: { authEnabled: boolean }) {
  const router = useRouter();
  const [wiping, setWiping] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function wipeData() {
    if (!window.confirm('Delete every statement, transaction and export in this workspace?')) return;
    setWiping(true);
    const res = await fetch('/api/account/data', { method: 'DELETE' });
    setWiping(false);
    if (!res.ok) {
      toast.error('Could not delete your data.');
      return;
    }
    const body = (await res.json()) as { deletedJobs: number };
    toast.success(`Deleted ${body.deletedJobs} statement${body.deletedJobs === 1 ? '' : 's'}.`);
    router.refresh();
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    const res = await authClient.deleteUser({ password });
    setDeleting(false);
    if (res.error) {
      toast.error(res.error.message ?? 'Could not delete the account.');
      return;
    }
    window.location.href = '/';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-cards border border-hairline px-4 py-3">
        <div>
          <p className="text-body-sm font-medium text-ink">Delete all statements</p>
          <p className="text-caption text-slate">Wipes every job in this workspace. The account stays.</p>
        </div>
        <button
          type="button"
          onClick={() => void wipeData()}
          disabled={wiping}
          className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-flag transition-colors hover:bg-flag-wash disabled:opacity-50"
        >
          {wiping ? 'Deleting…' : 'Delete data'}
        </button>
      </div>

      {authEnabled ? (
        <div className="rounded-cards border border-hairline px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-body-sm font-medium text-ink">Delete account</p>
              <p className="text-caption text-slate">Account, sessions and every statement — gone.</p>
            </div>
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-flag transition-colors hover:bg-flag-wash"
              >
                Delete account
              </button>
            ) : null}
          </div>
          {confirmingDelete ? (
            <form onSubmit={deleteAccount} className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
              <input
                type="password"
                required
                placeholder="Confirm with your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-w-0 flex-1 rounded-inputs bg-ledger px-3 py-2 text-body-sm text-ink outline-none placeholder:text-ash focus:bg-paper focus:ring-1 focus:ring-iron"
              />
              <button
                type="submit"
                disabled={deleting}
                className="rounded-buttons bg-flag px-3 py-2 text-body-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-body-sm text-slate underline underline-offset-2 hover:text-ink"
              >
                Cancel
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="text-caption text-ash">Account deletion appears here once accounts are enabled.</p>
      )}
    </div>
  );
}
