import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ExtractedStatement } from '../types.js';
import { demoStatement } from '../lib/demo.js';
import { toCsv } from './csv.js';
import { toXeroCsv } from './xero.js';
import { toQbo } from './qbo.js';
import { toXlsx } from './xlsx.js';

test('toCsv: row count and exact first data row', () => {
  const csv = toCsv(demoStatement);
  const lines = csv.trim().split('\r\n');
  // header + one row per transaction
  assert.equal(lines.length, demoStatement.transactions.length + 1);
  assert.equal(lines[0], 'Date,Description,Amount,Balance');
  assert.equal(lines[1], '2026-06-01,Acme Consulting Ltd — invoice 0142,1850.00,4697.12');
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
  assert.equal(lines[1], '2026-01-01,"Smith, ""The Plumber"" Ltd",-10.00,50.00');
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
