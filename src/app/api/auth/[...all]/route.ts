import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';

export const runtime = 'nodejs';

const auth = getAuth();

const disabled = (): Response =>
  new Response(JSON.stringify({ error: 'Auth is disabled in local mode.' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });

const handlers = auth
  ? toNextJsHandler(auth)
  : { GET: (): Response => disabled(), POST: (): Response => disabled() };

export const GET = handlers.GET;
export const POST = handlers.POST;
