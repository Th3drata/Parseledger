'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ExtractedStatement } from '@/types';
import { reconcileStatement } from '@/verification';
import { parseMoneyToMinor, formatMinor } from '@/money';
import { formatDate } from '@/lib/format';
import { EXPORT_FORMATS } from '@/export';
import { ReconciliationBar } from './reconciliation-bar';
import { VerifiedBadge } from './verified-badge';

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
  tone?: 'default' | 'credit' | 'flag';
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

  const toneClass =
    tone === 'flag' ? 'text-flag' : tone === 'credit' ? 'text-reconciled' : 'text-ink';
  const base = `${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'tnum' : ''} ${toneClass}`;

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
        className={`w-full rounded-inputs bg-paper px-1.5 py-0.5 outline-none ring-1 ring-iron ${base}`}
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
      className={`w-full cursor-text rounded-tags px-1.5 py-0.5 hover:bg-mist ${base}`}
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

  const issueCount = result.issues.length;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-subheading font-semibold text-ink">{statement.bankName}</h1>
            {result.verified ? (
              <VerifiedBadge state="reconciled" label="Verified to the cent" />
            ) : (
              <VerifiedBadge
                state="flag"
                label={issueCount === 1 ? '1 issue — doesn’t balance' : `${issueCount} issues — doesn’t balance`}
              />
            )}
          </div>
          <span className="text-body-sm text-slate">
            {statement.accountHolder ?? 'Account'}
            {statement.accountNumber ? (
              <>
                {' · '}
                <span className="tnum">{statement.accountNumber}</span>
              </>
            ) : null}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-body-sm text-slate">
          <span>
            Period <span className="tnum text-ink-soft">{formatDate(statement.periodStart)}</span> →{' '}
            <span className="tnum text-ink-soft">{formatDate(statement.periodEnd)}</span>
          </span>
        </div>
      </header>

      <ReconciliationBar statement={statement} result={result} />

      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-iron text-left">
              <th className="w-7 pb-2" />
              <th className="px-3 pb-2 text-caption font-semibold uppercase tracking-wide text-slate">Date</th>
              <th className="px-3 pb-2 text-caption font-semibold uppercase tracking-wide text-slate">Description</th>
              <th className="px-3 pb-2 text-right text-caption font-semibold uppercase tracking-wide text-slate">Amount</th>
              <th className="px-3 pb-2 text-right text-caption font-semibold uppercase tracking-wide text-slate">Balance</th>
            </tr>
          </thead>
          <tbody>
            {statement.transactions.map((tx, i) => {
              const isFlagged = flagged.has(i);
              return (
                <tr
                  key={i}
                  className={`border-b border-hairline ${
                    isFlagged ? 'border-l-2 border-l-flag bg-flag-wash' : 'odd:bg-paper even:bg-ledger'
                  }`}
                >
                  <td className="px-2 py-1.5 text-center text-flag" aria-hidden>
                    {isFlagged ? '⚑' : ''}
                  </td>
                  <td className="tnum whitespace-nowrap px-3 py-1.5 text-slate">{formatDate(tx.date)}</td>
                  <td className="px-3 py-1.5">
                    <EditableCell
                      display={tx.description}
                      editValue={tx.description}
                      align="left"
                      onCommit={(raw) => editTransaction(i, { description: raw })}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <EditableCell
                      display={formatMinor(tx.amountMinor, currency)}
                      editValue={minorToInput(tx.amountMinor)}
                      align="right"
                      mono
                      tone={isFlagged ? 'flag' : tx.amountMinor >= 0 ? 'credit' : 'default'}
                      onCommit={(raw) => onAmountEdit(i, raw)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
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

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
        {result.verified ? (
          <>
            <span className="text-body-sm text-slate">Export</span>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => void download(format, false)}
                className="rounded-buttons border border-hairline bg-transparent px-4 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-ledger"
              >
                {format.label}
              </button>
            ))}
          </>
        ) : !confirmingUnverified ? (
          <button
            type="button"
            onClick={() => setConfirmingUnverified(true)}
            className="rounded-buttons border border-hairline px-4 py-2 text-[15px] font-medium text-flag transition-colors hover:bg-flag-wash"
          >
            Export anyway (unverified)
          </button>
        ) : (
          <>
            <span className="text-body-sm text-flag">
              This statement does not reconcile. Export unverified as:
            </span>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => void download(format, true)}
                className="rounded-buttons border border-hairline bg-flag-wash px-4 py-2 text-[15px] font-medium text-flag transition-colors hover:border-flag"
              >
                {format.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setConfirmingUnverified(false)}
              className="text-body-sm text-slate hover:text-ink"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
