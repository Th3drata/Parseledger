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
      className="transition-colors hover:text-foreground disabled:opacity-60"
    >
      Sign out
    </button>
  );
}
