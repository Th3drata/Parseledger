'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

/** Sidebar user block: initials avatar + name, opening upwards into the menu. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onSignOut() {
    await signOut();
    router.push('/signin');
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-cards bg-paper py-1 shadow-popover"
        >
          <div className="border-b border-hairline px-3 py-2">
            <p className="truncate text-body-sm font-medium text-ink">{name}</p>
            <p className="truncate text-caption text-ash">{email}</p>
          </div>
          {([
            ['Profile', '/app/settings'],
            ['Security', '/app/settings/security'],
            ['Billing', '/app/settings/billing'],
            ['Data & privacy', '/app/settings/data'],
          ] as const).map(([label, href]) => (
            <Link
              key={href}
              role="menuitem"
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 text-body-sm text-slate hover:bg-ledger hover:text-ink"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => void onSignOut()}
            className="block w-full border-t border-hairline px-3 py-1.5 text-left text-body-sm text-slate hover:bg-ledger hover:text-ink"
          >
            Sign out
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 rounded-buttons px-2 py-1.5 text-left hover:bg-mist"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-caption font-semibold text-ink"
        >
          {initials || '·'}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-body-sm font-medium text-ink">{name}</span>
          <span className="block truncate text-caption text-ash">{email}</span>
        </span>
      </button>
    </div>
  );
}
