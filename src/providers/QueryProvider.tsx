// React Query Provider - State Management
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { errorLogger } from '../utils/errorHandler';

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (disabled for better UX)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Error handling
      onError: (error) => {
        errorLogger.log(error as Error, { context: 'React Query' });
      },
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Error handling
      onError: (error) => {
        errorLogger.log(error as Error, { context: 'React Query Mutation' });
      },
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
