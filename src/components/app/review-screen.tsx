'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ExtractedStatement } from '@/types';
import { reconcileStatement } from '@/verification';
import { parseMoneyToMinor, formatMinor } from '@/money';
import { formatDate } from '@/lib/format';
import { EXPORT_FORMATS } from '@/export';
import { VerificationBanner } from './verification-banner';

type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Signed decimal string suitable for an editable input, e.g. -6488 → "-64.88". Integer math only. */
function minorToInput(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

interface EditableCellProps {
  display: string;
  editValue: string;
  align: 'left' | 'right';
  mono?: boolean;
  tone?: 'default' | 'danger';
  onCommit: (raw: string) => void;
}

function EditableCell({ display, editValue, align, mono, tone, onCommit }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== editValue) onCommit(draft);
  };

  const base = `${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'tnum' : ''} ${
    tone === 'danger' ? 'text-danger' : ''
  }`;

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className={`w-full rounded border border-accent bg-card px-1.5 py-0.5 outline-none ${base}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(editValue);
        setEditing(true);
      }}
      className={`w-full cursor-text rounded px-1.5 py-0.5 hover:bg-muted ${base}`}
    >
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
  const [confirmingUnverified, setConfirmingUnverified] = useState(false);
  const result = useMemo(() => reconcileStatement(statement), [statement]);
  const flagged = useMemo(() => new Set(result.flaggedRows), [result.flaggedRows]);
  const { currency } = statement;

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

  // Debounced persistence of edits. The client recompute above is instant;
  // this only mirrors state to the server.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      save(statement).catch(() => toast.error('Could not save your changes.'));
    }, 700);
    return () => clearTimeout(timer);
  }, [statement, save]);

  const editTransaction = useCallback(
    (index: number, patch: Partial<ExtractedStatement['transactions'][number]>) => {
      setStatement((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t, i) => (i === index ? { ...t, ...patch } : t)),
      }));
    },
    [],
  );

  const onAmountEdit = useCallback(
    (index: number, raw: string) => {
      try {
        editTransaction(index, { amountMinor: parseMoneyToMinor(raw) });
      } catch {
        toast.error(`Could not read "${raw}" as an amount.`);
      }
    },
    [editTransaction],
  );

  const onBalanceEdit = useCallback(
    (index: number, raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '' || trimmed === '—') {
        editTransaction(index, { balanceMinor: null });
        return;
      }
      try {
        editTransaction(index, { balanceMinor: parseMoneyToMinor(raw) });
      } catch {
        toast.error(`Could not read "${raw}" as a balance.`);
      }
    },
    [editTransaction],
  );

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
    },
    [jobId, save, statement],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{statement.bankName}</h1>
          <span className="text-sm text-muted-foreground">
            {statement.accountHolder ?? 'Account'}
            {statement.accountNumber ? ` · ${statement.accountNumber}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground">
          <span>
            Period: {formatDate(statement.periodStart)} → {formatDate(statement.periodEnd)}
          </span>
          <span>
            Opening <span className="tnum text-foreground">{formatMinor(statement.openingBalanceMinor, currency)}</span>
            {' → '}
            Closing <span className="tnum text-foreground">{formatMinor(statement.closingBalanceMinor, currency)}</span>
          </span>
        </div>
      </header>

      <VerificationBanner result={result} />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-8 px-2 py-2.5" />
              <th className="px-3 py-2.5 text-left font-medium">Date</th>
              <th className="px-3 py-2.5 text-left font-medium">Description</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              <th className="px-3 py-2.5 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {statement.transactions.map((tx, i) => {
              const isFlagged = flagged.has(i);
              return (
                <tr
                  key={i}
                  className={`border-b border-border last:border-0 ${isFlagged ? 'bg-danger-soft' : ''}`}
                >
                  <td className="px-2 py-1 text-center text-danger" aria-hidden>
                    {isFlagged ? '⚑' : ''}
                  </td>
                  <td className="px-3 py-1 tnum text-muted-foreground whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-3 py-1">
                    <EditableCell
                      display={tx.description}
                      editValue={tx.description}
                      align="left"
                      onCommit={(raw) => editTransaction(i, { description: raw })}
                    />
                  </td>
                  <td className="px-3 py-1">
                    <EditableCell
                      display={formatMinor(tx.amountMinor, currency)}
                      editValue={minorToInput(tx.amountMinor)}
                      align="right"
                      mono
                      tone={tx.amountMinor < 0 ? 'danger' : 'default'}
                      onCommit={(raw) => onAmountEdit(i, raw)}
                    />
                  </td>
                  <td className="px-3 py-1">
                    <EditableCell
                      display={tx.balanceMinor === null ? '—' : formatMinor(tx.balanceMinor, currency)}
                      editValue={tx.balanceMinor === null ? '' : minorToInput(tx.balanceMinor)}
                      align="right"
                      mono
                      onCommit={(raw) => onBalanceEdit(i, raw)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        {result.verified ? (
          <>
            <span className="text-sm text-muted-foreground">Export:</span>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => void download(format, false)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {format.label}
              </button>
            ))}
          </>
        ) : !confirmingUnverified ? (
          <button
            type="button"
            onClick={() => setConfirmingUnverified(true)}
            className="rounded-md border border-danger/40 bg-danger-soft px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:border-danger"
          >
            Export anyway (unverified)
          </button>
        ) : (
          <>
            <span className="text-sm text-danger">
              This statement does not reconcile. Export unverified as:
            </span>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => void download(format, true)}
                className="rounded-md border border-danger/40 bg-danger-soft px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:border-danger"
              >
                {format.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setConfirmingUnverified(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
