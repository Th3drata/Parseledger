import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyToMinor, formatMinor } from './money';
import { reconcileStatement } from './verification';
import { mapRawExtraction } from './extraction';
import type { ExtractedStatement } from './types';

test('parseMoneyToMinor', () => {
  assert.equal(parseMoneyToMinor('1,234.56'), 123456);
  assert.equal(parseMoneyToMinor('£1,234.56'), 123456);
  assert.equal(parseMoneyToMinor('-£12.00'), -1200);
  assert.equal(parseMoneyToMinor('(123.45)'), -12345);
  assert.equal(parseMoneyToMinor('45.00 DR'), -4500);
  assert.equal(parseMoneyToMinor('45.00 CR'), 4500);
  assert.equal(parseMoneyToMinor('1.234,56'), 123456); // EU format
  assert.equal(parseMoneyToMinor('€ 987,65'), 98765);
  assert.equal(parseMoneyToMinor('1,234'), 123400); // trailing group of 3 = thousands
  assert.equal(parseMoneyToMinor('0.5'), 50);
  assert.equal(parseMoneyToMinor('100'), 10000);
  assert.equal(parseMoneyToMinor('GBP 12.34'), 1234);
  assert.equal(parseMoneyToMinor('12.345'), 1234500); // trailing group of 3 = EU thousands
  assert.throws(() => parseMoneyToMinor(''));
  assert.throws(() => parseMoneyToMinor('abc'));
  assert.throws(() => parseMoneyToMinor('1.2345'));
});

test('formatMinor', () => {
  assert.equal(formatMinor(123456, 'GBP'), '£1,234.56');
  assert.equal(formatMinor(-1200, 'GBP'), '-£12.00');
  assert.equal(formatMinor(5, 'EUR'), '€0.05');
});

const goodStatement: ExtractedStatement = {
  bankName: 'Monzo',
  accountHolder: 'Test Person',
  accountNumber: '12345678',
  currency: 'GBP',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  openingBalanceMinor: 100000,
  closingBalanceMinor: 95500,
  transactions: [
    { date: '2026-06-02', description: 'Salary', amountMinor: 50000, balanceMinor: 150000 },
    { date: '2026-06-05', description: 'Rent', amountMinor: -60000, balanceMinor: 90000 },
    { date: '2026-06-10', description: 'Groceries', amountMinor: -4500, balanceMinor: 85500 },
    { date: '2026-06-20', description: 'Refund', amountMinor: 10000, balanceMinor: 95500 },
  ],
};

test('reconcileStatement verifies a consistent statement', () => {
  const result = reconcileStatement(goodStatement);
  assert.equal(result.verified, true);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.flaggedRows, []);
  assert.equal(result.sumCreditsMinor, 60000);
  assert.equal(result.sumDebitsMinor, 64500);
});

test('a seeded amount error flags the right row and breaks verification', () => {
  const bad = structuredClone(goodStatement);
  bad.transactions[2]!.amountMinor = -5400; // digit-swap of -4500
  const result = reconcileStatement(bad);
  assert.equal(result.verified, false);
  assert.deepEqual(result.flaggedRows, [2]);
  assert.ok(result.issues.some((i) => i.code === 'TOTALS_MISMATCH'));
  assert.ok(result.issues.some((i) => i.code === 'RUNNING_BALANCE_MISMATCH' && i.rowIndex === 2));
  // resync: only ONE row flagged, not a cascade
  assert.equal(result.issues.filter((i) => i.code === 'RUNNING_BALANCE_MISMATCH').length, 1);
});

test('closing balance mismatch without balance column is still caught', () => {
  const bad: ExtractedStatement = {
    ...goodStatement,
    closingBalanceMinor: 95501,
    transactions: goodStatement.transactions.map((t) => ({ ...t, balanceMinor: null })),
  };
  const result = reconcileStatement(bad);
  assert.equal(result.verified, false);
  assert.equal(result.issues[0]?.code, 'TOTALS_MISMATCH');
});

test('fixing the seeded error flips back to verified', () => {
  const bad = structuredClone(goodStatement);
  bad.transactions[2]!.amountMinor = -5400;
  assert.equal(reconcileStatement(bad).verified, false);
  bad.transactions[2]!.amountMinor = -4500;
  assert.equal(reconcileStatement(bad).verified, true);
});

test('mapRawExtraction maps raw strings to signed minor units', () => {
  const stmt = mapRawExtraction({
    bankName: 'Starling',
    accountHolder: null,
    accountNumber: null,
    currency: 'gbp',
    periodStart: null,
    periodEnd: null,
    openingBalance: '£1,000.00',
    closingBalance: '£955.00',
    transactions: [
      { date: '2026-06-02', description: 'Coffee', amount: '45.00', direction: 'debit', balance: '955.00' },
    ],
  });
  assert.equal(stmt.currency, 'GBP');
  assert.equal(stmt.openingBalanceMinor, 100000);
  assert.equal(stmt.transactions[0]?.amountMinor, -4500);
  assert.equal(stmt.transactions[0]?.balanceMinor, 95500);
  assert.equal(reconcileStatement(stmt).verified, true);
});
