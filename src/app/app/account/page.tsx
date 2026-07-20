import { resolveOwnerFromContext } from '@/lib/auth';
import { billingEnabled, getSubscription, planLimitFor } from '@/lib/billing';
import { getUsage } from '@/lib/usage';
import { PLANS, PAYG, TIERS, type Tier } from '@/lib/plans';
import { BillingActions, type CheckoutOption } from '@/components/app/billing-actions';

export const dynamic = 'force-dynamic';

function usdFromMinor(minor: number): string {
  return `$${(minor / 100).toFixed(minor % 100 === 0 ? 0 : 2)}`;
}

/** Build checkout options from configured Stripe price ids, above the current tier. */
function upgradeOptions(current: Tier): CheckoutOption[] {
  const currentIndex = TIERS.indexOf(current);
  const options: CheckoutOption[] = [];
  for (const tier of TIERS) {
    if (tier === 'free' || TIERS.indexOf(tier) <= currentIndex) continue;
    const plan = PLANS[tier];
    const monthly = plan.monthlyPriceEnv ? process.env[plan.monthlyPriceEnv] : undefined;
    const annual = plan.annualPriceEnv ? process.env[plan.annualPriceEnv] : undefined;
    if (monthly) {
      options.push({ label: `${plan.name} — ${usdFromMinor(plan.monthlyPriceMinor)}/mo`, priceId: monthly });
    }
    if (annual && plan.annualMonthlyPriceMinor !== null) {
      options.push({
        label: `${plan.name} annual — ${usdFromMinor(plan.annualMonthlyPriceMinor)}/mo`,
        priceId: annual,
      });
    }
  }
  return options;
}

export default async function AccountPage() {
  if (!billingEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Account</h1>
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Running in local mode — billing is disabled. Conversions are unlimited and
          nothing is charged.
        </div>
      </div>
    );
  }

  const ownerId = (await resolveOwnerFromContext()) ?? 'local';
  const sub = await getSubscription(ownerId);
  const used = await getUsage(ownerId);
  const limit = planLimitFor(sub.tier);
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const paygPriceId = process.env[PAYG.priceEnv];
  const paygOption: CheckoutOption | null = paygPriceId
    ? { label: `Add ${PAYG.pagesPerUnit} pages — ${usdFromMinor(PAYG.priceMinor)}`, priceId: paygPriceId }
    : null;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Account</h1>
        <p className="text-sm text-muted-foreground">
          Current plan: <span className="font-medium text-ink">{PLANS[sub.tier].name}</span>
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">Pages this month</h2>
          <span className="tnum text-sm text-muted-foreground">
            {used} / {limit}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Pay-as-you-go balance:{' '}
          <span className="tnum font-medium text-ink">{sub.paygPagesBalance}</span> pages
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Change plan</h2>
        <BillingActions
          options={upgradeOptions(sub.tier)}
          paygOption={paygOption}
          hasCustomer={sub.stripeCustomerId !== null}
        />
      </section>
    </div>
  );
}
