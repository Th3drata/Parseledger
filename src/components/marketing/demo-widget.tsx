'use client';

import { useMemo, useState } from 'react';
import type { ExtractedStatement } from '@/types';
import { demoStatementWithError } from '@/lib/demo';
import { reconcileStatement } from '@/verification';
import { formatMinor, parseMoneyToMinor } from '@/money';
import { VerifiedBadge } from '@/components/app/verified-badge';

/**
 * The conversion mechanism: a live mini review-table running the real
 * reconcileStatement() engine over the seeded demo statement. The visitor
 * clicks the flagged amount, corrects 68.44 to 64.88, and watches the red
 * flag flip to the green "Verified to the cent" badge.
 */
export function DemoWidget() {
  const [stmt, setStmt] = useState<ExtractedStatement>(demoStatementWithError);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [parseError, setParseError] = useState(false);

  const result = useMemo(() => reconcileStatement(stmt), [stmt]);
  const flagged = new Set(result.flaggedRows);

  const computedClosing =
    stmt.openingBalanceMinor + result.sumCreditsMinor - result.sumDebitsMinor;

  function startEdit(i: number): void {
    setEditing(i);
    setParseError(false);
    const tx = stmt.transactions[i];
    if (tx) setDraft((Math.abs(tx.amountMinor) / 100).toFixed(2));
  }

  function commit(i: number): void {
    const tx = stmt.transactions[i];
    if (!tx) return;
    try {
      const parsed = parseMoneyToMinor(draft);
      const sign = tx.amountMinor < 0 ? -1 : 1;
      const next: ExtractedStatement = {
        ...stmt,
        transactions: stmt.transactions.map((t, j) =>
          j === i ? { ...t, amountMinor: sign * Math.abs(parsed) } : t,
        ),
      };
      setStmt(next);
      setEditing(null);
      setParseError(false);
    } catch {
      setParseError(true);
    }
  }

  function reset(): void {
    setStmt(demoStatementWithError);
    setEditing(null);
    setParseError(false);
  }

  return (
    <div className="overflow-hidden rounded-cards bg-paper shadow-artifact">
      {/* Header — statement identity + verification badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="tnum text-caption text-slate">
          {stmt.bankName} · {stmt.accountNumber} · {stmt.periodStart} to {stmt.periodEnd}
        </div>
        {result.verified ? (
          <VerifiedBadge state="reconciled" label="Verified to the cent" />
        ) : (
          <VerifiedBadge
            state="flag"
            label={`${result.issues.length} issue${result.issues.length === 1 ? '' : 's'} found`}
          />
        )}
      </div>

      {/* Reconciliation equation strip */}
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline px-5 py-3 ${
          result.verified ? 'border-l-2 border-l-reconciled' : 'border-l-2 border-l-flag'
        }`}
      >
        {result.verified ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="text-reconciled">
            <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        <Fig label="Opening" value={formatMinor(stmt.openingBalanceMinor, stmt.currency)} />
        <Op glyph="+" />
        <Fig label="Credits" value={formatMinor(result.sumCreditsMinor, stmt.currency)} />
        <Op glyph="−" />
        <Fig label="Debits" value={formatMinor(result.sumDebitsMinor, stmt.currency)} />
        <Op glyph="=" />
        {result.verified ? (
          <Fig label="Closing" value={formatMinor(stmt.closingBalanceMinor, stmt.currency)} />
        ) : (
          <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-caption uppercase text-slate">Closing</span>
            <span className="tnum text-figure text-flag">
              {formatMinor(computedClosing, stmt.currency)}
            </span>
            <span className="text-caption text-slate">vs</span>
            <span className="tnum text-figure text-ink">
              {formatMinor(stmt.closingBalanceMinor, stmt.currency)}
            </span>
          </span>
        )}
      </div>

      {/* Ledger table */}
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-ledger text-left">
            <tr className="border-b border-iron">
              <th className="px-5 py-2 text-caption font-semibold uppercase text-slate">Date</th>
              <th className="px-5 py-2 text-caption font-semibold uppercase text-slate">Description</th>
              <th className="px-5 py-2 text-right text-caption font-semibold uppercase text-slate">Amount</th>
              <th className="px-5 py-2 text-right text-caption font-semibold uppercase text-slate">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-hairline">
              <td className="px-5 py-1.5 text-body-sm text-slate" colSpan={3}>
                Opening balance
              </td>
              <td className="tnum px-5 py-1.5 text-right text-figure text-slate">
                {formatMinor(stmt.openingBalanceMinor, stmt.currency)}
              </td>
            </tr>
            {stmt.transactions.map((tx, i) => {
              const isFlagged = flagged.has(i);
              return (
                <tr
                  key={i}
                  className={`border-b border-hairline ${
                    isFlagged ? 'border-l-2 border-l-flag bg-flag-wash' : 'odd:bg-paper even:bg-ledger'
                  }`}
                >
                  <td className="tnum whitespace-nowrap px-5 py-1.5 text-figure text-ink">{tx.date}</td>
                  <td className="max-w-56 truncate px-5 py-1.5 text-body-sm text-ink">{tx.description}</td>
                  <td className="tnum px-5 py-1.5 text-right text-figure text-ink">
                    {editing === i ? (
                      <span className="inline-flex items-center gap-1">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => {
                            setDraft(e.target.value);
                            setParseError(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commit(i);
                            if (e.key === 'Escape') setEditing(null);
                          }}
                          className={`tnum w-24 rounded-inputs bg-paper px-1.5 py-0.5 text-right text-figure ring-1 ${
                            parseError ? 'ring-flag' : 'ring-iron'
                          } focus:outline-none`}
                          aria-label={`Amount for ${tx.description}`}
                        />
                        <button
                          type="button"
                          onClick={() => commit(i)}
                          className="rounded-buttons bg-ink px-2 py-0.5 text-caption text-paper hover:bg-ink-soft"
                        >
                          Save
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(i)}
                        title={isFlagged ? 'This row does not reconcile — click to fix it' : 'Click to edit'}
                        className={`tnum rounded-tags px-1 underline-offset-2 hover:underline ${
                          isFlagged ? 'font-medium text-flag underline' : 'text-ink'
                        }`}
                      >
                        {formatMinor(tx.amountMinor, stmt.currency)}
                      </button>
                    )}
                  </td>
                  <td className="tnum px-5 py-1.5 text-right text-figure text-slate">
                    {tx.balanceMinor === null ? '—' : formatMinor(tx.balanceMinor, stmt.currency)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-iron">
              <td className="px-5 py-1.5 text-body-sm text-slate" colSpan={3}>
                Closing balance
              </td>
              <td className="tnum px-5 py-1.5 text-right text-figure text-ink">
                {formatMinor(stmt.closingBalanceMinor, stmt.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer prompt */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-5 py-4">
        <p className="max-w-lg text-body-sm text-slate">
          {result.verified
            ? 'Every row reconciles. This statement would now export cleanly.'
            : 'This is the check every statement goes through. Try fixing the flagged row — the amount was misread as 68.44; the statement says 64.88.'}
        </p>
        {stmt !== demoStatementWithError && (
          <button
            type="button"
            onClick={reset}
            className="text-body-sm text-slate underline underline-offset-2 hover:text-ink"
          >
            Reset demo
          </button>
        )}
      </div>
    </div>
  );
}

function Fig({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-caption uppercase text-slate">{label}</span>
      <span className="tnum text-figure text-ink">{value}</span>
    </span>
  );
}

function Op({ glyph }: { glyph: string }) {
  return (
    <span className="tnum text-figure text-ash" aria-hidden>
      {glyph}
    </span>
  );
}
