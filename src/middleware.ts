import { NextRequest, NextResponse } from 'next/server';

/**
 * Host-based routing: app.parseledger.co serves the product at its root.
 *   app.parseledger.co/            → /app (workspace)
 *   app.parseledger.co/jobs/123    → /app/jobs/123
 * Auth pages, API routes and already-prefixed /app paths pass through, so
 * every internal link keeps working on both hosts. The apex domain serves
 * the marketing site untouched.
 *
 * On top of the rewrite, a cheap cookie gate: hitting a workspace path with
 * no session cookie bounces to /signin?next=… so people land back where they
 * were headed after signing in. This is UX-speed only — real enforcement
 * stays in the server components, which validate the session properly.
 */
const AUTH_PAGES = ['/signin', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

// Mirrors authEnabled() without importing the server auth stack into middleware.
const authOn = Boolean(process.env.BETTER_AUTH_SECRET && process.env.DATABASE_URL);

function hasSessionCookie(req: NextRequest): boolean {
  if (!authOn) return true; // local mode: no accounts, nothing to gate
  return Boolean(
    req.cookies.get('better-auth.session_token') ??
      req.cookies.get('__Secure-better-auth.session_token'),
  );
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const url = req.nextUrl.clone();

  if (!host.startsWith('app.')) {
    // Apex: only guard direct /app/... hits.
    if (url.pathname.startsWith('/app') && !hasSessionCookie(req)) {
      const signin = url.clone();
      signin.pathname = '/signin';
      signin.search = url.pathname === '/app' ? '' : `?next=${encodeURIComponent(url.pathname)}`;
      return NextResponse.redirect(signin);
    }
    return NextResponse.next();
  }

  const passthrough =
    url.pathname.startsWith('/app') ||
    url.pathname.startsWith('/api') ||
    AUTH_PAGES.some((p) => url.pathname.startsWith(p));

  const workspacePath = url.pathname.startsWith('/app')
    ? url.pathname
    : url.pathname === '/'
      ? '/app'
      : `/app${url.pathname}`;

  if (!passthrough || url.pathname.startsWith('/app')) {
    if (!hasSessionCookie(req)) {
      const signin = url.clone();
      signin.pathname = '/signin';
      signin.search = workspacePath === '/app' ? '' : `?next=${encodeURIComponent(workspacePath)}`;
      return NextResponse.redirect(signin);
    }
  }

  if (passthrough) return NextResponse.next();

  url.pathname = workspacePath;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip static assets and Next internals.
  matcher: ['/((?!_next/|.*\\..*).*)'],
};
