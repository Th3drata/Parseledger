'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ExtractedStatement } from '@/types';
import { reconcileStatement } from '@/verification';
import { parseMoneyToMinor, formatMinor } from '@/money';
import { formatDate } from '@/lib/format';
import { EXPORT_FORMATS } from '@/export';
import { VerifiedBadge } from './verified-badge';

type ExportFormat = (typeof EXPORT_FORMATS)[number];
type EditCol = 'date' | 'description' | 'amount' | 'balance';

interface AuditCorrection {
  rowRef: number | null;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  actor: string;
  at: number;
}
interface AuditEvent {
  kind: string;
  detail: Record<string, unknown>;
  at: number;
}

/** Signed decimal string suitable for an editable input, e.g. -6488 → "-64.88". Integer math only. */
function minorToInput(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

interface CellProps {
  display: string;
  isEditing: boolean;
  editValue: string;
  align: 'left' | 'right';
  mono?: boolean;
  tone?: 'default' | 'credit' | 'flag';
  onStart: () => void;
  onCommit: (raw: string) => void;
  onCancel: () => void;
}

function Cell({ display, isEditing, editValue, align, mono, tone, onStart, onCommit, onCancel }: CellProps) {
  const [draft, setDraft] = useState(editValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(editValue);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isEditing, editValue]);

  const toneClass = tone === 'flag' ? 'text-flag' : tone === 'credit' ? 'text-reconciled' : 'text-ink';
  const base = `${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'tnum whitespace-nowrap' : ''} ${toneClass}`;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') onCommit(draft);
          if (e.key === 'Escape') onCancel();
        }}
        className={`w-full rounded-inputs bg-paper px-1.5 py-0.5 outline-none ring-1 ring-ink ${base}`}
      />
    );
  }
  return (
    <button type="button" onClick={onStart} className={`w-full cursor-text rounded-tags px-1.5 py-0.5 hover:bg-mist ${base}`}>
      {display}
    </button>
  );
}

