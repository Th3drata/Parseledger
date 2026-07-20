/** All money values are integer minor units (pence/cents). Never floats. */

export interface ExtractedTransaction {
  /** ISO date yyyy-mm-dd */
  date: string;
  description: string;
  /** Signed: credits positive, debits negative. */
  amountMinor: number;
  /** Running balance after this transaction, if the statement shows one. */
  balanceMinor: number | null;
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
  transactions: ExtractedTransaction[];
}

export type VerificationIssueCode =
  | 'TOTALS_MISMATCH'
  | 'RUNNING_BALANCE_MISMATCH'
  | 'EMPTY_STATEMENT';

export interface VerificationIssue {
  code: VerificationIssueCode;
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
  /** Row indexes the review UI must highlight. */
  flaggedRows: number[];
  sumCreditsMinor: number;
  sumDebitsMinor: number;
}
