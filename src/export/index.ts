import type { ExtractedStatement, VerificationResult } from '../types';
import { toCsv, minorToDecimalString, type ExportOpts } from './csv';
import { toXeroCsv } from './xero';
import { toQbo } from './qbo';
import { toQuickBooksCsv } from './qbcsv';
import { toXlsx } from './xlsx';

export { toCsv, minorToDecimalString, type ExportOpts } from './csv';
export { toXeroCsv } from './xero';
export { toQbo } from './qbo';
export { toQuickBooksCsv } from './qbcsv';
export { toXlsx } from './xlsx';

export type ExportFormatId = 'csv' | 'xero' | 'qbo' | 'qbcsv' | 'xlsx';

export interface ExportFormat {
  id: ExportFormatId;
  label: string;
  ext: string;
  mime: string;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  { id: 'csv', label: 'CSV', ext: 'csv', mime: 'text/csv' },
  { id: 'xero', label: 'Xero', ext: 'csv', mime: 'text/csv' },
  {
    id: 'qbo',
    label: 'QuickBooks (QBO)',
    ext: 'qbo',
    mime: 'application/x-ofx',
  },
  { id: 'qbcsv', label: 'QuickBooks CSV', ext: 'csv', mime: 'text/csv' },
  {
    id: 'xlsx',
    label: 'Excel',
    ext: 'xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
];

function kebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFileName(stmt: ExtractedStatement, ext: string): string {
  const base = kebabCase(`${stmt.bankName}-${stmt.periodEnd ?? 'statement'}`);
  return `${base}.${ext}`;
}

export interface ExportResult {
  data: string | Uint8Array;
  fileName: string;
  mime: string;
}

/** Look up a format's metadata by id, throwing on an unknown id. */
function getFormat(formatId: ExportFormatId): ExportFormat {
  const format = EXPORT_FORMATS.find((f) => f.id === formatId);
  if (format === undefined) {
    throw new Error(`unknown export format: ${JSON.stringify(formatId)}`);
  }
  return format;
}

export interface ExportStatementOpts extends ExportOpts {
  /** Pre-computed verification result (avoids recomputing for the xlsx sheet). */
  result?: VerificationResult;
}

export async function exportStatement(
  formatId: ExportFormatId,
  stmt: ExtractedStatement,
  opts: ExportStatementOpts = {},
): Promise<ExportResult> {
  const format = getFormat(formatId);
  const fileName = buildFileName(stmt, format.ext);
  const exportOpts: ExportOpts = { unverified: opts.unverified };

  let data: string | Uint8Array;
  switch (formatId) {
    case 'csv':
      data = toCsv(stmt, exportOpts);
      break;
    case 'xero':
      data = toXeroCsv(stmt, exportOpts);
      break;
    case 'qbo':
      data = toQbo(stmt, exportOpts);
      break;
    case 'qbcsv':
      data = toQuickBooksCsv(stmt, exportOpts);
      break;
    case 'xlsx':
      data = await toXlsx(stmt, opts.result, exportOpts);
      break;
  }

  return { data, fileName, mime: format.mime };
}
