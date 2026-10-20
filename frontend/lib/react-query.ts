// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // disable auto-refetch on tab focus
      retry: 1,
    },
    mutations: {
      retry: 0, // mutations fail fast by default
    },
  },
});