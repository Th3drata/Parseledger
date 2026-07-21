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

export default async function BillingSettingsPage() {
  if (!billingEnabled()) {
    return (
      <div className="rounded-cards border border-hairline bg-ledger p-4 text-body-sm text-slate">
        Billing isn&apos;t enabled yet — conversions are currently unlimited and nothing is
        charged. Plans activate once Stripe is connected.
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
        <h2 className="text-body font-semibold text-ink">Plan</h2>
        <p className="text-body-sm text-slate">
          Current plan: <span className="font-semibold text-ink">{PLANS[sub.tier].name}</span>
        </p>
      </div>

      <section className="space-y-3 border-t border-hairline pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-body-sm font-semibold text-ink">Pages this month</h2>
          <span className="tnum text-body-sm text-slate">
            {used} / {limit}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-mist">
          <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-body-sm text-slate">
          Pay-as-you-go balance:{' '}
          <span className="tnum font-medium text-ink">{sub.paygPagesBalance}</span> pages
        </p>
      </section>

      <section className="space-y-4 border-t border-hairline pt-6">
        <h2 className="text-body-sm font-semibold text-ink">Change plan</h2>
        <BillingActions
          options={upgradeOptions(sub.tier)}
          paygOption={paygOption}
          hasCustomer={sub.stripeCustomerId !== null}
        />
      </section>
    </div>
  );
}
