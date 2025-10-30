/**
 * React Query hooks for WalletConnect transaction signing and broadcasting
 * @module react/query/walletconnect
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useWalletConnect } from "../providers";
import { useQubic } from "../providers";
import type {
  SignTransactionResult,
  ProcedureCall,
  ProcedureTransactionOverrides,
  BroadcastTransactionResponse,
} from "@nouslabs/sdk";
import { qubicQueryKeys } from "./hooks";

// ===== Types =====

export interface SignTransactionParams {
  from: string;
  to: string;
  amount: string;
  inputType?: number;
  payload?: string;
  walletParams?: Record<string, unknown>;
}

export interface SignAndBroadcastParams extends SignTransactionParams {
  broadcastParams?: Record<string, unknown>;
}

export interface SignProcedureParams {
  call: ProcedureCall;
  transaction: ProcedureTransactionOverrides;
  walletParams?: Record<string, unknown>;
}

export interface SignAndBroadcastProcedureParams extends SignProcedureParams {
  broadcastParams?: Record<string, unknown>;
}

// ===== Mutation Hooks =====

/**
 * Sign a transaction using WalletConnect
 */
export function useWCSignTransaction(
  options?: UseMutationOptions<
    SignTransactionResult,
    Error,
    SignTransactionParams
  >,
) {
  const wallet = useWalletConnect();

  return useMutation({
    mutationFn: async (params) => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      const { walletParams, ...transaction } = params;
      return wallet.adapter.signTransaction(transaction, walletParams);
    },
    ...options,
  });
}

/**
 * Sign and broadcast a transaction using WalletConnect
 */
export function useWCSignAndBroadcast(
  options?: UseMutationOptions<
    BroadcastTransactionResponse,
    Error,
    SignAndBroadcastParams
  >,
) {
  const wallet = useWalletConnect();
  const { live } = useQubic();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params) => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      const { walletParams, broadcastParams, ...transaction } = params;
      const result = await wallet.adapter.signAndBroadcast({
        client: live,
        transaction,
        walletParams,
        broadcastParams,
      });
      return result as BroadcastTransactionResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate balance for the sender
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.balance(variables.from),
      });
      // Invalidate balance for the receiver
      if (variables.to) {
        queryClient.invalidateQueries({
          queryKey: qubicQueryKeys.balance(variables.to),
        });
      }
      // Invalidate current tick
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.currentTick(),
      });
    },
    ...options,
  });
}

/**
 * Sign a smart contract procedure using WalletConnect
 */
export function useWCSignProcedure(
  options?: UseMutationOptions<
    SignTransactionResult,
    Error,
    SignProcedureParams
  >,
) {
  const wallet = useWalletConnect();

  return useMutation({
    mutationFn: async (params) => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      return wallet.adapter.signProcedure(params);
    },
    ...options,
  });
}

/**
 * Sign and broadcast a smart contract procedure using WalletConnect
 */
export function useWCSignAndBroadcastProcedure(
  options?: UseMutationOptions<
    BroadcastTransactionResponse,
    Error,
    SignAndBroadcastProcedureParams
  >,
) {
  const wallet = useWalletConnect();
  const { live } = useQubic();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params) => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      const result = await wallet.adapter.signAndBroadcastProcedure({
        ...params,
        client: live,
      });
      return result as BroadcastTransactionResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate balance for the sender
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.balance(variables.transaction.from),
      });
      // Invalidate balance for the receiver if specified
      if (variables.transaction.to) {
        queryClient.invalidateQueries({
          queryKey: qubicQueryKeys.balance(variables.transaction.to),
        });
      }
      // Invalidate current tick
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.currentTick(),
      });
    },
    ...options,
  });
}

/**
 * Request accounts from WalletConnect wallet
 */
export function useWCRequestAccounts(
  options?: UseMutationOptions<
    Array<{ identity: string; label?: string; publicKey?: string }>,
    Error,
    Record<string, unknown> | undefined
  >,
) {
  const wallet = useWalletConnect();

  return useMutation({
    mutationFn: async () => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      return await wallet.adapter.requestAccounts();
    },
    ...options,
  });
}

/**
 * Disconnect WalletConnect session
 */
export function useWCDisconnect(
  options?: UseMutationOptions<void, Error, void>,
) {
  const wallet = useWalletConnect();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      await wallet.adapter.disconnect();
    },
    onSuccess: () => {
      // Clear all Qubic-related queries on disconnect
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.all,
      });
    },
    ...options,
  });
}

// ===== High-Level Transaction Hooks =====

/**
 * Send QUBIC tokens using WalletConnect
 */
export function useWCSendQubic(
  options?: UseMutationOptions<
    BroadcastTransactionResponse,
    Error,
    {
      from: string;
      to: string;
      amount: string | number | bigint;
    }
  >,
) {
  const mutation = useWCSignAndBroadcast();

  return useMutation({
    mutationFn: async ({ from, to, amount }) => {
      return mutation.mutateAsync({
        from,
        to,
        amount: String(amount),
        inputType: 0,
      });
    },
    ...options,
  });
}

/**
 * Execute a smart contract function using WalletConnect
 */
export function useWCExecuteContract(
  options?: UseMutationOptions<
    BroadcastTransactionResponse,
    Error,
    {
      from: string;
      contractAddress: string;
      amount: string | number | bigint;
      inputType: number;
      payload: string;
    }
  >,
) {
  const mutation = useWCSignAndBroadcast();

  return useMutation({
    mutationFn: async ({
      from,
      contractAddress,
      amount,
      inputType,
      payload,
    }) => {
      return mutation.mutateAsync({
        from,
        to: contractAddress,
        amount: String(amount),
        inputType,
        payload,
      });
    },
    ...options,
  });
}

// ===== Helper Hook for Transaction Flow =====

/**
 * Complete transaction flow with WalletConnect: sign, wait for approval, broadcast
 * This matches the pattern from hm25-frontend
 */
export function useWCTransactionFlow() {
  const signMutation = useWCSignTransaction();
  const { live } = useQubic();
  const queryClient = useQueryClient();

  const executeTransaction = async (
    params: SignTransactionParams,
    onProgress?: (stage: "signing" | "broadcasting" | "complete") => void,
  ): Promise<BroadcastTransactionResponse> => {
    try {
      // Stage 1: Sign transaction
      onProgress?.("signing");
      const signed = await signMutation.mutateAsync(params);

      // Stage 2: Broadcast signed transaction
      onProgress?.("broadcasting");
      const result = await live.broadcast(signed.signedTransaction);

      // Stage 3: Complete
      onProgress?.("complete");

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.balance(params.from),
      });
      if (params.to) {
        queryClient.invalidateQueries({
          queryKey: qubicQueryKeys.balance(params.to),
        });
      }
      queryClient.invalidateQueries({
        queryKey: qubicQueryKeys.currentTick(),
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    executeTransaction,
    isLoading: signMutation.isPending,
    error: signMutation.error,
  };
}
