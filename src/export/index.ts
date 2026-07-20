import type { ExtractedStatement } from '../types';
import { toCsv, minorToDecimalString } from './csv';
import { toXeroCsv } from './xero';
import { toQbo } from './qbo';
import { toXlsx } from './xlsx';

export { toCsv, minorToDecimalString } from './csv';
export { toXeroCsv } from './xero';
export { toQbo } from './qbo';
export { toXlsx } from './xlsx';

export type ExportFormatId = 'csv' | 'xero' | 'qbo' | 'xlsx';

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

export async function exportStatement(
  formatId: ExportFormatId,
  stmt: ExtractedStatement,
): Promise<ExportResult> {
  const format = getFormat(formatId);
  const fileName = buildFileName(stmt, format.ext);

  let data: string | Uint8Array;
  switch (formatId) {
    case 'csv':
      data = toCsv(stmt);
      break;
    case 'xero':
      data = toXeroCsv(stmt);
      break;
    case 'qbo':
      data = toQbo(stmt);
      break;
    case 'xlsx':
      data = await toXlsx(stmt);
      break;
  }

  return { data, fileName, mime: format.mime };
}
