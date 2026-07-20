import { randomUUID } from 'node:crypto';
import type { ExtractedStatement, VerificationResult } from '@/types';
import { reconcileStatement } from '@/verification';

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

// ponytail: in-memory store (survives dev HMR via globalThis); M3 swaps the
// internals for Postgres behind these same five functions.
const g = globalThis as typeof globalThis & { __plJobs?: Map<string, Job> };
const jobs: Map<string, Job> = (g.__plJobs ??= new Map());

export function createJob(fileName: string): Job {
  const job: Job = {
    id: randomUUID(),
    fileName,
    status: 'processing',
    statement: null,
    result: null,
    error: null,
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | null {
  return jobs.get(id) ?? null;
}

export function listJobs(): Job[] {
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/** Attach an extracted statement; reconciliation is recomputed here, always. */
export function setJobStatement(id: string, statement: ExtractedStatement): Job | null {
  const job = jobs.get(id);
  if (!job) return null;
  job.statement = statement;
  job.result = reconcileStatement(statement);
  job.status = 'review';
  return job;
}

export function setJobFailed(id: string, error: string): Job | null {
  const job = jobs.get(id);
  if (!job) return null;
  job.status = 'failed';
  job.error = error;
  return job;
}

export function setJobExported(id: string): Job | null {
  const job = jobs.get(id);
  if (!job) return null;
  job.status = 'exported';
  return job;
}
