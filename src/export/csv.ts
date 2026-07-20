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

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(',');
}

/**
 * Generic CSV export: Date (yyyy-mm-dd), Description, Amount (signed decimal),
 * Balance (decimal or empty).
 */
export function toCsv(stmt: ExtractedStatement): string {
  const lines: string[] = [csvRow(['Date', 'Description', 'Amount', 'Balance'])];
  for (const tx of stmt.transactions) {
    lines.push(
      csvRow([
        tx.date,
        tx.description,
        minorToDecimalString(tx.amountMinor),
        tx.balanceMinor === null ? '' : minorToDecimalString(tx.balanceMinor),
      ]),
    );
  }
  return lines.join('\r\n') + '\r\n';
}
