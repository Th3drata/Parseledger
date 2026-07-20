'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut().finally(() => {
          router.push('/signin');
          router.refresh();
        });
      }}
      className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm text-slate transition-colors hover:bg-ledger hover:text-ink disabled:opacity-60"
    >
      Sign out
    </button>
  );
}
