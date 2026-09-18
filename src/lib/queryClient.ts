/**
 * React Query (TanStack Query) Configuration
 * Provides request queuing, caching, and race condition prevention
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Queries are queued automatically and deduplicated
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations are queued automatically by React Query
      retry: 1,
    },
  },
});
