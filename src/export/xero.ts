import type { ExtractedStatement } from '../types';
import { minorToDecimalString, csvTextField, type ExportOpts } from './csv';

/** Convert an ISO date (yyyy-mm-dd) to Xero's expected dd/mm/yyyy. */
function isoToDdMmYyyy(iso: string): string {
  const parts = iso.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`unparseable ISO date: ${JSON.stringify(iso)}`);
  }
  return `${day}/${month}/${year}`;
}

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
 * Xero bank statement import CSV.
 * Header: *Date,*Amount,Payee,Description,Reference,Cheque Number
 * Date: dd/mm/yyyy. Amount: signed decimal, credits positive, debits negative.
 */
export function toXeroCsv(stmt: ExtractedStatement, opts: ExportOpts = {}): string {
  const lines: string[] = [
    csvRow(
      opts.unverified
        ? ['*Date', '*Amount', 'Payee', 'Description', 'Reference', 'Cheque Number', 'Status']
        : ['*Date', '*Amount', 'Payee', 'Description', 'Reference', 'Cheque Number'],
    ),
  ];
  for (const tx of stmt.transactions) {
    lines.push(
      csvRow(
        opts.unverified
          ? [isoToDdMmYyyy(tx.date), minorToDecimalString(tx.amountMinor), '', csvTextField(tx.description), '', '', 'UNVERIFIED']
          : [isoToDdMmYyyy(tx.date), minorToDecimalString(tx.amountMinor), '', csvTextField(tx.description), '', ''],
      ),
    );
  }
  return lines.join('\r\n') + '\r\n';
}
