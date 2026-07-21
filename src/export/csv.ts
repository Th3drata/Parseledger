import type { ExtractedStatement } from '../types';

/**
 * Format integer minor units as a signed decimal string, e.g. -6488 → "-64.88".
 * Uses integer math only — never floating point division, which can lose cents.
 */
export function minorToDecimalString(minor: number): string {
  if (!Number.isInteger(minor)) throw new Error(`minor units must be an integer, got ${minor}`);
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const units = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${sign}${units}.${String(cents).padStart(2, '0')}`;
}

/** Escape a single CSV field per RFC 4180: quote if it contains a comma, quote or newline. */
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Free-text fields (descriptions) get a leading apostrophe when they would be
 * parsed as a formula by Excel/Sheets — CSV injection guard. Never applied to
 * fields we generate ourselves (dates, amounts).
 */
export function csvTextField(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(',');
}

export interface ExportOpts {
  /** EXP-7: unverified exports carry an explicit UNVERIFIED marker column. */
  unverified?: boolean;
}

/**
 * Generic CSV export (EXP-1): Date (yyyy-mm-dd), Description, Amount (signed
 * decimal, credits positive), Balance, Direction, Currency — plus a Status
 * column stamped UNVERIFIED when the export bypassed verification.
 */
export function toCsv(stmt: ExtractedStatement, opts: ExportOpts = {}): string {
  const header = ['Date', 'Description', 'Amount', 'Balance', 'Direction', 'Currency'];
  if (opts.unverified) header.push('Status');
  const lines: string[] = [csvRow(header)];
  for (const tx of stmt.transactions) {
    const fields = [
      tx.date,
      csvTextField(tx.description),
      minorToDecimalString(tx.amountMinor),
      tx.balanceMinor === null ? '' : minorToDecimalString(tx.balanceMinor),
      tx.amountMinor >= 0 ? 'credit' : 'debit',
      stmt.currency,
    ];
    if (opts.unverified) fields.push('UNVERIFIED');
    lines.push(csvRow(fields));
  }
  return lines.join('\r\n') + '\r\n';
}
