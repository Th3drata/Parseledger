import { NextResponse } from 'next/server';
import { getJob, setJobExported, recordAuditEvent } from '@/lib/store';
import { exportStatement, EXPORT_FORMATS } from '@/export';
import { resolveOwner } from '@/lib/auth';

export const runtime = 'nodejs';

type FormatId = (typeof EXPORT_FORMATS)[number]['id'];

function isFormatId(value: string): value is FormatId {
  return EXPORT_FORMATS.some((f) => f.id === value);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  const ownerId = await resolveOwner(req.headers);
  if (ownerId === null) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { id } = await ctx.params;
  const job = await getJob(id, ownerId);
  if (!job || !job.statement || !job.result) {
    return NextResponse.json({ error: 'Job not found or not ready.' }, { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? '';
  if (!isFormatId(format)) {
    return NextResponse.json({ error: 'Unknown export format.' }, { status: 400 });
  }

  // Export gate: unverified statements require an explicit opt-in.
  if (!job.result.verified && url.searchParams.get('unverified') !== '1') {
    return NextResponse.json(
      { error: 'This statement is not verified. Retry with unverified=1 to export anyway.' },
      { status: 409 },
    );
  }

  const unverified = !job.result.verified;
  const { data, fileName, mime } = await exportStatement(format, job.statement, {
    unverified,
    result: job.result,
  });
  await setJobExported(id, ownerId);
  // SEC-5 / EXP-7: every export leaves a trace; unverified ones say so loudly.
  await recordAuditEvent(ownerId, id, unverified ? 'export_unverified' : 'export', {
    format,
    fileName,
  });

  const body: BodyInit = typeof data === 'string' ? data : new Uint8Array(data);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
