/**
 * Parse a raw money string as printed on a bank statement into integer minor
 * units. Handles: currency symbols/codes, thousands separators, parentheses
 * and trailing CR/DR markers for sign, and comma decimal separators.
 * Throws on anything unparseable — silent zeros corrupt reconciliation.
 */
export function parseMoneyToMinor(raw: string): number {
  let s = raw.trim();
  if (s === '') throw new Error(`unparseable money value: ${JSON.stringify(raw)}`);

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  const marker = /\b(CR|DR)\.?$/i.exec(s);
  if (marker) {
    if (marker[1]!.toUpperCase() === 'DR') negative = true;
    s = s.slice(0, marker.index).trim();
  }
  // strip currency symbols and ISO codes BEFORE sign detection ("£-12.00")
  s = s.replace(/[£€$]/g, '').replace(/\b[A-Z]{3}\b/g, '').replace(/\s/g, '');
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }
  if (!/\d/.test(s)) throw new Error(`unparseable money value: ${JSON.stringify(raw)}`);

  // decimal separator: last of '.' or ','; the other is a thousands separator
  const decIdx = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  let intPart: string;
  let fracPart: string;
  if (decIdx === -1 || s.length - decIdx - 1 === 3) {
    // no separator, or a trailing group of 3 digits → thousands separator
    intPart = s.replace(/[.,]/g, '');
    fracPart = '00';
  } else {
    intPart = s.slice(0, decIdx).replace(/[.,]/g, '');
    fracPart = s.slice(decIdx + 1);
  }
  if (intPart === '') intPart = '0';
  if (!/^\d+$/.test(intPart) || !/^\d{1,2}$/.test(fracPart)) {
    throw new Error(`unparseable money value: ${JSON.stringify(raw)}`);
  }
  const minor = Number(intPart) * 100 + Number(fracPart.padEnd(2, '0'));
  return negative ? -minor : minor;
}

/** Format integer minor units for display, e.g. formatMinor(-123456, 'GBP') → "-£1,234.56" */
export function formatMinor(minor: number, currency: string): string {
  if (!Number.isInteger(minor)) throw new Error(`minor units must be an integer, got ${minor}`);
  const symbols: Record<string, string> = { GBP: '£', EUR: '€', USD: '$' };
  const symbol = symbols[currency] ?? `${currency} `;
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const units = Math.floor(abs / 100).toLocaleString('en-GB');
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}${symbol}${units}.${frac}`;
}
