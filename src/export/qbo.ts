import type { ExtractedStatement, ExtractedTransaction } from '../types.js';
import { minorToDecimalString } from './csv.js';

/** Convert an ISO date (yyyy-mm-dd) to OFX's yyyymmdd. */
function isoToYyyymmdd(iso: string): string {
  return iso.replace(/-/g, '');
}

/** Escape SGML-sensitive characters for OFX text fields. */
function ofxEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Deterministic, unique-per-row FITID derived from index, date and amount. */
function buildFitId(index: number, tx: ExtractedTransaction): string {
  const datePart = isoToYyyymmdd(tx.date);
  const amountPart = tx.amountMinor < 0 ? `N${-tx.amountMinor}` : `P${tx.amountMinor}`;
  return `${datePart}-${index}-${amountPart}`;
}

function lastTransactionDate(stmt: ExtractedStatement): string | null {
  const last = stmt.transactions[stmt.transactions.length - 1];
  return last === undefined ? null : last.date;
}

/**
 * OFX 1.02 SGML (QuickBooks Web Connect / QBO) export.
 * Deterministic: DTSERVER derives from periodEnd or the last transaction date,
 * never from the current wall-clock time.
 */
export function toQbo(stmt: ExtractedStatement): string {
  const asOfIso = stmt.periodEnd ?? lastTransactionDate(stmt);
  if (asOfIso === null) {
    throw new Error('cannot build OFX statement: no periodEnd and no transactions');
  }
  const dtAsOf = isoToYyyymmdd(asOfIso);
  const accountId = stmt.accountNumber ?? '000000000';

  const header = [
    'OFXHEADER:100',
    'DATA:OFXSGML',
    'VERSION:102',
    'SECURITY:NONE',
    'ENCODING:USASCII',
    'CHARSET:1252',
    'COMPRESSION:NONE',
    'OLDFILEUID:NONE',
    'NEWFILEUID:NONE',
    '',
  ].join('\r\n');

  const transactions = stmt.transactions
    .map((tx, index) => {
      const trnType = tx.amountMinor >= 0 ? 'CREDIT' : 'DEBIT';
      const name = ofxEscape(tx.description.slice(0, 32));
      const memo = ofxEscape(tx.description);
      return [
        '<STMTTRN>',
        `<TRNTYPE>${trnType}`,
        `<DTPOSTED>${isoToYyyymmdd(tx.date)}`,
        `<TRNAMT>${minorToDecimalString(tx.amountMinor)}`,
        `<FITID>${buildFitId(index, tx)}`,
        `<NAME>${name}`,
        `<MEMO>${memo}`,
        '</STMTTRN>',
      ].join('\r\n');
    })
    .join('\r\n');

  const body = [
    '<OFX>',
    '<SIGNONMSGSRSV1>',
    '<SONRS>',
    '<STATUS>',
    '<CODE>0',
    '<SEVERITY>INFO',
    '</STATUS>',
    `<DTSERVER>${dtAsOf}`,
    '<LANGUAGE>ENG',
    '<FI>',
    '<ORG>Parseledger',
    '<FID>00000',
    '</FI>',
    '</SONRS>',
    '</SIGNONMSGSRSV1>',
    '<BANKMSGSRSV1>',
    '<STMTTRNRS>',
    '<TRNUID>0',
    '<STATUS>',
    '<CODE>0',
    '<SEVERITY>INFO',
    '</STATUS>',
    '<STMTRS>',
    `<CURDEF>${stmt.currency}`,
    '<BANKACCTFROM>',
    `<ACCTID>${ofxEscape(accountId)}`,
    '<ACCTTYPE>CHECKING',
    '</BANKACCTFROM>',
    '<BANKTRANLIST>',
    `<DTSTART>${stmt.periodStart !== null ? isoToYyyymmdd(stmt.periodStart) : dtAsOf}`,
    `<DTEND>${dtAsOf}`,
    transactions,
    '</BANKTRANLIST>',
    '<LEDGERBAL>',
    `<BALAMT>${minorToDecimalString(stmt.closingBalanceMinor)}`,
    `<DTASOF>${dtAsOf}`,
    '</LEDGERBAL>',
    '</STMTRS>',
    '</STMTTRNRS>',
    '</BANKMSGSRSV1>',
    '</OFX>',
  ].join('\r\n');

  return header + body + '\r\n';
}
