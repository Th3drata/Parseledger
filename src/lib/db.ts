import { Pool } from 'pg';

/**
 * Lazy singleton Postgres pool. Returns null when DATABASE_URL is absent, which
 * is the signal the rest of the app uses to stay in local / in-memory mode.
 *
 * The pool is stashed on globalThis so it survives Next.js dev HMR (which would
 * otherwise leak a new pool on every reload).
 */
const g = globalThis as typeof globalThis & { __plPool?: Pool | null };

export function getPool(): Pool | null {
  if (g.__plPool !== undefined) return g.__plPool;

  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === '') {
    g.__plPool = null;
    return null;
  }

  const local = url.includes('localhost') || url.includes('127.0.0.1');
  const sslDisabled = url.includes('sslmode=disable');
  const pool = new Pool({
    connectionString: url,
    ssl: local || sslDisabled ? undefined : { rejectUnauthorized: false },
  });
  g.__plPool = pool;
  return pool;
}
