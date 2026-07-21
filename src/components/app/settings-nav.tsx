'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/app/settings', label: 'Profile' },
  { href: '/app/settings/security', label: 'Security' },
  { href: '/app/settings/billing', label: 'Billing' },
  { href: '/app/settings/data', label: 'Data & privacy' },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-buttons px-3 py-2 text-body-sm font-medium transition-colors ${
              active ? 'bg-mist text-ink' : 'text-slate hover:bg-ledger hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
