import type { ExtractedStatement } from '@/types';

/**
 * Sample statements for demo mode (no ANTHROPIC_API_KEY) and the marketing
 * demo widget. demoStatementWithError carries one seeded digit-swap so the
 * review UI can show a flagged row being fixed live.
 */
export const demoStatement: ExtractedStatement = {
  bankName: 'Monzo',
  accountHolder: 'A. Sample',
  accountNumber: '•••• 4821',
  currency: 'GBP',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  openingBalanceMinor: 284712,
  closingBalanceMinor: 297559,
  transactions: [
    { date: '2026-06-01', description: 'Acme Consulting Ltd — invoice 0142', amountMinor: 185000, balanceMinor: 469712 },
    { date: '2026-06-03', description: 'HMRC VAT', amountMinor: -74210, balanceMinor: 395502 },
    { date: '2026-06-05', description: 'WeWork — office', amountMinor: -45000, balanceMinor: 350502 },
    { date: '2026-06-09', description: 'Tesco', amountMinor: -6488, balanceMinor: 344014 },
    { date: '2026-06-12', description: 'Stripe payout', amountMinor: 92340, balanceMinor: 436354 },
    { date: '2026-06-16', description: 'Salary — J. Doe', amountMinor: -140000, balanceMinor: 296354 },
    { date: '2026-06-20', description: 'Adobe Creative Cloud', amountMinor: -5457, balanceMinor: 290897 },
    { date: '2026-06-24', description: 'Client refund — invoice 0139', amountMinor: -12500, balanceMinor: 278397 },
    { date: '2026-06-27', description: 'Bolt & Sons — invoice 0143', amountMinor: 21500, balanceMinor: 299897 },
    { date: '2026-06-30', description: 'Bank charges', amountMinor: -2338, balanceMinor: 297559 },
  ],
};

export const demoStatementWithError: ExtractedStatement = {
  ...demoStatement,
  transactions: demoStatement.transactions.map((t, i) =>
    // seeded digit-swap on the Tesco row: 64.88 misread as 68.44
    i === 3 ? { ...t, amountMinor: -6844 } : { ...t },
  ),
};
