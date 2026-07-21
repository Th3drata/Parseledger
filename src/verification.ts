import type {
  ExtractedStatement,
  VerificationIssue,
  VerificationResult,
} from './types';
import { formatMinor } from './money';

/** Rows scoring below this extraction confidence get an amber flag. */
export const CONFIDENCE_THRESHOLD = 0.85;

/**
 * The verification engine — the product's moat.
 *
 * Proves an extracted statement is internally consistent:
 *   1. opening + Σcredits − Σdebits === closing        (error when broken)
 *   2. line-by-line: prev balance + amount === printed  (error, per row)
 * and raises review warnings that never block the badge:
 *   3. missing balance data (no identity possible)
 *   4. low-confidence rows (below CONFIDENCE_THRESHOLD)
 *   5. declared transaction count ≠ extracted count
 *   6. exact-duplicate rows (kept, never auto-removed)
 *
 * A statement is Verified iff it has zero ERROR-severity issues. The
 * VerificationResult is the contract between extraction, review and export.
 */
export function reconcileStatement(stmt: ExtractedStatement): VerificationResult {
  const issues: VerificationIssue[] = [];
  const flagged = new Set<number>();
  const warned = new Set<number>();
  const fmt = (m: number): string => formatMinor(m, stmt.currency);

  let sumCredits = 0;
  let sumDebits = 0;
  for (const tx of stmt.transactions) {
    if (tx.amountMinor >= 0) sumCredits += tx.amountMinor;
    else sumDebits += -tx.amountMinor;
  }
  const computedClosing = stmt.openingBalanceMinor + sumCredits - sumDebits;
  const balancesMissing = stmt.balancesMissing === true;

  // ——— 1. Statement identity (skipped when the statement printed no balances) ———
  if (balancesMissing) {
    issues.push({
      code: 'MISSING_BALANCE_DATA',
      severity: 'warning',
      rowIndex: null,
      message:
        'The statement prints no opening/closing balance, so the totals identity cannot be checked — review the rows manually.',
      expectedMinor: null,
      actualMinor: null,
    });
  } else if (stmt.transactions.length === 0 && stmt.openingBalanceMinor !== stmt.closingBalanceMinor) {
    issues.push({
      code: 'EMPTY_STATEMENT',
      severity: 'error',
      rowIndex: null,
      message: `No transactions extracted but opening (${fmt(stmt.openingBalanceMinor)}) differs from closing (${fmt(stmt.closingBalanceMinor)})`,
      expectedMinor: stmt.closingBalanceMinor,
      actualMinor: stmt.openingBalanceMinor,
    });
  } else if (stmt.transactions.length > 0 && computedClosing !== stmt.closingBalanceMinor) {
    issues.push({
      code: 'TOTALS_MISMATCH',
      severity: 'error',
      rowIndex: null,
      message: `Opening ${fmt(stmt.openingBalanceMinor)} + credits ${fmt(sumCredits)} − debits ${fmt(sumDebits)} = ${fmt(computedClosing)}, but statement closing is ${fmt(stmt.closingBalanceMinor)} (off by ${fmt(computedClosing - stmt.closingBalanceMinor)})`,
      expectedMinor: stmt.closingBalanceMinor,
      actualMinor: computedClosing,
    });
  }

  // ——— 2. Line-by-line running balance, where the statement prints one ———
  // With balances missing, anchor the chain on the first printed row balance.
  let running: number | null = balancesMissing ? null : stmt.openingBalanceMinor;
  stmt.transactions.forEach((tx, i) => {
    if (running === null) {
      if (tx.balanceMinor !== null) running = tx.balanceMinor;
      return;
    }
    running += tx.amountMinor;
    if (tx.balanceMinor !== null && tx.balanceMinor !== running) {
      issues.push({
        code: 'RUNNING_BALANCE_MISMATCH',
        severity: 'error',
        rowIndex: i,
        message: `Row ${i + 1} ("${tx.description}"): computed running balance ${fmt(running)} ≠ printed balance ${fmt(tx.balanceMinor)}`,
        expectedMinor: tx.balanceMinor,
        actualMinor: running,
      });
      flagged.add(i);
      // Resync to the printed balance so ONE bad row yields one flag,
      // not a cascade over every subsequent row.
      running = tx.balanceMinor;
    }
  });

  // ——— 3. Low-confidence rows (amber) ———
  stmt.transactions.forEach((tx, i) => {
    if (tx.confidence !== undefined && tx.confidence < CONFIDENCE_THRESHOLD) {
      issues.push({
        code: 'LOW_CONFIDENCE_FIELD',
        severity: 'warning',
        rowIndex: i,
        message: `Row ${i + 1} ("${tx.description}"): extraction confidence ${Math.round(tx.confidence * 100)}% — check the figures against the source.`,
        expectedMinor: null,
        actualMinor: null,
      });
      warned.add(i);
    }
  });

  // ——— 4. Declared count completeness ———
  if (
    stmt.declaredTransactionCount !== undefined &&
    stmt.declaredTransactionCount !== null &&
    stmt.declaredTransactionCount !== stmt.transactions.length
  ) {
    issues.push({
      code: 'TRANSACTION_COUNT_MISMATCH',
      severity: 'warning',
      rowIndex: null,
      message: `The statement declares ${stmt.declaredTransactionCount} transactions but ${stmt.transactions.length} were extracted — a row may be missing or duplicated.`,
      expectedMinor: null,
      actualMinor: null,
    });
  }

  // ——— 5. Exact duplicates (kept and flagged, never auto-removed) ———
  const seen = new Map<string, number>();
  stmt.transactions.forEach((tx, i) => {
    const key = `${tx.date}|${tx.amountMinor}|${tx.description}|${tx.balanceMinor ?? ''}`;
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, i);
      return;
    }
    issues.push({
      code: 'DUPLICATE_ROW',
      severity: 'warning',
      rowIndex: i,
      message: `Row ${i + 1} ("${tx.description}") is identical to row ${first + 1} — possible duplicate; verify against the source.`,
      expectedMinor: null,
      actualMinor: null,
    });
    warned.add(i);
  });

  // VER-3: no printed balances → never auto-verify, even though the issue is
  // only a warning. The badge needs the identity to have actually held.
  const verified = !issues.some((issue) => issue.severity === 'error') && !balancesMissing;

  return {
    verified,
    issues,
    flaggedRows: [...flagged].sort((a, b) => a - b),
    warnedRows: [...warned].sort((a, b) => a - b),
    sumCreditsMinor: sumCredits,
    sumDebitsMinor: sumDebits,
    computedClosingMinor: computedClosing,
  };
}
