'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CompletionScreen from '@/components/CompletionScreen';

function CompletionInner() {
  const params = useSearchParams();
  const scanId = params.get('scanId');
  const email = params.get('email');
  return <CompletionScreen scanId={scanId} email={email} />;
}

export default function CompletionPage() {
  return (
    <Suspense fallback={null}>
      <CompletionInner />
    </Suspense>
  );
}
