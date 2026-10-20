// app/unavailable/page.tsx
import { Suspense } from 'react';
import UnavailableContent from './UnavailableContent';

export default function UnavailablePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <UnavailableContent />
    </Suspense>
  );
}