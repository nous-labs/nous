import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createQubicClient,
  QubicLiveClient,
  QueryClient,
  ArchiveClient,
} from "../index.ts";

import type {
  ProcedureCall,
  ProcedureTransactionOverrides,
} from "../utils/procedures.ts";
import type { WalletAccount, SignTransactionResult } from "../wallet/index.ts";
import { WalletIntegrationError } from "../wallet/index.ts";
import {
  WalletConnectAdapter,
  type WalletConnectAdapterOptions,
} from "../wallet/walletconnect.ts";

// ===== Core client context =====

export interface QubicClients {
  live: QubicLiveClient;
  query: QueryClient;
  archive: ArchiveClient;
}

const QubicContext = createContext<QubicClients | undefined>(undefined);

export interface QubicProviderProps {
  children: ReactNode;
  config?: Parameters<typeof createQubicClient>[0];
  clients?: Partial<QubicClients>;
}

export function QubicProvider({
  children,
  config,
  clients,
}: QubicProviderProps) {
  const value = useMemo<QubicClients>(() => {
    if (clients?.live && clients.query && clients.archive) {
      return clients as QubicClients;
    }

    const created = createQubicClient(config);
    return {
      live: clients?.live ?? created.live,
      query: clients?.query ?? created.query,
      archive: clients?.archive ?? created.archive,
    };
  }, [config, clients?.live, clients?.query, clients?.archive]);

  return (
    <QubicContext.Provider value={value}>{children}</QubicContext.Provider>
  );
}

export function useQubic() {
  const ctx = useContext(QubicContext);
  if (!ctx) {
    throw new Error("useQubic must be used within a QubicProvider");
  }
  return ctx;
}

// ===== WalletConnect React bindings =====

export interface WalletConnectProviderProps {
  children: ReactNode;
  options: WalletConnectAdapterOptions;
  autoRestoreSession?: boolean;
}

interface WalletConnectContextValue {
  adapter: WalletConnectAdapter | null;
  accounts: WalletAccount[];
  isConnected: boolean;
  isReady: boolean;
  error: Error | null;
}

const WalletConnectContext = createContext<
  WalletConnectContextValue | undefined
>(undefined);

export function WalletConnectProvider({
  children,
  options,
  autoRestoreSession = true,
}: WalletConnectProviderProps) {
  const [adapter, setAdapter] = useState<WalletConnectAdapter | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    WalletConnectAdapter.init(options)
      .then((wcAdapter) => {
        if (!mounted) return;

        setAdapter(wcAdapter);
        setIsReady(true);

        // Check for existing session and restore accounts
        if (autoRestoreSession && wcAdapter.isConnected) {
          wcAdapter
            .requestAccounts()
            .then((accts) => {
              if (mounted) setAccounts(accts);
            })
            .catch((err) => {
              console.error("Failed to restore WalletConnect session:", err);
            });
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setIsReady(true); // Mark as ready even if init failed
          console.error("Failed to initialize WalletConnect:", err);
        }
      });

    return () => {
      mounted = false;
    };
  }, [options.projectId, autoRestoreSession]);

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      adapter,
      accounts,
      isConnected: accounts.length > 0,
      isReady,
      error,
    }),
    [adapter, accounts, isReady, error],
  );

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) {
    throw new Error(
      "useWalletConnect must be used within WalletConnectProvider",
    );
  }
  return ctx;
}
