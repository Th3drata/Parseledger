/**
 * One badge, three truths — the pill is the rendered output of
 * reconcileStatement(). Green certifies, amber asks for review, red flags.
 */
export type BadgeState = 'reconciled' | 'caution' | 'flag';

const STYLES: Record<BadgeState, string> = {
  reconciled: 'bg-reconciled-wash text-reconciled',
  caution: 'bg-caution-wash text-caution',
  flag: 'bg-flag-wash text-flag',
};

export function VerifiedBadge({ state, label }: { state: BadgeState; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${STYLES[state]}`}
    >
      {state === 'reconciled' ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 4.5v3M7 9.75v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </span>
  );
}
