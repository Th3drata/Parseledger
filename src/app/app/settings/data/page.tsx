import { authEnabled } from '@/lib/auth';
import { DangerZone } from '@/components/app/danger-zone';

export const dynamic = 'force-dynamic';

export default function DataSettingsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-body font-semibold text-ink">How your data is handled</h2>
        <dl className="mt-4 space-y-3 text-body-sm">
          {[
            ['Residency', 'Statements are stored and processed in the EU (Paris).'],
            ['Uploads', 'Source files are transient and purged automatically within 24 hours of processing.'],
            ['Extracted data', 'Statements, transactions and verification results stay in your workspace until you delete them.'],
            ['Training', 'Your data is never used to train models.'],
          ].map(([term, def]) => (
            <div key={term} className="flex gap-4">
              <dt className="w-28 shrink-0 text-slate">{term}</dt>
              <dd className="text-ink-soft">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-hairline pt-6">
        <h2 className="text-body font-semibold text-flag">Danger zone</h2>
        <p className="mt-1 text-body-sm text-slate">
          Both actions are immediate and irreversible.
        </p>
        <div className="mt-4">
          <DangerZone authEnabled={authEnabled()} />
        </div>
      </section>
    </div>
  );
}
