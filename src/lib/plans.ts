/**
 * Billing plans. Prices are in USD cents (integer minor units — Stripe amounts
 * are already minor units). Page allowances are per calendar month.
 *
 * Stripe price ids come from env so the same code runs against test and live
 * catalogues without edits.
 */

export type Tier = 'free' | 'solo' | 'pro' | 'practice';

export interface Plan {
  tier: Tier;
  name: string;
  /** Included pages per calendar month. */
  monthlyPages: number;
  /** Monthly price in USD cents (0 for free). */
  monthlyPriceMinor: number;
  /** Annual-billing effective monthly price in USD cents, if offered. */
  annualMonthlyPriceMinor: number | null;
  /** Env var holding the monthly Stripe price id (null for free). */
  monthlyPriceEnv: string | null;
  /** Env var holding the annual Stripe price id, if offered. */
  annualPriceEnv: string | null;
}

export const PLANS: Record<Tier, Plan> = {
  free: {
    tier: 'free',
    name: 'Free',
    monthlyPages: 10,
    monthlyPriceMinor: 0,
    annualMonthlyPriceMinor: null,
    monthlyPriceEnv: null,
    annualPriceEnv: null,
  },
  solo: {
    tier: 'solo',
    name: 'Solo',
    monthlyPages: 150,
    monthlyPriceMinor: 2400,
    annualMonthlyPriceMinor: 1900,
    monthlyPriceEnv: 'STRIPE_PRICE_SOLO',
    annualPriceEnv: 'STRIPE_PRICE_SOLO_ANNUAL',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPages: 750,
    monthlyPriceMinor: 5900,
    annualMonthlyPriceMinor: 4900,
    monthlyPriceEnv: 'STRIPE_PRICE_PRO',
    annualPriceEnv: 'STRIPE_PRICE_PRO_ANNUAL',
  },
  practice: {
    tier: 'practice',
    name: 'Practice',
    monthlyPages: 3000,
    monthlyPriceMinor: 14900,
    annualMonthlyPriceMinor: null,
    monthlyPriceEnv: 'STRIPE_PRICE_PRACTICE',
    annualPriceEnv: null,
  },
};

/** Pay-as-you-go top-up: $9 buys 100 non-expiring pages. */
export const PAYG = {
  priceEnv: 'STRIPE_PRICE_PAYG',
  pagesPerUnit: 100,
  priceMinor: 900,
};

export const TIERS: Tier[] = ['free', 'solo', 'pro', 'practice'];

/** Map a configured Stripe price id back to the tier it grants. */
export function tierForPriceId(priceId: string): Tier | null {
  for (const tier of TIERS) {
    const plan = PLANS[tier];
    const monthly = plan.monthlyPriceEnv ? process.env[plan.monthlyPriceEnv] : undefined;
    const annual = plan.annualPriceEnv ? process.env[plan.annualPriceEnv] : undefined;
    if (priceId === monthly || priceId === annual) return tier;
  }
  return null;
}
