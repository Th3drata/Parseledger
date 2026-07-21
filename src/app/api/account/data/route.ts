import { NextResponse } from 'next/server';
import { resolveOwner } from '@/lib/auth';
import { deleteAllJobs } from '@/lib/store';

export const runtime = 'nodejs';

/** The privacy promise: wipe every statement in the caller's workspace. */
export async function DELETE(req: Request): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (!ownerId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const deletedJobs = await deleteAllJobs(ownerId);
  return NextResponse.json({ deletedJobs });
}
