import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { billingEnabled, getStripe, getSubscription } from '@/lib/billing';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  if (!billingEnabled()) {
    return NextResponse.json({ error: 'Billing is disabled.' }, { status: 404 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Billing is disabled.' }, { status: 404 });

  const session = await getSession(req.headers);
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const sub = await getSubscription(session.userId);
  if (!sub.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account yet.' }, { status: 400 });
  }

  const base = process.env.BETTER_AUTH_URL ?? new URL(req.url).origin;
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${base}/app/account`,
  });

  return NextResponse.json({ url: portal.url });
}
