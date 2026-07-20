import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormatHub } from '@/components/marketing/format-hub';
import { SITE_URL, getFormat } from '@/lib/seo-banks';

export const metadata: Metadata = {
  title: 'Bank statements to QuickBooks — verified imports for UK & IE banks',
  description:
    'Convert statements from 15 UK and Irish banks into QuickBooks Online-ready CSV files, with every figure proven to reconcile before you import. QBO upload instructions included.',
  alternates: { canonical: `${SITE_URL}/quickbooks` },
};

const QBO_STEPS: string[] = [
  'In QuickBooks Online, go to Transactions → Bank transactions.',
  'Select the account, then choose Upload from file (under the Link account dropdown).',
  'Upload the CSV Parseledger produced. It follows the QuickBooks 3-column or 4-column layout, so QBO maps date, description and amount without manual fiddling.',
  'Confirm the mapping, import, and categorise as usual. The imported lines sum to the statement closing balance because the file was reconciled before it was exported.',
];

export default function QuickBooksHubPage() {
  const format = getFormat('quickbooks');
  if (!format) notFound();
  return <FormatHub format={format} importSteps={QBO_STEPS} />;
}
