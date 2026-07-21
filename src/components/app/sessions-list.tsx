'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

interface SessionRow {
  token: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  current: boolean;
}

function describeAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const browser = /Firefox/.test(ua) ? 'Firefox' : /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  const os = /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : '';
  return os ? `${browser} · ${os}` : browser;
}

export function SessionsList({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [busyToken, setBusyToken] = useState<string | null>(null);

  async function revoke(token: string) {
    setBusyToken(token);
    const res = await authClient.revokeSession({ token });
    setBusyToken(null);
    if (res.error) {
      toast.error(res.error.message ?? 'Could not revoke the session.');
      return;
    }
    toast.success('Session revoked.');
    router.refresh();
  }

  if (sessions.length === 0) {
    return <p className="text-body-sm text-slate">No active sessions.</p>;
  }

  return (
    <ul className="divide-y divide-hairline rounded-cards border border-hairline">
      {sessions.map((s) => (
        <li key={s.token} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-body-sm font-medium text-ink">
              {describeAgent(s.userAgent)}
              {s.current ? (
                <span className="ml-2 rounded-full bg-reconciled-wash px-2 py-0.5 text-caption text-reconciled">
                  this device
                </span>
              ) : null}
            </p>
            <p className="tnum mt-0.5 text-caption text-ash">
              signed in {new Date(s.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {' · expires '}
              {new Date(s.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          {!s.current ? (
            <button
              type="button"
              onClick={() => void revoke(s.token)}
              disabled={busyToken === s.token}
              className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-ink transition-colors hover:bg-ledger disabled:opacity-50"
            >
              {busyToken === s.token ? 'Revoking…' : 'Revoke'}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
