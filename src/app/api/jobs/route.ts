import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createJob, listJobs, setJobStatement, setJobFailed, getJob } from '@/lib/store';
import { AnthropicExtractionProvider } from '@/extraction';
import { demoStatementWithError } from '@/lib/demo';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024;

/** Accepted upload types → the file extension the extraction router keys off. */
const ACCEPTED: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export async function GET(): Promise<Response> {
  return NextResponse.json(listJobs());
}

export async function POST(req: Request): Promise<Response> {
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

  const job = createJob(file.name || `upload${ext}`);

  // Demo mode: no API key → load a sample statement so the flow is demo-able.
  if (!process.env.ANTHROPIC_API_KEY) {
    setJobStatement(job.id, demoStatementWithError);
    return NextResponse.json(getJob(job.id), { status: 201 });
  }

  const tmpPath = join(tmpdir(), `parseledger-${randomUUID()}${ext}`);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(tmpPath, bytes);
    const provider = new AnthropicExtractionProvider();
    const statement = await provider.extract({ filePath: tmpPath });
    setJobStatement(job.id, statement);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    setJobFailed(job.id, message);
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }

  return NextResponse.json(getJob(job.id), { status: 201 });
}
