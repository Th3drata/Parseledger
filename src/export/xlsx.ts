import ExcelJS from 'exceljs';
import type { ExtractedStatement } from '../types.js';
import { formatMinor } from '../money.js';

/**
 * xlsx export using exceljs. Source of truth for money stays integer minor
 * units throughout the codebase; converting to `minor / 100` here is
 * acceptable ONLY at this final presentation boundary, so the cell holds a
 * real spreadsheet number formatted as currency.
 */
export async function toXlsx(stmt: ExtractedStatement): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Statement');

  sheet.columns = [
    { width: 14 },
    { width: 48 },
    { width: 16 },
    { width: 16 },
  ];

  sheet.addRow(['Bank', stmt.bankName]);
  sheet.addRow(['Account holder', stmt.accountHolder ?? '']);
  sheet.addRow(['Account number', stmt.accountNumber ?? '']);
  sheet.addRow(['Period', `${stmt.periodStart ?? ''} to ${stmt.periodEnd ?? ''}`]);
  sheet.addRow(['Opening balance', formatMinor(stmt.openingBalanceMinor, stmt.currency)]);
  sheet.addRow(['Closing balance', formatMinor(stmt.closingBalanceMinor, stmt.currency)]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(['Date', 'Description', 'Amount', 'Balance']);
  headerRow.font = { bold: true };

  const headerRowNumber = headerRow.number;

  for (const tx of stmt.transactions) {
    // Display-only conversion to a float; integer minor units remain the
    // source of truth everywhere else in the codebase.
    const amount = tx.amountMinor / 100;
    const balance = tx.balanceMinor === null ? null : tx.balanceMinor / 100;
    const row = sheet.addRow([tx.date, tx.description, amount, balance]);
    const amountCell = row.getCell(3);
    amountCell.numFmt = '#,##0.00';
    const balanceCell = row.getCell(4);
    balanceCell.numFmt = '#,##0.00';
  }

  sheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
