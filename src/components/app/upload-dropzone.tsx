'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';

export function UploadDropzone({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/jobs', { method: 'POST', body: form });
        if (!res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const message =
            data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
              ? data.error
              : 'Upload failed.';
          toast.error(message);
          setBusy(false);
          return;
        }
        const job: unknown = await res.json();
        if (job && typeof job === 'object' && 'id' in job && typeof job.id === 'string') {
          router.push(`/app/jobs/${job.id}`);
          router.refresh();
        } else {
          toast.error('Unexpected response from server.');
          setBusy(false);
        }
      } catch {
        toast.error('Network error during upload.');
        setBusy(false);
      }
    },
    [router],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files.item(0);
      if (file) void upload(file);
    },
    [upload],
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
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden
          className={dragging ? 'text-ink' : 'text-slate'}
        >
          <path
            d="M9 4h9l5 5v19H9V4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M18 4v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13 17h6M13 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-body font-medium text-ink">
          {busy ? 'Reading statement…' : 'Drop a bank statement — PDF or photo'}
        </span>
        <span className="text-body-sm text-slate">
          {busy ? 'This can take a moment.' : 'or click to choose a file · PDF, PNG, JPG, WebP · up to 20MB'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.item(0);
          if (file) void upload(file);
          e.target.value = '';
        }}
      />
      {demoMode && (
        <p className="mt-3 text-body-sm text-slate">
          Demo mode — uploads load a sample statement.
        </p>
      )}
    </div>
  );
}
