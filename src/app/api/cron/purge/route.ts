import { NextResponse } from 'next/server';
import { purgeExpiredJobs } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * Auto-purge jobs past their 24h delete_after deadline (the privacy promise).
 * Protect with CRON_SECRET when set: send `Authorization: Bearer <secret>` or
 * `?secret=<secret>`. In local (in-memory) mode this prunes the Map instead.
 */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const header = req.headers.get('authorization');
    const provided = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : url.searchParams.get('secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const purged = await purgeExpiredJobs();
  return NextResponse.json({ purged });
}
