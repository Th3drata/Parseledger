import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers as nextHeaders } from 'next/headers';
import { getPool } from './db';

/**
 * Auth is only active when BOTH a secret and a database are configured. With
 * zero env vars the app runs in local mode: getSession returns null and every
 * owner resolves to 'local'.
 */
export function authEnabled(): boolean {
  return Boolean(process.env.BETTER_AUTH_SECRET) && getPool() !== null;
}

function buildAuth() {
  const pool = getPool();
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!pool || !secret) return null;

  return betterAuth({
    database: pool,
    secret,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    // Passkeys intentionally omitted — the passkey plugin ships separately and
    // is not installed. Email + password only.
    plugins: [nextCookies()],
  });
}

type Auth = NonNullable<ReturnType<typeof buildAuth>>;

const g = globalThis as typeof globalThis & { __plAuth?: Auth | null };

export function getAuth(): Auth | null {
  const cached = g.__plAuth;
  if (cached !== undefined) return cached;
  const built = buildAuth();
  g.__plAuth = built;
  return built;
}

/** Returns the signed-in user id, or null when auth is disabled or no session. */
export async function getSession(headers: Headers): Promise<{ userId: string } | null> {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  return { userId: session.user.id };
}

/**
 * Resolve the owner for a request.
 * - auth disabled            → 'local'
 * - auth enabled, signed in  → the user id
 * - auth enabled, no session → null (caller should reject with 401)
 */
export async function resolveOwner(headers: Headers): Promise<string | null> {
  if (!authEnabled()) return 'local';
  const session = await getSession(headers);
  return session?.userId ?? null;
}

/** A mutable Headers copy of the incoming request headers (for server components). */
async function contextHeaders(): Promise<Headers> {
  const readonly = await nextHeaders();
  const copy = new Headers();
  readonly.forEach((value, key) => copy.append(key, value));
  return copy;
}

/** resolveOwner for server components / layouts (reads next/headers). */
export async function resolveOwnerFromContext(): Promise<string | null> {
  return resolveOwner(await contextHeaders());
}

/** getSession for server components / layouts (reads next/headers). */
export async function getSessionFromContext(): Promise<{ userId: string } | null> {
  return getSession(await contextHeaders());
}

/** Signed-in user's id + email for the app chrome, or null. */
export async function getUserFromContext(): Promise<{ userId: string; email: string } | null> {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: await contextHeaders() });
  if (!session) return null;
  return { userId: session.user.id, email: session.user.email };
}