export function ReviewScreen({
  jobId,
  initialStatement,
}: {
  jobId: string;
  initialStatement: ExtractedStatement;
}) {
  const [statement, setStatement] = useState<ExtractedStatement>(initialStatement);
  const [editing, setEditing] = useState<{ row: number; col: EditCol } | null>(null);
  const [focusIdx, setFocusIdx] = useState<number>(-1);
  const [flashIdx, setFlashIdx] = useState<number>(-1);
  const [confirmingUnverified, setConfirmingUnverified] = useState(false);
  const [trail, setTrail] = useState<{ corrections: AuditCorrection[]; events: AuditEvent[] } | null>(null);
  const undoStack = useRef<ExtractedStatement[]>([]);
  const redoStack = useRef<ExtractedStatement[]>([]);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const wasVerified = useRef<boolean | null>(null);
  const [justCertified, setJustCertified] = useState(false);

  const result = useMemo(() => reconcileStatement(statement), [statement]);
  const flagged = useMemo(() => new Set(result.flaggedRows), [result.flaggedRows]);
  const warned = useMemo(() => new Set(result.warnedRows), [result.warnedRows]);
  const errorIssues = useMemo(() => result.issues.filter((i) => i.severity === 'error'), [result.issues]);
  const warningIssues = useMemo(() => result.issues.filter((i) => i.severity === 'warning'), [result.issues]);
  const { currency } = statement;

  // The certification moment — the stamp lands when the last issue clears.
  useEffect(() => {
    const was = wasVerified.current;
    wasVerified.current = result.verified;
    if (was === false && result.verified) {
      setJustCertified(true);
      const t = setTimeout(() => setJustCertified(false), 2600);
      return () => clearTimeout(t);
    }
  }, [result.verified]);

  const save = useCallback(
    async (stmt: ExtractedStatement) => {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: stmt }),
      });
      if (!res.ok) throw new Error('save failed');
    },
    [jobId],
  );

  const loadTrail = useCallback(() => {
    fetch(`/api/jobs/${jobId}/audit`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { corrections: AuditCorrection[]; events: AuditEvent[] } | null) => setTrail(data))
      .catch(() => setTrail(null));
  }, [jobId]);

  useEffect(() => {
    loadTrail();
  }, [loadTrail]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      save(statement)
        .then(loadTrail)
        .catch(() => toast.error('Could not save your changes.'));
    }, 700);
    return () => clearTimeout(timer);
  }, [statement, save, loadTrail]);

  /** Every mutation flows through here: pushes undo, clears redo. */
  const applyStatement = useCallback((mutate: (prev: ExtractedStatement) => ExtractedStatement) => {
    setStatement((prev) => {
      undoStack.current.push(prev);
      if (undoStack.current.length > 30) undoStack.current.shift();
      redoStack.current = [];
      return mutate(prev);
    });
  }, []);

  const applyEdit = useCallback(
    (index: number, patch: Partial<ExtractedStatement['transactions'][number]>) => {
      applyStatement((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t, i) => (i === index ? { ...t, ...patch } : t)),
      }));
    },
    [applyStatement],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) {
      toast.message('Nothing to undo.');
      return;
    }
    setStatement((cur) => {
      redoStack.current.push(cur);
      return prev;
    });
    toast.message('Edit undone.');
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) {
      toast.message('Nothing to redo.');
      return;
    }
    setStatement((cur) => {
      undoStack.current.push(cur);
      return next;
    });
    toast.message('Edit redone.');
  }, []);

  const commitCell = useCallback(
    (row: number, col: EditCol, raw: string) => {
      setEditing(null);
      const trimmed = raw.trim();
      if (col === 'description') {
        applyEdit(row, { description: raw });
        return;
      }
      if (col === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          toast.error(`Dates are YYYY-MM-DD — got "${raw}".`);
          return;
        }
        applyEdit(row, { date: trimmed });
        return;
      }
      if (col === 'balance' && (trimmed === '' || trimmed === '—')) {
        applyEdit(row, { balanceMinor: null });
        return;
      }
      try {
        const minor = parseMoneyToMinor(raw);
        applyEdit(row, col === 'amount' ? { amountMinor: minor } : { balanceMinor: minor });
      } catch {
        toast.error(`Could not read "${raw}" as a ${col}.`);
      }
    },
    [applyEdit],
  );

  // ——— Row operations (REV-4) ———
  const addRow = useCallback(
    (after: number) => {
      applyStatement((prev) => {
        const at = after >= 0 ? after + 1 : prev.transactions.length;
        const neighbour = prev.transactions[Math.min(after < 0 ? prev.transactions.length - 1 : after, prev.transactions.length - 1)];
        const row = {
          date: neighbour?.date ?? prev.periodStart ?? '2026-01-01',
          description: 'New transaction',
          amountMinor: 0,
          balanceMinor: null,
        };
        const next = [...prev.transactions];
        next.splice(at, 0, row);
        return { ...prev, transactions: next };
      });
      setFocusIdx(after >= 0 ? after + 1 : statement.transactions.length);
    },
    [applyStatement, statement.transactions.length],
  );

  const deleteRow = useCallback(
    (index: number) => {
      applyStatement((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((_, i) => i !== index),
      }));
      setFocusIdx((f) => Math.min(f, statement.transactions.length - 2));
      toast.message('Row deleted — U to undo.');
    },
    [applyStatement, statement.transactions.length],
  );

  const duplicateRow = useCallback(
    (index: number) => {
      applyStatement((prev) => {
        const src = prev.transactions[index];
        if (!src) return prev;
        const next = [...prev.transactions];
        next.splice(index + 1, 0, { ...src });
        return { ...prev, transactions: next };
      });
    },
    [applyStatement],
  );

  const toggleDirection = useCallback(
    (index: number) => {
      const tx = statement.transactions[index];
      if (!tx) return;
      applyEdit(index, { amountMinor: -tx.amountMinor });
    },
    [applyEdit, statement.transactions],
  );

  const goToRow = useCallback((i: number) => {
    setFocusIdx(i);
    setFlashIdx(i);
    rowRefs.current[i]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => setFlashIdx((cur) => (cur === i ? -1 : cur)), 1700);
  }, []);

  const attentionRows = useMemo(
    () => [...new Set([...result.flaggedRows, ...result.warnedRows])].sort((a, b) => a - b),
    [result.flaggedRows, result.warnedRows],
  );

  const nextFlag = useCallback(() => {
    if (attentionRows.length === 0) {
      toast.message('Nothing flagged.');
      return;
    }
    const next = attentionRows.find((i) => i > focusIdx) ?? attentionRows[0];
    if (next !== undefined) goToRow(next);
  }, [attentionRows, focusIdx, goToRow]);

  // ——— Keyboard register (REV-6): j/k rows · enter edit · n next flag · u/z undo · shift+z redo ———
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const max = statement.transactions.length - 1;
      if (key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(max, focusIdx + 1);
        setFocusIdx(next);
        rowRefs.current[next]?.scrollIntoView({ block: 'nearest' });
      } else if (key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.max(0, focusIdx - 1);
        setFocusIdx(next);
        rowRefs.current[next]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && focusIdx >= 0) {
        e.preventDefault();
        setEditing({ row: focusIdx, col: 'amount' });
      } else if (key === 'n') {
        nextFlag();
      } else if (key === 'u') {
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusIdx, statement.transactions.length, undo, redo, nextFlag]);

  const download = useCallback(
    async (format: ExportFormat, unverified: boolean) => {
      try {
        await save(statement);
      } catch {
        toast.error('Could not save before export.');
        return;
      }
      const params = new URLSearchParams({ format: format.id });
      if (unverified) params.set('unverified', '1');
      window.location.href = `/api/jobs/${jobId}/export?${params.toString()}`;
      setTimeout(loadTrail, 1500);
    },
    [jobId, save, statement, loadTrail],
  );

  const errorCount = errorIssues.length;
  const badge = result.verified ? (
    <VerifiedBadge state="reconciled" label="Verified to the cent" />
  ) : errorCount > 0 ? (
    <VerifiedBadge state="flag" label={`${errorCount} issue${errorCount === 1 ? '' : 's'} — doesn't balance`} />
  ) : (
    <VerifiedBadge state="caution" label="Needs review" />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ——— Main pane: the statement ——— */}
      <div className="min-w-0">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-subheading font-semibold text-ink">{statement.bankName}</h1>
            <p className="mt-1 text-body-sm text-slate">
              {statement.accountHolder ?? 'Account'}
              {statement.accountNumber ? (
                <>
                  {' · '}
                  <span className="tnum">{statement.accountNumber}</span>
                </>
              ) : null}
              {' · '}
              <span className="tnum text-ink-soft">{formatDate(statement.periodStart)}</span> →{' '}
              <span className="tnum text-ink-soft">{formatDate(statement.periodEnd)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {attentionRows.length > 0 ? (
              <button
                type="button"
                onClick={nextFlag}
                className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-ink hover:bg-ledger"
              >
                Next flag <span className="kbd">N</span>
              </button>
            ) : null}
            <p className="text-caption text-ash">
              <span className="kbd">J</span> <span className="kbd">K</span> rows · <span className="kbd">↵</span> edit ·{' '}
              <span className="kbd">U</span> undo · <span className="kbd">⇧⌘Z</span> redo
            </p>
          </div>
        </header>

        <div className="overflow-x-auto rounded-cards border border-hairline">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-iron bg-ledger text-left">
                <th scope="col" className="w-7 pb-2 pt-2" />
                <th scope="col" className="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-slate">Date</th>
                <th scope="col" className="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-slate">Description</th>
                <th scope="col" className="w-8 px-1 py-2 text-caption font-semibold uppercase tracking-wide text-slate"><span className="sr-only">Direction</span>±</th>
                <th scope="col" className="px-3 py-2 text-right text-caption font-semibold uppercase tracking-wide text-slate">Amount</th>
                <th scope="col" className="hidden px-3 py-2 text-right text-caption font-semibold uppercase tracking-wide text-slate sm:table-cell">Balance</th>
                <th scope="col" className="w-14 px-1 py-2"><span className="sr-only">Row actions</span></th>
              </tr>
            </thead>
            <tbody>
              {statement.transactions.map((tx, i) => {
                const isFlagged = flagged.has(i);
                const isWarned = warned.has(i) && !isFlagged;
                const isFocused = focusIdx === i;
                return (
                  <tr
                    key={i}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    onClick={() => setFocusIdx(i)}
                    className={`group border-b border-hairline transition-colors last:border-0 ${
                      isFlagged
                        ? 'border-l-2 border-l-flag bg-flag-wash'
                        : isWarned
                          ? 'border-l-2 border-l-caution bg-caution-wash'
                          : 'odd:bg-paper even:bg-ledger'
                    } ${isFocused ? 'outline outline-1 -outline-offset-1 outline-ink' : ''} ${
                      flashIdx === i ? 'row-flash' : ''
                    }`}
                  >
                    <td className="px-2 py-1.5 text-center">
                      {isFlagged ? (
                        <span className="text-flag" aria-label="Error on this row">⚑</span>
                      ) : isWarned ? (
                        <span aria-label="Review this row" className="inline-block h-1.5 w-1.5 rounded-full bg-caution" />
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">
                      <Cell
                        display={formatDate(tx.date)}
                        isEditing={editing?.row === i && editing.col === 'date'}
                        editValue={tx.date}
                        align="left"
                        mono
                        onStart={() => {
                          setFocusIdx(i);
                          setEditing({ row: i, col: 'date' });
                        }}
                        onCommit={(raw) => commitCell(i, 'date', raw)}
                        onCancel={() => setEditing(null)}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <Cell
                        display={tx.description}
                        isEditing={editing?.row === i && editing.col === 'description'}
                        editValue={tx.description}
                        align="left"
                        onStart={() => {
                          setFocusIdx(i);
                          setEditing({ row: i, col: 'description' });
                        }}
                        onCommit={(raw) => commitCell(i, 'description', raw)}
                        onCancel={() => setEditing(null)}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleDirection(i)}
                        title="Flip debit/credit"
                        aria-label={`Flip direction for row ${i + 1} (currently ${tx.amountMinor >= 0 ? 'credit' : 'debit'})`}
                        className={`tnum rounded-tags px-1 py-0.5 text-caption font-semibold hover:bg-mist ${
                          tx.amountMinor >= 0 ? 'text-reconciled' : 'text-slate'
                        }`}
                      >
                        {tx.amountMinor >= 0 ? 'Cr' : 'Dr'}
                      </button>
                    </td>
                    <td className="px-3 py-1.5">
                      <Cell
                        display={formatMinor(tx.amountMinor, currency)}
                        isEditing={editing?.row === i && editing.col === 'amount'}
                        editValue={minorToInput(tx.amountMinor)}
                        align="right"
                        mono
                        tone={isFlagged ? 'flag' : tx.amountMinor >= 0 ? 'credit' : 'default'}
                        onStart={() => {
                          setFocusIdx(i);
                          setEditing({ row: i, col: 'amount' });
                        }}
                        onCommit={(raw) => commitCell(i, 'amount', raw)}
                        onCancel={() => setEditing(null)}
                      />
                    </td>
                    <td className="hidden px-3 py-1.5 sm:table-cell">
                      <Cell
                        display={tx.balanceMinor === null ? '—' : formatMinor(tx.balanceMinor, currency)}
                        isEditing={editing?.row === i && editing.col === 'balance'}
                        editValue={tx.balanceMinor === null ? '' : minorToInput(tx.balanceMinor)}
                        align="right"
                        mono
                        onStart={() => {
                          setFocusIdx(i);
                          setEditing({ row: i, col: 'balance' });
                        }}
                        onCommit={(raw) => commitCell(i, 'balance', raw)}
                        onCancel={() => setEditing(null)}
                      />
                    </td>
                    <td className="px-1 py-1.5 text-right">
                      <span className="inline-flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => duplicateRow(i)}
                          title="Duplicate row"
                          aria-label={`Duplicate row ${i + 1}`}
                          className="rounded-tags px-1 text-caption text-ash hover:bg-mist hover:text-ink"
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(i)}
                          title="Delete row"
                          aria-label={`Delete row ${i + 1}`}
                          className="rounded-tags px-1 text-caption text-ash hover:bg-flag-wash hover:text-flag"
                        >
                          ✕
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => addRow(focusIdx)}
            className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-ink hover:bg-ledger"
          >
            + Add row
          </button>
          <p className="tnum text-caption text-ash">
            {statement.transactions.length} rows
            {statement.declaredTransactionCount != null ? ` · statement declares ${statement.declaredTransactionCount}` : ''}
          </p>
        </div>

        {/* ——— History (REV-7): corrections + export events ——— */}
        {trail && (trail.corrections.length > 0 || trail.events.length > 0) ? (
          <section className="mt-8">
            <h2 className="text-caption font-semibold uppercase tracking-wide text-slate">History</h2>
            <ul className="mt-2 divide-y divide-hairline rounded-cards border border-hairline">
              {trail.events.slice(0, 10).map((e, i) => (
                <li key={`e${i}`} className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <span className={`text-caption ${e.kind === 'export_unverified' ? 'text-caution' : 'text-slate'}`}>
                    {e.kind === 'export_unverified' ? 'Exported UNVERIFIED' : 'Exported'}{' '}
                    <span className="tnum text-ink-soft">{String(e.detail.format ?? '')}</span>
                  </span>
                  <span className="tnum shrink-0 text-caption text-ash">
                    {new Date(e.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
              {trail.corrections.slice(0, 15).map((c, i) => (
                <li key={`c${i}`} className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-caption text-slate">
                    {c.rowRef !== null ? `Row ${c.rowRef + 1} · ` : ''}
                    {c.field}: <span className="tnum text-flag">{c.oldValue ?? '—'}</span> →{' '}
                    <span className="tnum text-reconciled">{c.newValue ?? '—'}</span>
                  </span>
                  <span className="tnum shrink-0 text-caption text-ash">
                    {new Date(c.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* ——— Rail: the verification instrument ——— */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="relative overflow-hidden rounded-cards border border-hairline">
          <div className="border-b border-hairline bg-ledger px-4 py-3" aria-live="polite">
            {badge}
          </div>

          {/* The identity, stacked */}
          <dl className="space-y-2 px-4 py-4">
            {[
              ['Opening', statement.openingBalanceMinor],
              ['+ Credits', result.sumCreditsMinor],
              ['− Debits', result.sumDebitsMinor],
            ].map(([label, minor]) => (
              <div key={String(label)} className="flex items-baseline justify-between gap-3">
                <dt className="tnum text-caption uppercase text-slate">{label}</dt>
                <dd className="tnum text-figure text-ink">{formatMinor(Number(minor), currency)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 border-t border-iron pt-2">
              <dt className="tnum text-caption uppercase text-slate">= Computed</dt>
              <dd className={`tnum figure-glow text-figure ${result.verified ? 'text-reconciled' : errorIssues.length > 0 ? 'text-flag' : 'text-caution'}`}>
                {formatMinor(result.computedClosingMinor, currency)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="tnum text-caption uppercase text-slate">Printed closing</dt>
              <dd className="tnum text-figure text-ink">
                {statement.balancesMissing ? '—' : formatMinor(statement.closingBalanceMinor, currency)}
              </dd>
            </div>
          </dl>

          {/* Issues — errors first, then review warnings; each is a door to its row */}
          {errorIssues.length > 0 ? (
            <div className="border-t border-hairline px-4 py-3">
              <p className="text-caption font-semibold uppercase tracking-wide text-flag">Errors</p>
              <ul className="mt-2 space-y-1.5">
                {errorIssues.map((issue, i) => (
                  <li key={i}>
                    {issue.rowIndex === null ? (
                      <p className="text-caption leading-relaxed text-flag">{issue.message}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goToRow(issue.rowIndex as number)}
                        className="w-full rounded-tags px-1.5 py-1 text-left text-caption leading-relaxed text-flag hover:bg-flag-wash"
                      >
                        {issue.message} <span className="text-ash">→</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {warningIssues.length > 0 ? (
            <div className="border-t border-hairline px-4 py-3">
              <p className="text-caption font-semibold uppercase tracking-wide text-caution">Review</p>
              <ul className="mt-2 space-y-1.5">
                {warningIssues.map((issue, i) => (
                  <li key={i}>
                    {issue.rowIndex === null ? (
                      <p className="text-caption leading-relaxed text-caution">{issue.message}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goToRow(issue.rowIndex as number)}
                        className="w-full rounded-tags px-1.5 py-1 text-left text-caption leading-relaxed text-caution hover:bg-caution-wash"
                      >
                        {issue.message} <span className="text-ash">→</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Export — gated by the badge */}
          <div className="border-t border-hairline px-4 py-3">
            <p className="text-caption font-semibold uppercase tracking-wide text-slate">Export</p>
            {result.verified ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EXPORT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => void download(format, false)}
                    className="rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-ink transition-colors hover:bg-ledger"
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            ) : !confirmingUnverified ? (
              <div className="mt-2 space-y-2">
                <p className="text-caption text-slate">
                  Export unlocks when the statement reconciles. Fix the flagged rows, or export anyway.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmingUnverified(true)}
                  className="w-full rounded-buttons border border-hairline px-3 py-1.5 text-body-sm font-medium text-flag transition-colors hover:bg-flag-wash"
                >
                  Export anyway (unverified)
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-caption text-flag">
                  This statement is not verified. The export is watermarked UNVERIFIED and the choice is logged. Export as:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EXPORT_FORMATS.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => void download(format, true)}
                      className="rounded-buttons border border-hairline bg-flag-wash px-3 py-1.5 text-body-sm font-medium text-flag hover:border-flag"
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmingUnverified(false)}
                  className="text-caption text-slate underline underline-offset-2 hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* The stamp lands on certification */}
          {justCertified ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-paper/60">
              <span className="stamp-in inline-block rounded-tags border-2 border-reconciled bg-paper px-5 py-2.5 text-center">
                <span className="block text-caption font-semibold uppercase tracking-[0.2em] text-reconciled">Verified</span>
                <span className="tnum block text-caption text-reconciled">to the cent</span>
              </span>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
