import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createJob, listJobs, setJobStatement, setJobFailed, getJob } from '@/lib/store';
import { AnthropicExtractionProvider } from '@/extraction';
import { demoStatementWithError } from '@/lib/demo';
import { resolveOwner } from '@/lib/auth';
import { billingEnabled, getSubscription, planLimitFor, consumePaygPages } from '@/lib/billing';
import { countPages, getUsage, recordUsage } from '@/lib/usage';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024;

/** Accepted upload types → the file extension the extraction router keys off. */
const ACCEPTED: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

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
    return NextResponse.json({ error: 'File exceeds the 20MB limit.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pageCount = await countPages(bytes, file.type);

  // Quota gate (billing mode only). Local / no-billing mode is unlimited.
  if (billingEnabled()) {
    const sub = await getSubscription(ownerId);
    const used = await getUsage(ownerId);
    const limit = planLimitFor(sub.tier);
    if (used + pageCount > limit) {
      const coveredByPayg = await consumePaygPages(ownerId, pageCount);
      if (!coveredByPayg) {
        return NextResponse.json(
          {
            error: 'Monthly page allowance exceeded. Upgrade or add pay-as-you-go pages.',
            upgradeUrl: '/pricing',
          },
          { status: 402 },
        );
      }
    }
  }

  const job = await createJob(file.name || `upload${ext}`, ownerId, pageCount);
  await recordUsage(ownerId, job.id, pageCount);

  // Demo mode: no API key → load a sample statement so the flow is demo-able.
  if (!process.env.ANTHROPIC_API_KEY) {
    await setJobStatement(job.id, demoStatementWithError, ownerId);
    return NextResponse.json(await getJob(job.id, ownerId), { status: 201 });
  }

  const tmpPath = join(tmpdir(), `parseledger-${randomUUID()}${ext}`);
  try {
    await writeFile(tmpPath, bytes);
    const provider = new AnthropicExtractionProvider();
    const statement = await provider.extract({ filePath: tmpPath });
    await setJobStatement(job.id, statement, ownerId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    await setJobFailed(job.id, message, ownerId);
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }

  return NextResponse.json(await getJob(job.id, ownerId), { status: 201 });
}
