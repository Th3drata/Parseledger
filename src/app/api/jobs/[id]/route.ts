import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getJob, setJobStatement, deleteJob, recordCorrections, recordAuditEvent, type CorrectionEntry } from '@/lib/store';
import type { ExtractedStatement } from '@/types';
import { resolveOwner } from '@/lib/auth';

export const runtime = 'nodejs';

const transactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amountMinor: z.number().int(),
  balanceMinor: z.number().int().nullable(),
  confidence: z.number().min(0).max(1).optional(),
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
  balancesMissing: z.boolean().optional(),
  declaredTransactionCount: z.number().int().nullable().optional(),
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
  const existing = await getJob(id, ownerId);
  if (!existing) {
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

  // REV-7: record the row-level diff before persisting the new statement.
  if (existing.statement) {
    await recordCorrections(id, ownerId, ownerId, diffStatements(existing.statement, parsed.data.statement));
  }

  const job = await setJobStatement(id, parsed.data.statement, ownerId);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(job);
}

/** Field-level diff between two statements, by row index. */
function diffStatements(before: ExtractedStatement, after: ExtractedStatement): CorrectionEntry[] {
  const entries: CorrectionEntry[] = [];
  const max = Math.max(before.transactions.length, after.transactions.length);
  for (let i = 0; i < max; i++) {
    const a = before.transactions[i];
    const b = after.transactions[i];
    if (a && !b) {
      entries.push({ rowRef: i, field: 'row', oldValue: `${a.date} ${a.description} ${a.amountMinor}`, newValue: 'removed' });
      continue;
    }
    if (!a && b) {
      entries.push({ rowRef: i, field: 'row', oldValue: 'added', newValue: `${b.date} ${b.description} ${b.amountMinor}` });
      continue;
    }
    if (!a || !b) continue;
    if (a.date !== b.date) entries.push({ rowRef: i, field: 'date', oldValue: a.date, newValue: b.date });
    if (a.description !== b.description)
      entries.push({ rowRef: i, field: 'description', oldValue: a.description, newValue: b.description });
    if (a.amountMinor !== b.amountMinor)
      entries.push({ rowRef: i, field: 'amount', oldValue: String(a.amountMinor), newValue: String(b.amountMinor) });
    if (a.balanceMinor !== b.balanceMinor)
      entries.push({ rowRef: i, field: 'balance', oldValue: String(a.balanceMinor ?? ''), newValue: String(b.balanceMinor ?? '') });
  }
  if (before.openingBalanceMinor !== after.openingBalanceMinor)
    entries.push({ rowRef: null, field: 'openingBalance', oldValue: String(before.openingBalanceMinor), newValue: String(after.openingBalanceMinor) });
  if (before.closingBalanceMinor !== after.closingBalanceMinor)
    entries.push({ rowRef: null, field: 'closingBalance', oldValue: String(before.closingBalanceMinor), newValue: String(after.closingBalanceMinor) });
  return entries;
}

/** JOB-5: delete a single job, owner-scoped. */
export async function DELETE(req: Request, ctx: RouteContext): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { id } = await ctx.params;
  const deleted = await deleteJob(id, ownerId);
  if (!deleted) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  await recordAuditEvent(ownerId, null, 'job_deleted', { jobId: id });
  return NextResponse.json({ deleted: true });
}
