import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createJob, listJobs, setJobStatement, setJobFailed, getJob } from '@/lib/store';
import { AnthropicExtractionProvider } from '@/extraction';
import { demoStatementWithError } from '@/lib/demo';
import { resolveOwner } from '@/lib/auth';
import { billingEnabled, getSubscription, planLimitFor, consumePaygPages, refundPaygPages } from '@/lib/billing';
import { countPages, getUsage, recordUsage } from '@/lib/usage';

export const runtime = 'nodejs';
// OPS-2 (partial): extraction runs inline; long scans get the full function window.
export const maxDuration = 300;

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 100;

// SEC-7: best-effort per-owner rate limit.
// ponytail: per-lambda in-memory — good enough as a first guard, move to
// a shared store if abuse ever shows up in the logs.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const g = globalThis as typeof globalThis & { __plRate?: Map<string, number[]> };
const rate: Map<string, number[]> = (g.__plRate ??= new Map());

function rateLimited(ownerId: string): boolean {
  const now = Date.now();
  const hits = (rate.get(ownerId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    rate.set(ownerId, hits);
    return true;
  }
  hits.push(now);
  rate.set(ownerId, hits);
  return false;
}

/** Accepted upload types → the file extension the extraction router keys off. */
const ACCEPTED: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heic',
};

/**
 * ING-3: normalise images before extraction — HEIC/HEIF → JPEG, and EXIF
 * auto-orientation for phone photos (a sideways photo extracts upright).
 */
async function normaliseImage(bytes: Uint8Array, mime: string): Promise<{ bytes: Uint8Array; ext: string }> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  if (mime === 'image/heic' || mime === 'image/heif') {
    const { default: heicConvert } = await import('heic-convert');
    const jpeg = await heicConvert({ buffer: Buffer.from(bytes), format: 'JPEG', quality: 0.9 });
    bytes = new Uint8Array(jpeg);
    mime = 'image/jpeg';
  }
  const { default: sharp } = await import('sharp');
  // Decompression-bomb guard: 50 MP is far above any real statement scan
  // (a 300dpi A4 page ≈ 8.7 MP) but well below the pixel counts a tiny
  // crafted PNG/WEBP can inflate to. sharp throws past the cap instead of
  // allocating gigabytes. ponytail: heic-convert has no equivalent guard —
  // residual bomb risk on HEIC is bounded by the 25 MB upload cap upstream.
  const rotated = await sharp(Buffer.from(bytes), { limitInputPixels: 50_000_000 })
    .rotate()
    .toBuffer();
  return { bytes: new Uint8Array(rotated), ext: mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg' };
}

export async function GET(req: Request): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  return NextResponse.json(await listJobs(ownerId));
}

export async function POST(req: Request): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field.' }, { status: 400 });
  }

  const ext = ACCEPTED[file.type];
  if (ext === undefined) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload a PDF, PNG, JPG or WebP.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 25MB limit.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
  }
  if (rateLimited(ownerId)) {
    return NextResponse.json(
      { error: 'Too many uploads — wait a minute and try again.' },
      { status: 429 },
    );
  }

  let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer());
  let ext2 = ext;
  if (file.type !== 'application/pdf') {
    try {
      const normalised = await normaliseImage(bytes, file.type);
      bytes = normalised.bytes;
      ext2 = normalised.ext;
    } catch {
      return NextResponse.json({ error: 'Could not read this image — is the file corrupt?' }, { status: 400 });
    }
  }
  const pageCount = await countPages(bytes, file.type === 'application/pdf' ? file.type : 'image/jpeg');
  // ING-2: guard against pathological documents before any extraction cost.
  if (pageCount > MAX_PAGES) {
    return NextResponse.json(
      { error: `This PDF has ${pageCount} pages — the limit is ${MAX_PAGES} pages per file. Split it and retry.` },
      { status: 400 },
    );
  }

  // Quota gate (billing mode only). Local / no-billing mode is unlimited.
  // Only the pages BEYOND the monthly allowance are drawn from PAYG, and the
  // draw is refunded if extraction fails — the user never pays for no output.
  let paygConsumed = 0;
  if (billingEnabled()) {
    const sub = await getSubscription(ownerId);
    const used = await getUsage(ownerId);
    const limit = planLimitFor(sub.tier);
    const overage = Math.min(pageCount, used + pageCount - limit);
    if (overage > 0) {
      const coveredByPayg = await consumePaygPages(ownerId, overage);
      if (!coveredByPayg) {
        return NextResponse.json(
          {
            error: 'Monthly page allowance exceeded. Upgrade or add pay-as-you-go pages.',
            upgradeUrl: '/pricing',
          },
          { status: 402 },
        );
      }
      paygConsumed = overage;
    }
  }

  const job = await createJob(file.name || `upload${ext2}`, ownerId, pageCount);

  // Demo mode: no API key → load a sample statement so the flow is demo-able.
  if (!process.env.ANTHROPIC_API_KEY) {
    await setJobStatement(job.id, demoStatementWithError, ownerId);
    await recordUsage(ownerId, job.id, pageCount);
    return NextResponse.json(await getJob(job.id, ownerId), { status: 201 });
  }

  const tmpPath = join(tmpdir(), `parseledger-${randomUUID()}${ext2}`);
  try {
    await writeFile(tmpPath, bytes);
    const provider = new AnthropicExtractionProvider();
    const statement = await provider.extract({ filePath: tmpPath });
    await setJobStatement(job.id, statement, ownerId);
    // Bill only after a successful extraction.
    await recordUsage(ownerId, job.id, pageCount);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    await setJobFailed(job.id, message, ownerId);
    if (paygConsumed > 0) await refundPaygPages(ownerId, paygConsumed);
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }

  return NextResponse.json(await getJob(job.id, ownerId), { status: 201 });
}
