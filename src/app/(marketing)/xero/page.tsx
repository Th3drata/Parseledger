import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormatHub } from '@/components/marketing/format-hub';
import { SITE_URL, getFormat } from '@/lib/seo-banks';

export const metadata: Metadata = {
  title: 'Bank statements to Xero — verified CSV imports for UK & IE banks',
  description:
    'Convert statements from 15 UK and Irish banks into Xero-ready CSV files, with every figure proven to reconcile before you import. Step-by-step Xero import instructions included.',
  alternates: { canonical: `${SITE_URL}/xero` },
};

const XERO_STEPS: string[] = [
  'In Xero, open Accounting → Bank accounts and select the bank account the statement belongs to.',
  'Choose Import a statement (or Manage account → Import a statement).',
  'Upload the CSV Parseledger produced. The columns — date, amount, payee, description — are already in the order Xero expects, so the field mapping step is a confirmation, not a puzzle.',
  'Review the imported statement lines and reconcile as usual. Because the file was verified before export, the imported total matches the statement closing balance to the penny.',
];

export default function XeroHubPage() {
  const format = getFormat('xero');
  if (!format) notFound();
  return <FormatHub format={format} importSteps={XERO_STEPS} />;
}
