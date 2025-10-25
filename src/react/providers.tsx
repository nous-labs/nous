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

interface WalletConnectState {
  adapter?: WalletConnectAdapter;
  accounts: WalletAccount[];
  pairingUri?: string;
  isConnecting: boolean;
  ready: boolean;
}

export interface WalletConnectProviderProps {
  children: ReactNode;
  options: WalletConnectAdapterOptions;
  autoLoadAccounts?: boolean;
}

interface WalletConnectContextValue extends WalletConnectState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  signTransaction: (
    transaction: Record<string, unknown>,
    walletParams?: Record<string, unknown>,
  ) => Promise<SignTransactionResult>;
  signAndBroadcast: (options: {
    client: QubicLiveClient;
    transaction: Record<string, unknown>;
    walletParams?: Record<string, unknown>;
    broadcastParams?: Record<string, unknown>;
  }) => Promise<unknown>;
  signProcedureCall: (options: {
    call: ProcedureCall;
    transaction: ProcedureTransactionOverrides;
    walletParams?: Record<string, unknown>;
  }) => Promise<SignTransactionResult>;
  signAndBroadcastProcedureCall: (options: {
    call: ProcedureCall;
    transaction: ProcedureTransactionOverrides;
    walletParams?: Record<string, unknown>;
    broadcastParams?: Record<string, unknown>;
    client: QubicLiveClient;
  }) => Promise<unknown>;
}

const WalletConnectContext = createContext<
  WalletConnectContextValue | undefined
>(undefined);

export function WalletConnectProvider({
  children,
  options,
  autoLoadAccounts = true,
}: WalletConnectProviderProps) {
  const [state, setState] = useState<WalletConnectState>({
    accounts: [],
    isConnecting: false,
    ready: false,
  });

  useEffect(() => {
    let disposed = false;
    WalletConnectAdapter.init(options)
      .then((adapter) => {
        if (disposed) return;
        setState((prev) => ({ ...prev, adapter, ready: true }));
        if (autoLoadAccounts) {
          adapter
            .requestAccounts()
            .then((accounts) => {
              if (!disposed) {
                setState((prev) => ({ ...prev, accounts }));
              }
            })
            .catch(() => void 0);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize WalletConnectAdapter", error);
      });

    return () => {
      disposed = true;
    };
  }, [options, autoLoadAccounts]);

  const connect = useCallback(async () => {
    if (!state.adapter) {
      throw new WalletIntegrationError("WalletConnect adapter not ready");
    }
    setState((prev) => ({ ...prev, isConnecting: true }));
    try {
      const { uri, approve } = await state.adapter.connect();
      setState((prev) => ({ ...prev, pairingUri: uri }));
      const accounts = await approve();
      setState((prev) => ({
        ...prev,
        accounts,
        pairingUri: undefined,
      }));
    } finally {
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, [state.adapter]);

  const disconnect = useCallback(async () => {
    if (!state.adapter) return;
    await state.adapter.disconnect();
    setState((prev) => ({ ...prev, accounts: [], pairingUri: undefined }));
  }, [state.adapter]);

  const refreshAccounts = useCallback(async () => {
    if (!state.adapter) {
      throw new WalletIntegrationError("WalletConnect adapter not ready");
    }
    const accounts = await state.adapter.requestAccounts();
    setState((prev) => ({ ...prev, accounts }));
  }, [state.adapter]);

  const signTransaction = useCallback(
    async (
      transaction: Record<string, unknown>,
      walletParams?: Record<string, unknown>,
    ) => {
      if (!state.adapter) {
        throw new WalletIntegrationError("WalletConnect adapter not ready");
      }
      return state.adapter.signTransaction(transaction, walletParams);
    },
    [state.adapter],
  );

  const signAndBroadcast = useCallback(
    async (options: {
      client: QubicLiveClient;
      transaction: Record<string, unknown>;
      walletParams?: Record<string, unknown>;
      broadcastParams?: Record<string, unknown>;
    }) => {
      if (!state.adapter) {
        throw new WalletIntegrationError("WalletConnect adapter not ready");
      }
      return state.adapter.signAndBroadcast(options);
    },
    [state.adapter],
  );

  const signProcedureCall = useCallback(
    async (options: {
      call: ProcedureCall;
      transaction: ProcedureTransactionOverrides;
      walletParams?: Record<string, unknown>;
    }) => {
      if (!state.adapter) {
        throw new WalletIntegrationError("WalletConnect adapter not ready");
      }
      return state.adapter.signProcedure(options);
    },
    [state.adapter],
  );

  const signAndBroadcastProcedureCall = useCallback(
    async (options: {
      call: ProcedureCall;
      transaction: ProcedureTransactionOverrides;
      walletParams?: Record<string, unknown>;
      broadcastParams?: Record<string, unknown>;
      client: QubicLiveClient;
    }) => {
      if (!state.adapter) {
        throw new WalletIntegrationError("WalletConnect adapter not ready");
      }
      return state.adapter.signAndBroadcastProcedure(options);
    },
    [state.adapter],
  );

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      ...state,
      connect,
      disconnect,
      refreshAccounts,
      signTransaction,
      signAndBroadcast,
      signProcedureCall,
      signAndBroadcastProcedureCall,
    }),
    [
      state,
      connect,
      disconnect,
      refreshAccounts,
      signTransaction,
      signAndBroadcast,
      signProcedureCall,
      signAndBroadcastProcedureCall,
    ],
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
