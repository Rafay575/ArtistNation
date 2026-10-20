// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { Toaster } from 'sonner';
import { useState } from 'react';
import SessionBootstrap from '@/components/SessionBootstrap';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SessionBootstrap>{children}</SessionBootstrap>
        <Toaster position="top-right" richColors />
      </Provider>
    </QueryClientProvider>
  );
}