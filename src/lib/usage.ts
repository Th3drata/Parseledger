import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { getPool } from './db';

const execFileAsync = promisify(execFile);

/**
 * Count the billable pages in an upload.
 *
 * PDFs: prefer the `pdfinfo` binary (Poppler) when present; otherwise fall back
 * to counting page objects in the raw bytes. Images are always one page.
 */
export async function countPages(bytes: Uint8Array, mimeType: string): Promise<number> {
  if (mimeType !== 'application/pdf') return 1;

  const viaPdfinfo = await countPdfPagesViaPdfinfo(bytes);
  if (viaPdfinfo !== null) return viaPdfinfo;

  return countPdfPagesFromBytes(bytes);
}

async function countPdfPagesViaPdfinfo(bytes: Uint8Array): Promise<number | null> {
  const tmpPath = join(tmpdir(), `parseledger-pages-${randomUUID()}.pdf`);
  try {
    await writeFile(tmpPath, bytes);
    const { stdout } = await execFileAsync('pdfinfo', [tmpPath], {
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
    });
    const match = /^Pages:\s+(\d+)/m.exec(stdout);
    if (!match || match[1] === undefined) return null;
    const pages = Number.parseInt(match[1], 10);
    return Number.isFinite(pages) && pages > 0 ? pages : null;
  } catch {
    // pdfinfo missing, not on PATH, or failed to parse — use the fallback.
    return null;
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }
}

/** Fallback: /Type /Page occurrences minus /Type /Pages tree nodes, floored at 1. */
function countPdfPagesFromBytes(bytes: Uint8Array): number {
  const text = Buffer.from(bytes).toString('latin1');
  const pageNodes = (text.match(/\/Type\s*\/Pages\b/g) ?? []).length;
  const allPage = (text.match(/\/Type\s*\/Page\b/g) ?? []).length;
  const pages = allPage - pageNodes;
  return pages > 0 ? pages : 1;
}

/** Record a usage event (DB mode only). No-op in local mode. */
export async function recordUsage(ownerId: string, jobId: string, pages: number): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `insert into usage_events (owner_id, job_id, pages) values ($1, $2, $3)`,
    [ownerId, jobId, pages],
  );
}

/** Pages consumed by an owner in the current calendar month (DB mode). */
export async function getUsage(ownerId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  const res = await pool.query<{ total: string | null }>(
    `select coalesce(sum(pages), 0) as total
     from usage_events
     where owner_id = $1 and created_at >= date_trunc('month', now())`,
    [ownerId],
  );
  return Number(res.rows[0]?.total ?? 0);
}
