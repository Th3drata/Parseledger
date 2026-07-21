import { authEnabled, listSessionsFromContext } from '@/lib/auth';
import { ChangePasswordForm } from '@/components/app/change-password-form';
import { SessionsList } from '@/components/app/sessions-list';

export const dynamic = 'force-dynamic';

export default async function SecuritySettingsPage() {
  if (!authEnabled()) {
    return (
      <div className="rounded-cards border border-hairline bg-ledger px-5 py-4">
        <p className="text-body-sm text-slate">Running in local mode — there is no account to secure.</p>
      </div>
    );
  }
  const sessions = await listSessionsFromContext();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-body font-semibold text-ink">Change password</h2>
        <p className="mt-1 text-body-sm text-slate">
          Changing your password signs out every other device.
        </p>
        <div className="mt-5">
          <ChangePasswordForm />
        </div>
      </section>
      <section className="border-t border-hairline pt-6">
        <h2 className="text-body font-semibold text-ink">Active sessions</h2>
        <p className="mt-1 text-body-sm text-slate">
          Everywhere your account is currently signed in.
        </p>
        <div className="mt-4">
          <SessionsList
            sessions={sessions.map((s) => ({
              token: s.token,
              createdAt: s.createdAt.toISOString(),
              expiresAt: s.expiresAt.toISOString(),
              userAgent: s.userAgent,
              current: s.current,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
