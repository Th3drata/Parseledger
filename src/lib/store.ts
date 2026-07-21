import { randomUUID } from 'node:crypto';
import type { ExtractedStatement, ExtractedTransaction, VerificationResult } from '@/types';
import { reconcileStatement } from '@/verification';
import { getPool } from './db';

export type JobStatus = 'processing' | 'review' | 'exported' | 'failed';

export interface Job {
  id: string;
  fileName: string;
  status: JobStatus;
  statement: ExtractedStatement | null;
  result: VerificationResult | null;
  error: string | null;
  createdAt: number;
}

// The store keeps the same five functions across two backends: an in-memory
// Map (local mode, no DATABASE_URL) and Postgres. All reads are owner-scoped;
// in local mode the owner is always 'local'.
//
// NOTE: the jobs table has no error column, so in DB mode the failure message
// is not persisted — a failed job reloads with error === null. Local mode keeps
// the message in memory.

const HOLD_MS = 24 * 60 * 60 * 1000;

interface StoredJob extends Job {
  ownerId: string;
  deleteAfter: number;
}

const g = globalThis as typeof globalThis & { __plJobs?: Map<string, StoredJob> };
const mem: Map<string, StoredJob> = (g.__plJobs ??= new Map());

function toPublic(job: StoredJob): Job {
  return {
    id: job.id,
    fileName: job.fileName,
    status: job.status,
    statement: job.statement,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createJob(
  fileName: string,
  ownerId: string,
  pageCount = 0,
): Promise<Job> {
  const pool = getPool();
  if (!pool) {
    const now = Date.now();
    const job: StoredJob = {
      id: randomUUID(),
      fileName,
      status: 'processing',
      statement: null,
      result: null,
      error: null,
      createdAt: now,
      ownerId,
      deleteAfter: now + HOLD_MS,
    };
    mem.set(job.id, job);
    return toPublic(job);
  }

  const res = await pool.query<{ id: string; created_ms: string }>(
    `insert into jobs (owner_id, status, file_name, storage_path, page_count, delete_after)
     values ($1, 'processing', $2, '', $3, now() + interval '24 hours')
     returning id, (extract(epoch from created_at) * 1000)::bigint as created_ms`,
    [ownerId, fileName, pageCount],
  );
  const row = res.rows[0];
  if (!row) throw new Error('Failed to create job.');
  return {
    id: row.id,
    fileName,
    status: 'processing',
    statement: null,
    result: null,
    error: null,
    createdAt: Number(row.created_ms),
  };
}

export async function getJob(id: string, ownerId: string): Promise<Job | null> {
  const pool = getPool();
  if (!pool) {
    const job = mem.get(id);
    if (!job || job.ownerId !== ownerId) return null;
    return toPublic(job);
  }

  interface JobRow {
    id: string;
    status: JobStatus;
    file_name: string;
    created_ms: string;
  }
  let res;
  try {
    res = await pool.query<JobRow>(
      `select id, status, file_name, (extract(epoch from created_at) * 1000)::bigint as created_ms
       from jobs where id = $1 and owner_id = $2`,
      [id, ownerId],
    );
  } catch {
    // Malformed uuid or similar — treat as not found.
    return null;
  }
  const row = res.rows[0];
  if (!row) return null;

  const statement = await loadStatement(pool, row.id);
  return {
    id: row.id,
    fileName: row.file_name,
    status: row.status,
    statement,
    result: statement ? reconcileStatement(statement) : null,
    error: null,
    createdAt: Number(row.created_ms),
  };
}

export async function listJobs(ownerId: string): Promise<Job[]> {
  const pool = getPool();
  if (!pool) {
    return [...mem.values()]
      .filter((j) => j.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(toPublic);
  }

  interface JobRow {
    id: string;
    status: JobStatus;
    file_name: string;
    created_ms: string;
  }
  const res = await pool.query<JobRow>(
    `select id, status, file_name, (extract(epoch from created_at) * 1000)::bigint as created_ms
     from jobs where owner_id = $1 order by created_at desc`,
    [ownerId],
  );

  const jobs: Job[] = [];
  for (const row of res.rows) {
    const statement = await loadStatement(pool, row.id);
    jobs.push({
      id: row.id,
      fileName: row.file_name,
      status: row.status,
      statement,
      result: statement ? reconcileStatement(statement) : null,
      error: null,
      createdAt: Number(row.created_ms),
    });
  }
  return jobs;
}

/** Attach an extracted statement; reconciliation is recomputed here, always. */
export async function setJobStatement(
  id: string,
  statement: ExtractedStatement,
  ownerId: string,
): Promise<Job | null> {
  const result = reconcileStatement(statement);
  const pool = getPool();

  if (!pool) {
    const job = mem.get(id);
    if (!job || job.ownerId !== ownerId) return null;
    job.statement = statement;
    job.result = result;
    job.status = 'review';
    return toPublic(job);
  }

  const owns = await pool.query<{ id: string }>(
    `select id from jobs where id = $1 and owner_id = $2`,
    [id, ownerId],
  );
  if (!owns.rows[0]) return null;

  const client = await pool.connect();
  try {
    await client.query('begin');
    // Replace any prior statement (cascades to transactions + issues).
    await client.query(`delete from statements where job_id = $1`, [id]);
    const stmtRes = await client.query<{ id: string }>(
      `insert into statements
         (job_id, bank_name, account_holder, account_number, currency,
          period_start, period_end, opening_balance_minor, closing_balance_minor, verified,
          balances_missing, declared_transaction_count)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       returning id`,
      [
        id,
        statement.bankName,
        statement.accountHolder,
        statement.accountNumber,
        statement.currency,
        statement.periodStart,
        statement.periodEnd,
        statement.openingBalanceMinor,
        statement.closingBalanceMinor,
        result.verified,
        statement.balancesMissing === true,
        statement.declaredTransactionCount ?? null,
      ],
    );
    const statementId = stmtRes.rows[0]?.id;
    if (!statementId) throw new Error('Failed to insert statement.');

    for (const [i, tx] of statement.transactions.entries()) {
      await client.query(
        `insert into transactions
           (statement_id, row_index, tx_date, description, amount_minor, balance_minor, confidence)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [statementId, i, tx.date, tx.description, tx.amountMinor, tx.balanceMinor, tx.confidence ?? null],
      );
    }

    for (const issue of result.issues) {
      await client.query(
        `insert into verification_issues
           (statement_id, code, row_index, message, expected_minor, actual_minor)
         values ($1, $2, $3, $4, $5, $6)`,
        [statementId, issue.code, issue.rowIndex, issue.message, issue.expectedMinor, issue.actualMinor],
      );
    }

    await client.query(`update jobs set status = 'review' where id = $1`, [id]);
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }

  return getJob(id, ownerId);
}

export async function setJobFailed(
  id: string,
  error: string,
  ownerId: string,
): Promise<Job | null> {
  const pool = getPool();
  if (!pool) {
    const job = mem.get(id);
    if (!job || job.ownerId !== ownerId) return null;
    job.status = 'failed';
    job.error = error;
    return toPublic(job);
  }

  const res = await pool.query<{ id: string }>(
    `update jobs set status = 'failed' where id = $1 and owner_id = $2 returning id`,
    [id, ownerId],
  );
  if (!res.rows[0]) return null;
  return getJob(id, ownerId);
}

export async function setJobExported(id: string, ownerId: string): Promise<Job | null> {
  const pool = getPool();
  if (!pool) {
    const job = mem.get(id);
    if (!job || job.ownerId !== ownerId) return null;
    job.status = 'exported';
    return toPublic(job);
  }

  const res = await pool.query<{ id: string }>(
    `update jobs set status = 'exported' where id = $1 and owner_id = $2 returning id`,
    [id, ownerId],
  );
  if (!res.rows[0]) return null;
  return getJob(id, ownerId);
}

/**
 * Purge jobs past their delete_after deadline. Returns the number removed.
 * DB mode cascades to statements/transactions/issues via FK on delete.
 */
export interface CorrectionEntry {
  rowRef: number | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface AuditTrail {
  corrections: Array<CorrectionEntry & { actor: string; at: number }>;
  events: Array<{ kind: string; detail: Record<string, unknown>; at: number }>;
}

interface MemAudit {
  corrections: Map<string, Array<CorrectionEntry & { actor: string; at: number }>>;
  events: Map<string, Array<{ kind: string; detail: Record<string, unknown>; at: number }>>;
}
const ga = globalThis as typeof globalThis & { __plAudit?: MemAudit };
const memAudit: MemAudit = (ga.__plAudit ??= { corrections: new Map(), events: new Map() });

/** REV-7: every manual change is recorded — who, when, field, before/after. */
export async function recordCorrections(
  jobId: string,
  ownerId: string,
  actor: string,
  entries: CorrectionEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const pool = getPool();
  if (!pool) {
    const list = memAudit.corrections.get(jobId) ?? [];
    for (const e of entries) list.push({ ...e, actor, at: Date.now() });
    memAudit.corrections.set(jobId, list);
    return;
  }
  for (const e of entries) {
    await pool.query(
      `insert into corrections (job_id, owner_id, actor, row_ref, field, old_value, new_value)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [jobId, ownerId, actor, e.rowRef, e.field, e.oldValue, e.newValue],
    );
  }
}

/** SEC-5: exports, unverified confirmations and deletions leave a trace. */
export async function recordAuditEvent(
  ownerId: string,
  jobId: string | null,
  kind: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const pool = getPool();
  if (!pool) {
    const key = jobId ?? '_global';
    const list = memAudit.events.get(key) ?? [];
    list.push({ kind, detail, at: Date.now() });
    memAudit.events.set(key, list);
    return;
  }
  await pool.query(
    `insert into audit_events (owner_id, job_id, kind, detail) values ($1, $2, $3, $4)`,
    [ownerId, jobId, kind, JSON.stringify(detail)],
  );
}

/** The job's history — corrections and events, newest first. */
export async function getAuditTrail(jobId: string, ownerId: string): Promise<AuditTrail | null> {
  const pool = getPool();
  if (!pool) {
    const job = mem.get(jobId);
    if (!job || job.ownerId !== ownerId) return null;
    return {
      corrections: [...(memAudit.corrections.get(jobId) ?? [])].reverse(),
      events: [...(memAudit.events.get(jobId) ?? [])].reverse(),
    };
  }
  const owns = await pool.query(`select id from jobs where id = $1 and owner_id = $2`, [jobId, ownerId]);
  if (!owns.rows[0]) return null;
  const corr = await pool.query<{
    actor: string;
    row_ref: number | null;
    field: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
  }>(
    `select actor, row_ref, field, old_value, new_value, created_at
     from corrections where job_id = $1 order by created_at desc limit 200`,
    [jobId],
  );
  const events = await pool.query<{ kind: string; detail: Record<string, unknown>; created_at: string }>(
    `select kind, detail, created_at from audit_events where job_id = $1 order by created_at desc limit 200`,
    [jobId],
  );
  return {
    corrections: corr.rows.map((r) => ({
      rowRef: r.row_ref,
      field: r.field,
      oldValue: r.old_value,
      newValue: r.new_value,
      actor: r.actor,
      at: new Date(r.created_at).getTime(),
    })),
    events: events.rows.map((r) => ({
      kind: r.kind,
      detail: r.detail,
      at: new Date(r.created_at).getTime(),
    })),
  };
}

/** JOB-5: delete a single job (cascades to statement/transactions/issues/corrections). */
export async function deleteJob(id: string, ownerId: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    const job = mem.get(id);
    if (!job || job.ownerId !== ownerId) return false;
    mem.delete(id);
    memAudit.corrections.delete(id);
    memAudit.events.delete(id);
    return true;
  }
  const res = await pool.query(`delete from jobs where id = $1 and owner_id = $2`, [id, ownerId]);
  return (res.rowCount ?? 0) > 0;
}

/** Wipe every job for an owner (Settings → Data & privacy). Returns count. */
export async function deleteAllJobs(ownerId: string): Promise<number> {
  const pool = getPool();
  if (!pool) {
    let removed = 0;
    for (const [id, job] of mem) {
      if (job.ownerId === ownerId) {
        mem.delete(id);
        removed += 1;
      }
    }
    return removed;
  }
  const res = await pool.query(`delete from jobs where owner_id = $1`, [ownerId]);
  await pool.query(`delete from usage_events where owner_id = $1`, [ownerId]);
  return res.rowCount ?? 0;
}

export async function purgeExpiredJobs(): Promise<number> {
  const pool = getPool();
  if (!pool) {
    const now = Date.now();
    let removed = 0;
    for (const [id, job] of mem) {
      if (job.deleteAfter <= now) {
        mem.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  const res = await pool.query(`delete from jobs where delete_after <= now()`);
  return res.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

type Queryable = Pick<NonNullable<ReturnType<typeof getPool>>, 'query'>;

async function loadStatement(pool: Queryable, jobId: string): Promise<ExtractedStatement | null> {
  interface StmtRow {
    id: string;
    bank_name: string;
    account_holder: string | null;
    account_number: string | null;
    currency: string;
    period_start: string | null;
    period_end: string | null;
    opening_balance_minor: string;
    closing_balance_minor: string;
    balances_missing: boolean;
    declared_transaction_count: number | null;
  }
  const res = await pool.query<StmtRow>(
    `select id, bank_name, account_holder, account_number, currency,
            to_char(period_start, 'YYYY-MM-DD') as period_start,
            to_char(period_end, 'YYYY-MM-DD') as period_end,
            opening_balance_minor, closing_balance_minor,
            balances_missing, declared_transaction_count
     from statements where job_id = $1`,
    [jobId],
  );
  const s = res.rows[0];
  if (!s) return null;

  interface TxRow {
    tx_date: string;
    description: string;
    amount_minor: string;
    balance_minor: string | null;
    confidence: number | null;
  }
  const txRes = await pool.query<TxRow>(
    `select to_char(tx_date, 'YYYY-MM-DD') as tx_date, description, amount_minor, balance_minor, confidence
     from transactions where statement_id = $1 order by row_index`,
    [s.id],
  );
  const transactions: ExtractedTransaction[] = txRes.rows.map((t) => ({
    date: t.tx_date,
    description: t.description,
    amountMinor: Number(t.amount_minor),
    balanceMinor: t.balance_minor === null ? null : Number(t.balance_minor),
    ...(t.confidence === null ? {} : { confidence: t.confidence }),
  }));

  return {
    bankName: s.bank_name,
    accountHolder: s.account_holder,
    accountNumber: s.account_number,
    currency: s.currency,
    periodStart: s.period_start,
    periodEnd: s.period_end,
    openingBalanceMinor: Number(s.opening_balance_minor),
    closingBalanceMinor: Number(s.closing_balance_minor),
    balancesMissing: s.balances_missing || undefined,
    declaredTransactionCount: s.declared_transaction_count,
    transactions,
  };
}
