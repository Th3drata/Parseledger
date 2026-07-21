/** All money values are integer minor units (pence/cents). Never floats. */

export interface ExtractedTransaction {
  /** ISO date yyyy-mm-dd */
  date: string;
  description: string;
  /** Signed: credits positive, debits negative. */
  amountMinor: number;
  /** Running balance after this transaction, if the statement shows one. */
  balanceMinor: number | null;
  /** Extraction certainty for this row, 0–1. Absent for manual edits/demo data. */
  confidence?: number;
}

export interface ExtractedStatement {
  bankName: string;
  accountHolder: string | null;
  accountNumber: string | null;
  /** ISO 4217, e.g. "GBP", "EUR" */
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalanceMinor: number;
  closingBalanceMinor: number;
  /** True when the statement printed no opening/closing balance (both minors are 0 placeholders). */
  balancesMissing?: boolean;
  /** Transaction count printed on the statement itself, when present. */
  declaredTransactionCount?: number | null;
  transactions: ExtractedTransaction[];
}

export type VerificationIssueCode =
  | 'TOTALS_MISMATCH'
  | 'RUNNING_BALANCE_MISMATCH'
  | 'EMPTY_STATEMENT'
  | 'MISSING_BALANCE_DATA'
  | 'LOW_CONFIDENCE_FIELD'
  | 'TRANSACTION_COUNT_MISMATCH'
  | 'DUPLICATE_ROW';

/** Errors block the badge; warnings ask for eyes but don't. */
export type IssueSeverity = 'error' | 'warning';

export interface VerificationIssue {
  code: VerificationIssueCode;
  severity: IssueSeverity;
  /** 0-based index into transactions; null for statement-level issues. */
  rowIndex: number | null;
  message: string;
  expectedMinor: number | null;
  actualMinor: number | null;
}

export interface VerificationResult {
  /** True only with zero issues. The "Verified to the cent" badge hangs off this. */
  verified: boolean;
  issues: VerificationIssue[];
  /** Row indexes with error-severity issues — red in the review UI. */
  flaggedRows: number[];
  /** Row indexes with warning-severity issues — amber in the review UI. */
  warnedRows: number[];
  sumCreditsMinor: number;
  sumDebitsMinor: number;
  /** opening + Σcredits − Σdebits, always computed. */
  computedClosingMinor: number;
}
