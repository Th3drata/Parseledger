import type { ExtractedStatement } from '../types';
import { minorToDecimalString, csvTextField, type ExportOpts } from './csv';

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(',');
}

function isoToDdMmYyyy(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) throw new Error(`unparseable ISO date: ${JSON.stringify(iso)}`);
  return `${day}/${month}/${year}`;
}

/**
 * QuickBooks Online 4-column bank CSV (EXP-3b): Date, Description, Credit,
 * Debit — positive amounts in their own column, the other left empty.
 */
export function toQuickBooksCsv(stmt: ExtractedStatement, opts: ExportOpts = {}): string {
  const header = ['Date', 'Description', 'Credit', 'Debit'];
  if (opts.unverified) header.push('Status');
  const lines: string[] = [csvRow(header)];
  for (const tx of stmt.transactions) {
    const credit = tx.amountMinor >= 0 ? minorToDecimalString(tx.amountMinor) : '';
    const debit = tx.amountMinor < 0 ? minorToDecimalString(-tx.amountMinor) : '';
    const fields = [isoToDdMmYyyy(tx.date), csvTextField(tx.description), credit, debit];
    if (opts.unverified) fields.push('UNVERIFIED');
    lines.push(csvRow(fields));
  }
  return lines.join('\r\n') + '\r\n';
}
