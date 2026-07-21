import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailCard } from '@/components/app/verify-email-card';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailCard />
    </Suspense>
  );
}
