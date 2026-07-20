'use client';

import { useMemo, useState } from 'react';
import type { ExtractedStatement } from '@/types';
import { demoStatementWithError } from '@/lib/demo';
import { reconcileStatement } from '@/verification';
import { formatMinor, parseMoneyToMinor } from '@/money';

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
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {stmt.bankName} · {stmt.accountNumber} · {stmt.periodStart} to {stmt.periodEnd}
        </div>
        {result.verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
            ✓ Verified to the cent
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-sm font-medium text-danger">
            {result.issues.length} issue{result.issues.length === 1 ? '' : 's'} found
          </span>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
              <th className="px-4 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border text-muted-foreground">
              <td className="px-4 py-1.5" colSpan={3}>
                Opening balance
              </td>
              <td className="tnum px-4 py-1.5 text-right">
                {formatMinor(stmt.openingBalanceMinor, stmt.currency)}
              </td>
            </tr>
            {stmt.transactions.map((tx, i) => {
              const isFlagged = flagged.has(i);
              return (
                <tr
                  key={i}
                  className={`border-t border-border ${isFlagged ? 'bg-danger-soft' : ''}`}
                >
                  <td className="tnum whitespace-nowrap px-4 py-1.5">{tx.date}</td>
                  <td className="max-w-56 truncate px-4 py-1.5">{tx.description}</td>
                  <td className="tnum px-4 py-1.5 text-right">
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
                          className={`tnum w-24 rounded border px-1.5 py-0.5 text-right ${
                            parseError ? 'border-danger' : 'border-border'
                          }`}
                          aria-label={`Amount for ${tx.description}`}
                        />
                        <button
                          type="button"
                          onClick={() => commit(i)}
                          className="rounded bg-ink px-2 py-0.5 text-xs text-background"
                        >
                          Save
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(i)}
                        title={isFlagged ? 'This row does not reconcile — click to fix it' : 'Click to edit'}
                        className={`tnum rounded px-1 underline-offset-2 hover:underline ${
                          isFlagged ? 'font-semibold text-danger underline' : ''
                        }`}
                      >
                        {formatMinor(tx.amountMinor, stmt.currency)}
                      </button>
                    )}
                  </td>
                  <td className="tnum px-4 py-1.5 text-right">
                    {tx.balanceMinor === null ? '—' : formatMinor(tx.balanceMinor, stmt.currency)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-border text-muted-foreground">
              <td className="px-4 py-1.5" colSpan={3}>
                Closing balance
              </td>
              <td className="tnum px-4 py-1.5 text-right">
                {formatMinor(stmt.closingBalanceMinor, stmt.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {result.verified
            ? 'Every row reconciles. This statement would now export cleanly.'
            : 'This is the check every statement goes through. Try fixing the flagged row — the amount was misread as 68.44; the statement says 64.88.'}
        </p>
        {stmt !== demoStatementWithError && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Reset demo
          </button>
        )}
      </div>
    </div>
  );
}
