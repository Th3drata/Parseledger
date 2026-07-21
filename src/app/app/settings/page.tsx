import { authEnabled, getUserFromContext } from '@/lib/auth';
import { ProfileForm } from '@/components/app/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const user = await getUserFromContext();

  if (!authEnabled() || !user) {
    return (
      <div className="rounded-cards border border-hairline bg-ledger px-5 py-4">
        <p className="text-body-sm text-slate">
          Running in local mode — accounts are disabled, so there is no profile to edit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-body font-semibold text-ink">Profile</h2>
        <p className="mt-1 text-body-sm text-slate">How you appear on exports and in the audit log.</p>
        <div className="mt-5">
          <ProfileForm initialName={user.name} email={user.email} emailVerified={user.emailVerified} />
        </div>
      </section>
      <section className="border-t border-hairline pt-6">
        <h2 className="text-body font-semibold text-ink">Account</h2>
        <dl className="mt-3 space-y-2 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Member since</dt>
            <dd className="tnum text-ink">{new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Account id</dt>
            <dd className="tnum truncate text-ash">{user.userId}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
