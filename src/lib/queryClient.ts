import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient.
 *
 * staleTime: 60s   — data considered fresh for 1 min before background refetch
 * gcTime:    5 min — inactive cache entries cleaned up after 5 min
 * retry:     2     — retry failed requests twice before surfacing error
 * refetchOnWindowFocus: false — mobile apps don't have window-focus semantics
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
