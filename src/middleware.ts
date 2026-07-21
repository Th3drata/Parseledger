import { NextRequest, NextResponse } from 'next/server';

/**
 * Host-based routing: app.parseledger.co serves the product at its root.
 *   app.parseledger.co/            → /app (workspace)
 *   app.parseledger.co/jobs/123    → /app/jobs/123
 * Auth pages, API routes and already-prefixed /app paths pass through, so
 * every internal link keeps working on both hosts. The apex domain serves
 * the marketing site untouched.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  if (!host.startsWith('app.')) return NextResponse.next();

  const url = req.nextUrl.clone();
  const passthrough =
    url.pathname.startsWith('/app') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/signin') ||
    url.pathname.startsWith('/signup');
  if (passthrough) return NextResponse.next();

  url.pathname = url.pathname === '/' ? '/app' : `/app${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip static assets and Next internals.
  matcher: ['/((?!_next/|.*\\..*).*)'],
};
