import Stripe from 'stripe';
import { getPool } from './db';
import { authEnabled } from './auth';
import { PLANS, type Tier } from './plans';

/** Billing is active only when a Stripe key AND real auth are configured. */
export function billingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY) && authEnabled();
}

const g = globalThis as typeof globalThis & { __plStripe?: Stripe | null };

export function getStripe(): Stripe | null {
  if (g.__plStripe !== undefined) return g.__plStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  g.__plStripe = key ? new Stripe(key) : null;
  return g.__plStripe;
}

export interface Subscription {
  ownerId: string;
  stripeCustomerId: string | null;
  tier: Tier;
  paygPagesBalance: number;
  currentPeriodEnd: number | null;
}

const FREE = (ownerId: string): Subscription => ({
  ownerId,
  stripeCustomerId: null,
  tier: 'free',
  paygPagesBalance: 0,
  currentPeriodEnd: null,
});

export async function getSubscription(ownerId: string): Promise<Subscription> {
  const pool = getPool();
  if (!pool) return FREE(ownerId);

  interface Row {
    stripe_customer_id: string;
    tier: Tier;
    payg_pages_balance: number;
    period_end_ms: string | null;
  }
  const res = await pool.query<Row>(
    `select stripe_customer_id, tier, payg_pages_balance,
            (extract(epoch from current_period_end) * 1000)::bigint as period_end_ms
     from subscriptions where owner_id = $1`,
    [ownerId],
  );
  const row = res.rows[0];
  if (!row) return FREE(ownerId);
  return {
    ownerId,
    stripeCustomerId: row.stripe_customer_id,
    tier: row.tier,
    paygPagesBalance: row.payg_pages_balance,
    currentPeriodEnd: row.period_end_ms === null ? null : Number(row.period_end_ms),
  };
}

/** Ensure a subscriptions row exists with a Stripe customer id; returns it. */
export async function ensureCustomer(ownerId: string, email: string | null): Promise<string> {
  const pool = getPool();
  const stripe = getStripe();
  if (!pool || !stripe) throw new Error('Billing is not configured.');

  const existing = await getSubscription(ownerId);
  if (existing.stripeCustomerId) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { ownerId },
  });
  await pool.query(
    `insert into subscriptions (owner_id, stripe_customer_id, tier)
     values ($1, $2, 'free')
     on conflict (owner_id)
       do update set stripe_customer_id = excluded.stripe_customer_id, updated_at = now()`,
    [ownerId, customer.id],
  );
  return customer.id;
}

export async function upsertSubscription(
  ownerId: string,
  stripeCustomerId: string,
  tier: Tier,
  currentPeriodEndMs: number | null,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  const periodEnd = currentPeriodEndMs === null ? null : new Date(currentPeriodEndMs).toISOString();
  await pool.query(
    `insert into subscriptions (owner_id, stripe_customer_id, tier, current_period_end, updated_at)
     values ($1, $2, $3, $4, now())
     on conflict (owner_id) do update
       set stripe_customer_id = excluded.stripe_customer_id,
           tier = excluded.tier,
           current_period_end = excluded.current_period_end,
           updated_at = now()`,
    [ownerId, stripeCustomerId, tier, periodEnd],
  );
}

/** Add non-expiring PAYG pages to an owner's balance (creates the row if absent). */
export async function addPaygPages(
  ownerId: string,
  stripeCustomerId: string,
  pages: number,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `insert into subscriptions (owner_id, stripe_customer_id, payg_pages_balance)
     values ($1, $2, $3)
     on conflict (owner_id) do update
       set payg_pages_balance = subscriptions.payg_pages_balance + excluded.payg_pages_balance,
           stripe_customer_id = excluded.stripe_customer_id,
           updated_at = now()`,
    [ownerId, stripeCustomerId, pages],
  );
}

/**
 * Attempt to consume `pages` from the PAYG balance atomically.
 * Returns true if the balance covered it (and was decremented), else false.
 */
export async function consumePaygPages(ownerId: string, pages: number): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const res = await pool.query<{ owner_id: string }>(
    `update subscriptions
       set payg_pages_balance = payg_pages_balance - $2, updated_at = now()
     where owner_id = $1 and payg_pages_balance >= $2
     returning owner_id`,
    [ownerId, pages],
  );
  return Boolean(res.rows[0]);
}

/** Return previously consumed PAYG pages (e.g. when extraction fails after the draw). */
export async function refundPaygPages(ownerId: string, pages: number): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `update subscriptions
       set payg_pages_balance = payg_pages_balance + $2, updated_at = now()
     where owner_id = $1`,
    [ownerId, pages],
  );
}

export function planLimitFor(tier: Tier): number {
  return PLANS[tier].monthlyPages;
}
