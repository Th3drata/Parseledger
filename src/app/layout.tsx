import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono' });
const serif = Source_Serif_4({ subsets: ['latin'], weight: '400', variable: '--font-source-serif' });

export const metadata: Metadata = {
  title: { default: 'Parseledger — bank statements to clean data, verified to the cent', template: '%s · Parseledger' },
  description:
    'Convert bank statement PDFs and scans into accounting-ready CSV, Excel, QuickBooks and Xero files — with every figure proven to reconcile.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
