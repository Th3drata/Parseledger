import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, billingEnabled, upsertSubscription, addPaygPages } from '@/lib/billing';
import { tierForPriceId, PAYG } from '@/lib/plans';

export const runtime = 'nodejs';

/** Resolve our owner id from a Stripe customer's metadata. */
async function ownerIdFromCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  const ownerId = customer.metadata?.ownerId;
  return typeof ownerId === 'string' && ownerId !== '' ? ownerId : null;
}

async function applySubscription(stripe: Stripe, sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const ownerId = await ownerIdFromCustomer(stripe, customerId);
  if (!ownerId) return;

  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const tier = priceId ? tierForPriceId(priceId) : null;

  if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
    await upsertSubscription(ownerId, customerId, 'free', null);
    return;
  }

  const periodEndMs = item?.current_period_end != null ? item.current_period_end * 1000 : null;
  await upsertSubscription(ownerId, customerId, tier ?? 'free', periodEndMs);
}

export async function POST(req: Request): Promise<Response> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!billingEnabled() || !stripe || !secret) {
    return NextResponse.json({ error: 'Billing is disabled.' }, { status: 404 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const ownerId = session.metadata?.ownerId ?? null;

      if (session.mode === 'payment' && ownerId && customerId) {
        // PAYG top-up: 100 pages per purchased unit.
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const paygLine = lineItems.data.find((li) => li.price?.id === process.env[PAYG.priceEnv]);
        const units = paygLine?.quantity ?? 1;
        await addPaygPages(ownerId, customerId, units * PAYG.pagesPerUnit);
      } else if (session.mode === 'subscription' && typeof session.subscription === 'string') {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await applySubscription(stripe, sub);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await applySubscription(stripe, event.data.object);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
