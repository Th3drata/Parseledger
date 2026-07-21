import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ExtractedStatement } from '../types';
import { demoStatement } from '../lib/demo';
import { toCsv } from './csv';
import { toXeroCsv } from './xero';
import { toQbo } from './qbo';
import { toXlsx } from './xlsx';
import { toQuickBooksCsv } from './qbcsv';
import { reconcileStatement } from '../verification';

test('toCsv: row count and exact first data row', () => {
  const csv = toCsv(demoStatement);
  const lines = csv.trim().split('\r\n');
  // header + one row per transaction
  assert.equal(lines.length, demoStatement.transactions.length + 1);
  assert.equal(lines[0], 'Date,Description,Amount,Balance,Direction,Currency');
  assert.equal(lines[1], '2026-06-01,Acme Consulting Ltd — invoice 0142,1850.00,4697.12,credit,GBP');
});

test('toCsv: escapes description with comma and quote', () => {
  const stmt: ExtractedStatement = {
    ...demoStatement,
    transactions: [
      {
        date: '2026-01-01',
        description: 'Smith, "The Plumber" Ltd',
        amountMinor: -1000,
        balanceMinor: 5000,
      },
    ],
  };
  const csv = toCsv(stmt);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[1], '2026-01-01,"Smith, ""The Plumber"" Ltd",-10.00,50.00,debit,GBP');
});

test('toXeroCsv: header and dd/mm/yyyy date format', () => {
  const csv = toXeroCsv(demoStatement);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], '*Date,*Amount,Payee,Description,Reference,Cheque Number');
  assert.equal(lines[1], '01/06/2026,1850.00,,Acme Consulting Ltd — invoice 0142,,');
  // last row: 2026-06-30 -> 30/06/2026, debit -23.38
  assert.equal(lines[lines.length - 1], '30/06/2026,-23.38,,Bank charges,,');
});

test('toQbo: STMTTRN count, TRNAMT for a known row, and LEDGERBAL', () => {
  const ofx = toQbo(demoStatement);
  const openCount = (ofx.match(/<STMTTRN>/g) ?? []).length;
  const closeCount = (ofx.match(/<\/STMTTRN>/g) ?? []).length;
  assert.equal(openCount, demoStatement.transactions.length);
  assert.equal(closeCount, demoStatement.transactions.length);

  // Tesco row: amountMinor -6488 -> -64.88
  assert.ok(ofx.includes('<TRNAMT>-64.88'));
  assert.ok(ofx.includes('<TRNTYPE>DEBIT'));
  assert.ok(ofx.includes('<TRNTYPE>CREDIT'));

  assert.ok(ofx.includes('<BALAMT>2975.59'));
  assert.ok(ofx.includes('<DTASOF>20260630'));
});

test('toXlsx: returns a non-empty Uint8Array with the zip magic bytes', async () => {
  const bytes = await toXlsx(demoStatement);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 0);
  assert.equal(bytes[0], 0x50); // 'P'
  assert.equal(bytes[1], 0x4b); // 'K'
});

test('CSV formula injection guard on descriptions', async () => {
  const { toCsv } = await import('./csv');
  const { toXeroCsv } = await import('./xero');
  const hostile = {
    ...demoStatement,
    transactions: [
      { date: '2026-06-01', description: '=HYPERLINK("http://evil","x")', amountMinor: -100, balanceMinor: null },
      { date: '2026-06-02', description: '+1234567890', amountMinor: 100, balanceMinor: null },
    ],
  };
  const csv = toCsv(hostile);
  const xero = toXeroCsv(hostile);
  for (const out of [csv, xero]) {
    assert.ok(!/(^|,)=HYPERLINK/m.test(out), 'formula must be neutralised');
    assert.ok(out.includes(`'=HYPERLINK`));
    assert.ok(out.includes(`'+1234567890`));
  }
  // legitimate negative amounts stay intact
  assert.ok(csv.includes(',-1.00,'));
});

test('toQuickBooksCsv: 4-column structure with credit/debit split (EXP-3b)', () => {
  const csv = toQuickBooksCsv(demoStatement);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], 'Date,Description,Credit,Debit');
  assert.equal(lines[1], '01/06/2026,Acme Consulting Ltd — invoice 0142,1850.00,');
  assert.ok(lines.some((l) => l.endsWith(',,742.10') || l.includes(',742.10')));
});

test('UNVERIFIED status column present only on unverified exports (EXP-7)', () => {
  const verifiedCsv = toCsv(demoStatement);
  assert.ok(!verifiedCsv.includes('UNVERIFIED'));
  const unverifiedCsv = toCsv(demoStatement, { unverified: true });
  const lines = unverifiedCsv.trim().split('\r\n');
  assert.ok(lines[0]!.endsWith(',Status'));
  assert.ok(lines[1]!.endsWith(',UNVERIFIED'));
  const qb = toQuickBooksCsv(demoStatement, { unverified: true });
  assert.ok(qb.includes('UNVERIFIED'));
});

test('toXlsx: two sheets — Transactions and Reconciliation (EXP-4)', async () => {
  const result = reconcileStatement(demoStatement);
  const bytes = await toXlsx(demoStatement, result);
  // re-read with exceljs: the zip is compressed, raw-byte search won't work
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  const names = wb.worksheets.map((w) => w.name);
  assert.deepEqual(names, ['Transactions', 'Reconciliation']);
});
