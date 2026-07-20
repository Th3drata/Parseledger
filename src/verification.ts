import type {
  ExtractedStatement,
  VerificationIssue,
  VerificationResult,
} from './types.js';
import { formatMinor } from './money.js';

/**
 * The verification engine — the product's moat.
 *
 * Proves an extracted statement is internally consistent:
 *   1. opening + Σcredits − Σdebits === closing
 *   2. line-by-line: previous balance + amount === printed running balance
 *
 * A statement is verified ONLY with zero issues. The review UI, the
 * "Verified to the cent" badge and export gating all consume this result.
 */
export function reconcileStatement(stmt: ExtractedStatement): VerificationResult {
  const issues: VerificationIssue[] = [];
  const flagged = new Set<number>();
  const fmt = (m: number): string => formatMinor(m, stmt.currency);

  let sumCredits = 0;
  let sumDebits = 0;
  for (const tx of stmt.transactions) {
    if (tx.amountMinor >= 0) sumCredits += tx.amountMinor;
    else sumDebits += -tx.amountMinor;
  }

  if (stmt.transactions.length === 0 && stmt.openingBalanceMinor !== stmt.closingBalanceMinor) {
    issues.push({
      code: 'EMPTY_STATEMENT',
      rowIndex: null,
      message: `No transactions extracted but opening (${fmt(stmt.openingBalanceMinor)}) differs from closing (${fmt(stmt.closingBalanceMinor)})`,
      expectedMinor: stmt.closingBalanceMinor,
      actualMinor: stmt.openingBalanceMinor,
    });
  }

  const computedClosing = stmt.openingBalanceMinor + sumCredits - sumDebits;
  if (stmt.transactions.length > 0 && computedClosing !== stmt.closingBalanceMinor) {
    issues.push({
      code: 'TOTALS_MISMATCH',
      rowIndex: null,
      message: `Opening ${fmt(stmt.openingBalanceMinor)} + credits ${fmt(sumCredits)} − debits ${fmt(sumDebits)} = ${fmt(computedClosing)}, but statement closing is ${fmt(stmt.closingBalanceMinor)} (off by ${fmt(computedClosing - stmt.closingBalanceMinor)})`,
      expectedMinor: stmt.closingBalanceMinor,
      actualMinor: computedClosing,
    });
  }

  // Line-by-line running balance check, for rows where the statement prints one.
  let running = stmt.openingBalanceMinor;
  stmt.transactions.forEach((tx, i) => {
    running += tx.amountMinor;
    if (tx.balanceMinor !== null && tx.balanceMinor !== running) {
      issues.push({
        code: 'RUNNING_BALANCE_MISMATCH',
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

  return {
    verified: issues.length === 0,
    issues,
    flaggedRows: [...flagged].sort((a, b) => a - b),
    sumCreditsMinor: sumCredits,
    sumDebitsMinor: sumDebits,
  };
}
