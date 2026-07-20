import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getJob, setJobStatement } from '@/lib/store';

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

export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  if (!getJob(id)) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

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

  const job = setJobStatement(id, parsed.data.statement);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(job);
}
