import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { billingEnabled, getStripe, ensureCustomer } from '@/lib/billing';
import { PAYG, tierForPriceId } from '@/lib/plans';

export const runtime = 'nodejs';

const bodySchema = z.object({
  priceId: z.string().min(1),
  quantity: z.number().int().positive().max(100).optional(),
});

function origin(req: Request): string {
  return process.env.BETTER_AUTH_URL ?? new URL(req.url).origin;
}

export async function POST(req: Request): Promise<Response> {
  if (!billingEnabled()) {
    return NextResponse.json({ error: 'Billing is disabled.' }, { status: 404 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Billing is disabled.' }, { status: 404 });

  const session = await getSession(req.headers);
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { priceId, quantity } = parsed.data;

  // Allowlist: only our own configured plan or PAYG prices. Otherwise a caller
  // could open checkout against an arbitrary/test Stripe price.
  const isPayg = priceId === process.env[PAYG.priceEnv];
  if (!isPayg && tierForPriceId(priceId) === null) {
    return NextResponse.json({ error: 'Unknown price.' }, { status: 400 });
  }

  const customerId = await ensureCustomer(session.userId, null);
  const base = origin(req);

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isPayg ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: quantity ?? 1 }],
    success_url: `${base}/app/account?checkout=success`,
    cancel_url: `${base}/app/account?checkout=cancelled`,
    metadata: { ownerId: session.userId, kind: isPayg ? 'payg' : 'subscription' },
  });

  return NextResponse.json({ url: checkout.url });
}
