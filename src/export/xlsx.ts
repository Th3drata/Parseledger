import ExcelJS from 'exceljs';
import type { ExtractedStatement, VerificationResult } from '../types';
import { reconcileStatement } from '../verification';
import { formatMinor } from '../money';
import type { ExportOpts } from './csv';

/**
 * xlsx export (EXP-4): two sheets — Transactions (real Date cells, numeric
 * currency cells) and Reconciliation (the identity, status and issue list).
 * Source of truth for money stays integer minor units throughout the
 * codebase; converting to `minor / 100` here is acceptable ONLY at this final
 * presentation boundary, so the cell holds a real spreadsheet number.
 */
export async function toXlsx(
  stmt: ExtractedStatement,
  result?: VerificationResult,
  opts: ExportOpts = {},
): Promise<Uint8Array> {
  const verification = result ?? reconcileStatement(stmt);
  const workbook = new ExcelJS.Workbook();

  // ——— Sheet 1: Transactions ———
  const sheet = workbook.addWorksheet('Transactions');
  sheet.columns = [{ width: 13 }, { width: 48 }, { width: 15 }, { width: 15 }, { width: 10 }];
  const headerRow = sheet.addRow(['Date', 'Description', 'Amount', 'Balance', 'Direction']);
  headerRow.font = { bold: true };
  for (const tx of stmt.transactions) {
    // Display-only conversion; integer minor units remain the source of truth.
    const amount = tx.amountMinor / 100;
    const balance = tx.balanceMinor === null ? null : tx.balanceMinor / 100;
    const row = sheet.addRow([
      new Date(`${tx.date}T00:00:00Z`),
      tx.description,
      amount,
      balance,
      tx.amountMinor >= 0 ? 'credit' : 'debit',
    ]);
    row.getCell(1).numFmt = 'dd/mm/yyyy';
    row.getCell(3).numFmt = '#,##0.00';
    row.getCell(4).numFmt = '#,##0.00';
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // ——— Sheet 2: Reconciliation ———
  const rec = workbook.addWorksheet('Reconciliation');
  rec.columns = [{ width: 26 }, { width: 60 }];
  if (opts.unverified) {
    const banner = rec.addRow(['UNVERIFIED EXPORT', 'This statement did not reconcile when exported.']);
    banner.font = { bold: true };
    rec.addRow([]);
  }
  rec.addRow(['Bank', stmt.bankName]);
  rec.addRow(['Account', stmt.accountNumber ?? stmt.accountHolder ?? '']);
  rec.addRow(['Period', `${stmt.periodStart ?? ''} to ${stmt.periodEnd ?? ''}`]);
  rec.addRow([]);
  rec.addRow(['Opening balance', formatMinor(stmt.openingBalanceMinor, stmt.currency)]);
  rec.addRow(['Total credits', formatMinor(verification.sumCreditsMinor, stmt.currency)]);
  rec.addRow(['Total debits', formatMinor(verification.sumDebitsMinor, stmt.currency)]);
  rec.addRow(['Computed closing', formatMinor(verification.computedClosingMinor, stmt.currency)]);
  rec.addRow(['Printed closing', formatMinor(stmt.closingBalanceMinor, stmt.currency)]);
  const statusRow = rec.addRow(['Status', verification.verified ? 'Verified to the cent' : 'NOT VERIFIED']);
  statusRow.font = { bold: true };
  if (verification.issues.length > 0) {
    rec.addRow([]);
    const issuesHeader = rec.addRow(['Issues', '']);
    issuesHeader.font = { bold: true };
    for (const issue of verification.issues) {
      rec.addRow([issue.severity, issue.message]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
