import Link from 'next/link';
import { SettingsNav } from '@/components/app/settings-nav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Link href="/app" className="text-body-sm text-slate hover:text-ink">
        ← Workspace
      </Link>
      <h1 className="mt-3 text-heading-sm font-semibold tracking-tight text-ink">Settings</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0 max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
