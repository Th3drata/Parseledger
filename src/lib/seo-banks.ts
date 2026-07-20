/**
 * Data table driving the programmatic SEO pages:
 * /convert/[bank]-statement-to-[format], /alternatives/[slug], /xero, /quickbooks.
 */

export interface Bank {
  slug: string;
  name: string;
  country: 'UK' | 'IE';
  /** 1–2 factual sentences about this bank's statement format. */
  blurb: string;
}

export interface ExportFormat {
  slug: string;
  name: string;
  blurb: string;
}

export interface Competitor {
  slug: string;
  name: string;
  /** The honest differentiator, stated factually. */
  angle: string;
}

export const BANKS: Bank[] = [
  {
    slug: 'monzo',
    name: 'Monzo',
    country: 'UK',
    blurb:
      'Monzo statements are exported as PDFs from the app, with a clean digital layout and a running balance on every line. Clients often send month-by-month exports rather than one continuous file.',
  },
  {
    slug: 'starling',
    name: 'Starling Bank',
    country: 'UK',
    blurb:
      'Starling produces app-exported PDF statements with per-transaction running balances and clearly separated business and personal accounts. Multi-currency spaces appear as separate statements.',
  },
  {
    slug: 'revolut',
    name: 'Revolut',
    country: 'UK',
    blurb:
      'Revolut statements are generated per currency from the app, so a single client can hold several PDFs for the same period. Layouts change between app versions more often than at high-street banks.',
  },
  {
    slug: 'barclays',
    name: 'Barclays',
    country: 'UK',
    blurb:
      'Barclays issues monthly or quarterly statements in a dense multi-column layout, and older paper statements frequently arrive as phone photos or scans. Running balances are printed on most lines.',
  },
  {
    slug: 'lloyds',
    name: 'Lloyds Bank',
    country: 'UK',
    blurb:
      'Lloyds statements use a tabular layout with money-in and money-out columns and a running balance. Long descriptions wrap across lines, which routinely trips naive PDF parsers.',
  },
  {
    slug: 'hsbc',
    name: 'HSBC',
    country: 'UK',
    blurb:
      'HSBC statements carry a paid-out / paid-in column pair with balances printed at intervals rather than on every line. Business accounts often span many pages per month.',
  },
  {
    slug: 'natwest',
    name: 'NatWest',
    country: 'UK',
    blurb:
      'NatWest statements print a running balance per line and mark debits and credits in separate columns. Downloaded PDFs and posted paper statements share broadly the same layout.',
  },
  {
    slug: 'santander-uk',
    name: 'Santander UK',
    country: 'UK',
    blurb:
      'Santander UK statements show a single signed amount column with a running balance, and business statements often arrive as scans of posted originals.',
  },
  {
    slug: 'nationwide',
    name: 'Nationwide',
    country: 'UK',
    blurb:
      'Nationwide statements are issued for current accounts and savings with a compact tabular layout. Older FlexAccount paper statements are commonly photographed rather than downloaded.',
  },
  {
    slug: 'tsb',
    name: 'TSB',
    country: 'UK',
    blurb:
      'TSB statements use a Lloyds-derived layout with money-in and money-out columns and per-line balances. PDFs downloaded from internet banking are text-based rather than scanned.',
  },
  {
    slug: 'metro-bank',
    name: 'Metro Bank',
    country: 'UK',
    blurb:
      'Metro Bank statements have a simple single-table layout with a running balance on each line. Business customers often receive long combined statements covering several accounts.',
  },
  {
    slug: 'aib',
    name: 'AIB',
    country: 'IE',
    blurb:
      'AIB statements are issued in euro with debit and credit columns and balances printed at intervals. Posted paper statements from branch accounts are frequently scanned before they reach a bookkeeper.',
  },
  {
    slug: 'bank-of-ireland',
    name: 'Bank of Ireland',
    country: 'IE',
    blurb:
      'Bank of Ireland statements use a dense multi-line layout where a single transaction can wrap over several rows. Both 365 online PDFs and posted statements are in circulation.',
  },
  {
    slug: 'permanent-tsb',
    name: 'Permanent TSB',
    country: 'IE',
    blurb:
      'Permanent TSB statements are issued in euro with a straightforward tabular layout and per-line balances. Open24 downloads are text PDFs; older statements arrive as scans.',
  },
  {
    slug: 'ulster-bank',
    name: 'Ulster Bank',
    country: 'IE',
    blurb:
      'Ulster Bank statements follow the NatWest Group layout with per-line running balances. With the Republic of Ireland wind-down, bookkeepers often handle historical statements as scans or photos.',
  },
];

export const FORMATS: ExportFormat[] = [
  {
    slug: 'xero',
    name: 'Xero',
    blurb:
      'A pre-mapped CSV that Xero accepts directly in Bank accounts → Import a statement, with dates, amounts and payee columns already in the order Xero expects.',
  },
  {
    slug: 'quickbooks',
    name: 'QuickBooks',
    blurb:
      'A 3-column or 4-column CSV formatted for QuickBooks Online bank feeds, importable via Transactions → Bank transactions → Upload from file.',
  },
  {
    slug: 'excel',
    name: 'Excel',
    blurb:
      'An .xlsx workbook with typed date and currency columns, a transactions sheet and a reconciliation summary — ready for pivot tables and lookups without re-formatting.',
  },
  {
    slug: 'csv',
    name: 'CSV',
    blurb:
      'A clean, UTF-8 comma-separated file with ISO dates and signed amounts — the neutral format every ledger, script and spreadsheet can ingest.',
  },
];

export const COMPETITORS: Competitor[] = [
  {
    slug: 'bankstatementconverter',
    name: 'BankStatementConverter',
    angle:
      'BankStatementConverter parses statements into spreadsheets. Parseledger parses and then proves the result: every export must satisfy opening + credits − debits = closing, with row-level running-balance checks, before it earns the Verified badge. Add UK/IE bank depth and flat pricing.',
  },
  {
    slug: 'docuclipper',
    name: 'DocuClipper',
    angle:
      'DocuClipper is a general-purpose document extractor spanning invoices, receipts and statements. Parseledger does one thing — UK and Irish bank statements — and reconciles every figure to the cent before you export, at a flat monthly price.',
  },
  {
    slug: 'statementreader',
    name: 'StatementReader',
    angle:
      'StatementReader converts statements to Excel and CSV. Parseledger adds the verification layer: a line-by-line running-balance proof and a totals equation that must hold exactly, plus first-class Xero and QuickBooks exports for UK/IE banks.',
  },
];

export function getBank(slug: string): Bank | undefined {
  return BANKS.find((b) => b.slug === slug);
}

export function getFormat(slug: string): ExportFormat | undefined {
  return FORMATS.find((f) => f.slug === slug);
}

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

/** Slug for a /convert page, e.g. "monzo-statement-to-xero". */
export function convertSlug(bank: Bank, format: ExportFormat): string {
  return `${bank.slug}-statement-to-${format.slug}`;
}

/** Parse a /convert slug back into its bank and format, or null. */
export function parseConvertSlug(
  slug: string,
): { bank: Bank; format: ExportFormat } | null {
  const idx = slug.lastIndexOf('-statement-to-');
  if (idx === -1) return null;
  const bank = getBank(slug.slice(0, idx));
  const format = getFormat(slug.slice(idx + '-statement-to-'.length));
  if (!bank || !format) return null;
  return { bank, format };
}

export const SITE_URL = 'https://parseledger.com';
