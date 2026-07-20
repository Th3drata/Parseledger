import { NextResponse } from 'next/server';
import { getJob, setJobExported } from '@/lib/store';
import { exportStatement, EXPORT_FORMATS } from '@/export';

export const runtime = 'nodejs';

type FormatId = (typeof EXPORT_FORMATS)[number]['id'];

function isFormatId(value: string): value is FormatId {
  return EXPORT_FORMATS.some((f) => f.id === value);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = await ctx.params;
  const job = getJob(id);
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

  const { data, fileName, mime } = await exportStatement(format, job.statement);
  setJobExported(id);

  const body: BodyInit = typeof data === 'string' ? data : new Uint8Array(data);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
