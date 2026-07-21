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

export interface SocialProviders {
  google: boolean;
  apple: boolean;
}

/** Which third-party sign-in buttons the auth pages should render. */
export function enabledSocialProviders(): SocialProviders {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
  };
}

/** True when a real mailer is configured — email verification is enforced only then. */
export function mailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Transactional delivery: Resend when a key is configured, console otherwise
 * (links still work — copy them from the server logs in development).
 */
async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[auth] email to ${to} — ${subject}\n${text}`);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'Parseledger <no-reply@parseledger.co>',
      to: [to],
      subject,
      text,
    }),
  });
}

function buildAuth() {
  const pool = getPool();
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!pool || !secret) return null;

  const baseURL = process.env.BETTER_AUTH_URL;
  const onProdDomain = Boolean(baseURL?.includes('parseledger.co'));

  // Third-party sign-in — each provider activates when its credentials exist.
  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    socialProviders.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    database: pool,
    secret,
    baseURL,
    // Persisted in Postgres — the default in-memory limiter resets on every
    // serverless cold start, so it never actually throttles. Tight windows on
    // the endpoints worth abusing: credential brute force and email bombing.
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 5 },
        '/send-verification-email': { window: 300, max: 3 },
        '/request-password-reset': { window: 300, max: 3 },
        '/forget-password': { window: 300, max: 3 },
        '/reset-password': { window: 300, max: 5 },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Verification is enforced only when a real mailer exists — otherwise
      // nobody could ever sign in.
      requireEmailVerification: mailerConfigured(),
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(
          user.email,
          'Reset your Parseledger password',
          `Someone requested a password reset for your Parseledger account.\n\nReset it here (link expires in 1 hour):\n${url}\n\nIf this wasn't you, ignore this email — nothing changes.`,
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(
          user.email,
          'Verify your Parseledger email',
          `Welcome to Parseledger.\n\nConfirm this email address to activate your account:\n${url}\n\nIf you didn't create this account, ignore this email.`,
        );
      },
    },
    account: {
      // Same email via Google/Apple links to the existing account instead of
      // erroring — the classic "I signed up with email first" papercut.
      accountLinking: { enabled: true, trustedProviders: ['google', 'apple'] },
    },
    user: {
      deleteUser: {
        enabled: true,
        // The privacy promise: deleting the account deletes the data.
        afterDelete: async (user) => {
          const p = getPool();
          if (!p) return;
          // audit_events.job_id is ON DELETE SET NULL, so these rows outlive the
          // job delete — purge by owner explicitly, or personal data survives
          // "delete everything". corrections cascade via jobs, deleted by owner
          // too as a belt-and-suspenders against any orphan.
          await p.query('delete from jobs where owner_id = $1', [user.id]);
          await p.query('delete from audit_events where owner_id = $1', [user.id]);
          await p.query('delete from corrections where owner_id = $1', [user.id]);
          await p.query('delete from usage_events where owner_id = $1', [user.id]);
          await p.query('delete from clients where owner_id = $1', [user.id]);
          await p.query('delete from subscriptions where owner_id = $1', [user.id]);
        },
      },
    },
    socialProviders,
    trustedOrigins: [
      'https://parseledger.co',
      'https://www.parseledger.co',
      'https://app.parseledger.co',
    ],
    advanced: onProdDomain
      ? {
          // One session across apex + app subdomain.
          crossSubDomainCookies: { enabled: true, domain: '.parseledger.co' },
        }
      : {},
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

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
}

/** Signed-in user's profile for the app chrome, or null. */
export async function getUserFromContext(): Promise<SessionUser | null> {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: await contextHeaders() });
  if (!session) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    emailVerified: session.user.emailVerified,
    createdAt: session.user.createdAt,
  };
}

export interface ActiveSession {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent: string | null;
  current: boolean;
}

/** All active sessions for the signed-in user (for Settings → Security). */
export async function listSessionsFromContext(): Promise<ActiveSession[]> {
  const auth = getAuth();
  if (!auth) return [];
  const headers = await contextHeaders();
  const current = await auth.api.getSession({ headers });
  if (!current) return [];
  const sessions = await auth.api.listSessions({ headers });
  return sessions.map((s) => ({
    token: s.token,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    userAgent: s.userAgent ?? null,
    current: s.token === current.session.token,
  }));
}
