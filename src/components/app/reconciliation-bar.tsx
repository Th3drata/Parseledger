import type { ExtractedStatement, VerificationResult } from '@/types';
import { formatMinor } from '@/money';

/**
 * The signature component — the statement identity check as a live equation:
 * Opening + Credits − Debits = Closing, every figure tabular mono. When it
 * balances: a Reconciled check and a green left rule. When it doesn't: the
 * computed closing appears beside the printed one, the mismatch in Flag red.
 * This component IS the product.
 */
export function ReconciliationBar({
  statement,
  result,
}: {
  statement: ExtractedStatement;
  result: VerificationResult;
}) {
  const { currency } = statement;
  const computedClosing =
    statement.openingBalanceMinor + result.sumCreditsMinor - result.sumDebitsMinor;
  const balanced = computedClosing === statement.closingBalanceMinor;

  const fig = (label: string, minor: number) => (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="font-sans text-caption uppercase text-slate">{label}</span>
      <span className="tnum text-figure text-ink">{formatMinor(minor, currency)}</span>
    </span>
  );
  const op = (glyph: string) => (
    <span className="tnum text-figure text-ash" aria-hidden>
      {glyph}
    </span>
  );

  return (
    <div
      className={`border-y border-hairline py-4 pr-4 ${
        balanced ? 'border-l-2 border-l-reconciled pl-4' : 'border-l-2 border-l-flag pl-4'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {balanced ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-reconciled">
            <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        {fig('Opening', statement.openingBalanceMinor)}
        {op('+')}
        {fig('Credits', result.sumCreditsMinor)}
        {op('−')}
        {fig('Debits', result.sumDebitsMinor)}
        {op('=')}
        {balanced ? (
          fig('Closing', statement.closingBalanceMinor)
        ) : (
          <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-sans text-caption uppercase text-slate">Closing</span>
            <span className="tnum text-figure text-flag">{formatMinor(computedClosing, currency)}</span>
            <span className="font-sans text-caption text-slate">computed vs printed</span>
            <span className="tnum text-figure text-ink">
              {formatMinor(statement.closingBalanceMinor, currency)}
            </span>
          </span>
        )}
      </div>
      {result.issues.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-hairline pt-3">
          {result.issues.map((issue, i) => (
            <li key={i} className="text-body-sm text-flag">
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
