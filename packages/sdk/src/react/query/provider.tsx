/**
 * React Query provider for Qubic integration
 * @module react/query/provider
 */

import React, { type ReactNode, useMemo } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { QubicProvider, type QubicProviderProps } from "../providers";

/**
 * Configuration options for QubicQueryProvider
 */
export interface QubicQueryProviderProps {
  children: ReactNode;
  /** Optional QueryClient instance. If not provided, a default one will be created */
  queryClient?: QueryClient;
  /** Optional QueryClient configuration for creating a default client */
  queryClientConfig?: QueryClientConfig;
  /** Optional Qubic provider configuration */
  qubicConfig?: Omit<QubicProviderProps, "children">;
  /** Whether to wrap with QubicProvider. Default: true */
  includeQubicProvider?: boolean;
}

/**
 * Default QueryClient configuration optimized for blockchain data
 */
export const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Blockchain data specific defaults
      staleTime: 5000, // 5 seconds default stale time
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

/**
 * Combined provider for Qubic clients and React Query
 *
 * @example
 * ```tsx
 * import { QubicQueryProvider } from '@nvlabs/qts/react/query';
 *
 * function App() {
 *   return (
 *     <QubicQueryProvider>
 *       <YourApp />
 *     </QubicQueryProvider>
 *   );
 * }
 * ```
 *
 * @example With custom configuration
 * ```tsx
 * import { QubicQueryProvider } from '@nvlabs/qts/react/query';
 * import { QueryClient } from '@tanstack/react-query';
 *
 * const queryClient = new QueryClient({
 *   defaultOptions: {
 *     queries: {
 *       staleTime: 10000,
 *     },
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <QubicQueryProvider
 *       queryClient={queryClient}
 *       qubicConfig={{
 *         config: {
 *           baseUrl: 'https://custom-rpc.qubic.org',
 *         },
 *       }}
 *     >
 *       <YourApp />
 *     </QubicQueryProvider>
 *   );
 * }
 * ```
 */
export function QubicQueryProvider({
  children,
  queryClient: providedQueryClient,
  queryClientConfig,
  qubicConfig,
  includeQubicProvider = true,
}: QubicQueryProviderProps) {
  // Create a memoized QueryClient if not provided
  const queryClient = useMemo(() => {
    if (providedQueryClient) {
      return providedQueryClient;
    }

    // Merge default config with provided config
    const config: QueryClientConfig = queryClientConfig
      ? {
          ...defaultQueryClientConfig,
          defaultOptions: {
            queries: {
              ...defaultQueryClientConfig.defaultOptions?.queries,
              ...queryClientConfig.defaultOptions?.queries,
            },
            mutations: {
              ...defaultQueryClientConfig.defaultOptions?.mutations,
              ...queryClientConfig.defaultOptions?.mutations,
            },
          },
        }
      : defaultQueryClientConfig;

    return new QueryClient(config);
  }, [providedQueryClient, queryClientConfig]);

  // Wrap with both QueryClientProvider and optionally QubicProvider
  const content = (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  if (includeQubicProvider) {
    return <QubicProvider {...qubicConfig}>{content}</QubicProvider>;
  }

  return content;
}

/**
 * Standalone QueryClientProvider for cases where QubicProvider is already in the tree
 *
 * @example
 * ```tsx
 * import { QubicProvider } from '@nvlabs/qts/react';
 * import { QubicReactQueryProvider } from '@nvlabs/qts/react/query';
 *
 * function App() {
 *   return (
 *     <QubicProvider>
 *       <QubicReactQueryProvider>
 *         <YourApp />
 *       </QubicReactQueryProvider>
 *     </QubicProvider>
 *   );
 * }
 * ```
 */
export function QubicReactQueryProvider({
  children,
  queryClient: providedQueryClient,
  queryClientConfig,
}: Omit<QubicQueryProviderProps, "qubicConfig" | "includeQubicProvider">) {
  return (
    <QubicQueryProvider
      queryClient={providedQueryClient}
      queryClientConfig={queryClientConfig}
      includeQubicProvider={false}
    >
      {children}
    </QubicQueryProvider>
  );
}
