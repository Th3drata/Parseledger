import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getJob, setJobStatement } from '@/lib/store';
import { resolveOwner } from '@/lib/auth';

export const runtime = 'nodejs';

const transactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amountMinor: z.number().int(),
  balanceMinor: z.number().int().nullable(),
});

const statementSchema = z.object({
  bankName: z.string(),
  accountHolder: z.string().nullable(),
  accountNumber: z.string().nullable(),
  currency: z.string(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  openingBalanceMinor: z.number().int(),
  closingBalanceMinor: z.number().int(),
  transactions: z.array(transactionSchema),
});

const patchSchema = z.object({ statement: statementSchema });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { id } = await ctx.params;
  const job = await getJob(id, ownerId);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: Request, ctx: RouteContext): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await getJob(id, ownerId))) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid statement.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const job = await setJobStatement(id, parsed.data.statement, ownerId);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(job);
}
