import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { purgeExpiredJobs } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * Auto-purge jobs past their 24h delete_after deadline (the privacy promise).
 * Protect with CRON_SECRET when set: send `Authorization: Bearer <secret>`.
 * Header-only (query strings end up in access logs), constant-time compare.
 * In local (in-memory) mode this prunes the Map instead.
 */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  // Fail closed: on a real (DB-backed) deployment, refuse to run unprotected.
  // Only the local in-memory mode (no DATABASE_URL) may purge without a secret.
  if (!secret) {
    if (process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Purge endpoint not configured.' }, { status: 503 });
    }
  } else {
    const header = req.headers.get('authorization');
    const provided = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const purged = await purgeExpiredJobs();
  return NextResponse.json({ purged });
}
