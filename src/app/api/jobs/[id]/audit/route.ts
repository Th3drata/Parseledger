import { NextResponse } from 'next/server';
import { getAuditTrail } from '@/lib/store';
import { resolveOwner } from '@/lib/auth';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** REV-7: the job's history — corrections and export events, newest first. */
export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { id } = await ctx.params;
  const trail = await getAuditTrail(id, ownerId);
  if (!trail) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  return NextResponse.json(trail);
}
