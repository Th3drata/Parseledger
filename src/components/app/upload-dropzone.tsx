'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif';

type ItemState = 'pending' | 'uploading' | 'done' | 'failed';

interface QueueItem {
  name: string;
  state: ItemState;
  message?: string;
  jobId?: string;
}

/**
 * ING-1 / JOB-4: multi-file intake — drag-and-drop of a whole quarter, file
 * picker (multiple) and clipboard paste. Files upload sequentially with a
 * live progress list; a single upload navigates straight to its review.
 */
export function UploadDropzone({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const uploadOne = useCallback(async (file: File): Promise<QueueItem> => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/jobs', { method: 'POST', body: form });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Upload failed.';
        return { name: file.name, state: 'failed', message };
      }
      const jobId =
        data && typeof data === 'object' && 'id' in data && typeof data.id === 'string'
          ? data.id
          : undefined;
      return { name: file.name, state: 'done', jobId };
    } catch {
      return { name: file.name, state: 'failed', message: 'Network error.' };
    }
  }, []);

  const uploadAll = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || busy) return;
      setBusy(true);
      setQueue(files.map((f) => ({ name: f.name, state: 'pending' })));
      const results: QueueItem[] = [];
      for (let i = 0; i < files.length; i++) {
        setQueue((q) => q.map((item, j) => (j === i ? { ...item, state: 'uploading' } : item)));
        const result = await uploadOne(files[i] as File);
        results.push(result);
        setQueue((q) => q.map((item, j) => (j === i ? result : item)));
      }
      setBusy(false);
      router.refresh();
      const succeeded = results.filter((r) => r.state === 'done');
      if (files.length === 1 && succeeded[0]?.jobId) {
        router.push(`/app/jobs/${succeeded[0].jobId}`);
      } else if (succeeded.length > 0) {
        toast.success(
          `${succeeded.length}/${files.length} statement${files.length === 1 ? '' : 's'} processed — triage below.`,
        );
      }
    },
    [busy, router, uploadOne],
  );

  // ING-1: paste a screenshot/photo of a statement anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.length > 0) void uploadAll(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [uploadAll]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void uploadAll([...e.dataTransfer.files]);
    },
    [uploadAll],
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={busy}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-cards border border-dashed px-6 py-16 text-center transition-colors ${
          dragging ? 'border-solid border-ink bg-paper' : 'border-iron bg-ledger'
        } ${busy ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden className={dragging ? 'text-ink' : 'text-slate'}>
          <path d="M9 4h9l5 5v19H9V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M18 4v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13 17h6M13 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-body font-medium text-ink">
          {busy ? 'Reading statements…' : 'Drop bank statements — PDFs or photos'}
        </span>
        <span className="text-body-sm text-slate">
          {busy
            ? 'Processing one at a time.'
            : 'or click to choose files, or paste an image · PDF, PNG, JPG, WebP, HEIC · up to 25MB each'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          void uploadAll([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />

      {queue.length > 1 || queue.some((q) => q.state === 'failed') ? (
        <ul className="mt-3 space-y-1">
          {queue.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-baseline justify-between gap-3 text-body-sm">
              <span className="truncate text-ink">{item.name}</span>
              {item.state === 'done' && item.jobId ? (
                <a href={`/app/jobs/${item.jobId}`} className="tnum shrink-0 text-reconciled underline underline-offset-2">
                  done →
                </a>
              ) : item.state === 'failed' ? (
                <span className="shrink-0 text-flag">{item.message ?? 'failed'}</span>
              ) : (
                <span className="tnum shrink-0 text-ash">{item.state === 'uploading' ? 'processing…' : 'queued'}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {demoMode && (
        <p className="mt-3 text-body-sm text-slate">Demo mode — uploads load a sample statement.</p>
      )}
    </div>
  );
}
