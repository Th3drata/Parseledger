'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  href: string;
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: 'workspace', label: 'Go to workspace', hint: 'Upload & jobs', href: '/app' },
  { id: 'account', label: 'Account & plan', hint: 'Usage, billing', href: '/app/account' },
  { id: 'site', label: 'Marketing site', hint: 'parseledger.co', href: '/' },
  { id: 'pricing', label: 'Pricing', hint: 'Plans', href: '/pricing' },
];

interface JobLite {
  id: string;
  fileName: string;
  status: string;
  statement: { bankName: string } | null;
  result: { verified: boolean } | null;
}

/**
 * ⌘K — the Linear register. Jump anywhere, open any statement by name.
 * Jobs are fetched fresh each time the palette opens so it always reflects
 * the workspace. Pure keyboard: arrows/enter/escape; type to filter.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let goArmedAt = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      // g-then-key navigation (Linear register) — inert while typing anywhere
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'g') {
        goArmedAt = Date.now();
        return;
      }
      if (Date.now() - goArmedAt < 800) {
        if (key === 'w') router.push('/app');
        if (key === 'a') router.push('/app/account');
        goArmedAt = 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    inputRef.current?.focus();
    fetch('/api/jobs')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: JobLite[]) => setJobs(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setJobs([]));
  }, [open]);

  const items = useMemo(() => {
    const jobItems: PaletteItem[] = jobs.map((j) => ({
      id: j.id,
      label: j.fileName,
      hint: `${j.statement?.bankName ?? '—'} · ${j.result?.verified ? 'verified' : j.status}`,
      href: `/app/jobs/${j.id}`,
    }));
    const all = [...STATIC_ITEMS, ...jobItems];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q));
  }, [jobs, query]);

  const go = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/20 pt-[18vh]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-cards bg-paper shadow-popover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <span className="tnum text-caption text-ash" aria-hidden>⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCursor((c) => Math.min(items.length - 1, c + 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              }
              if (e.key === 'Enter') go(items[cursor]);
            }}
            placeholder="Jump to a statement, a page…"
            aria-label="Search commands and statements"
            className="w-full bg-transparent py-3.5 text-body-sm text-ink placeholder:text-ash focus:outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto py-1.5">
          {items.length === 0 ? (
            <li className="px-4 py-3 text-body-sm text-slate">Nothing matches — the ledger is empty here.</li>
          ) : (
            items.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item)}
                  onMouseEnter={() => setCursor(i)}
                  className={`flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-left ${
                    i === cursor ? 'bg-ledger' : ''
                  }`}
                >
                  <span className="truncate text-body-sm font-medium text-ink">{item.label}</span>
                  <span className="tnum shrink-0 text-caption text-ash">{item.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center gap-4 border-t border-hairline px-4 py-2">
          <span className="text-caption text-ash"><span className="kbd">↑↓</span> navigate</span>
          <span className="text-caption text-ash"><span className="kbd">↵</span> open</span>
          <span className="text-caption text-ash"><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
