/**
 * React Query hooks for Qubic blockchain operations
 * @module react/query/hooks
 */

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useQubic } from "../providers.tsx";
import type {
  GetTickInfoResponse,
  GetTickDataResponse,
  GetBalanceResponse,
  GetTransactionsForIdentityResponse,
  BroadcastTransactionResponse,
  GetComputorsListForEpochResponse,
} from "../../types/index.ts";
import type {
  ProcedureCall,
  ProcedureTransactionOverrides,
} from "../../utils/procedures.ts";

// ===== Query Keys =====

export const qubicQueryKeys = {
  all: ["qubic"] as const,

  // Live client keys
  live: () => [...qubicQueryKeys.all, "live"] as const,
  tick: (tickNumber?: number) =>
    [...qubicQueryKeys.live(), "tick", tickNumber] as const,
  currentTick: () => [...qubicQueryKeys.live(), "tick", "current"] as const,
  transaction: (txId: string) =>
    [...qubicQueryKeys.live(), "transaction", txId] as const,
  balance: (address: string) =>
    [...qubicQueryKeys.live(), "balance", address] as const,
  quorumTickData: (tickNumber?: number) =>
    [...qubicQueryKeys.live(), "quorumTickData", tickNumber] as const,
  computorList: (epoch?: number) =>
    [...qubicQueryKeys.live(), "computorList", epoch] as const,
  health: () => [...qubicQueryKeys.live(), "health"] as const,

  // Query client keys
  query: () => [...qubicQueryKeys.all, "query"] as const,
  entity: (address: string) =>
    [...qubicQueryKeys.query(), "entity", address] as const,
  entities: () => [...qubicQueryKeys.query(), "entities"] as const,

  // Archive client keys
  archive: () => [...qubicQueryKeys.all, "archive"] as const,
  archivedTick: (tickNumber: number) =>
    [...qubicQueryKeys.archive(), "tick", tickNumber] as const,
  archivedTransaction: (txId: string) =>
    [...qubicQueryKeys.archive(), "transaction", txId] as const,
} as const;

// ===== Live Client Hooks =====

/**
 * Fetch current tick information
 */
export function useCurrentTick(
  options?: Omit<
    UseQueryOptions<GetTickInfoResponse, Error, GetTickInfoResponse, QueryKey>,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.currentTick(),
    queryFn: () => live.getTickInfo(),
    staleTime: 1000, // 1 second
    ...options,
  });
}

/**
 * Fetch specific tick information
 */
export function useTick(
  tickNumber: number,
  options?: Omit<
    UseQueryOptions<GetTickDataResponse, Error, GetTickDataResponse, QueryKey>,
    "queryKey" | "queryFn"
  >,
) {
  const { query } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.tick(tickNumber),
    queryFn: () => query.getTickData(tickNumber),
    staleTime: Infinity, // Historical data doesn't change
    ...options,
  });
}

/**
 * Fetch transactions for an identity (replaces transaction by ID since that endpoint doesn't exist)
 */
export function useTransactionsForIdentity(
  identity: string,
  options?: Omit<
    UseQueryOptions<
      GetTransactionsForIdentityResponse,
      Error,
      GetTransactionsForIdentityResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { query } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.transaction(identity),
    queryFn: () =>
      query.getTransactionsForIdentity(identity, {
        pagination: { offset: 0, size: 20 },
      }),
    enabled: !!identity && options?.enabled !== false,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Fetch balance for an address
 */
export function useBalance(
  address: string,
  options?: Omit<
    UseQueryOptions<GetBalanceResponse, Error, GetBalanceResponse, QueryKey>,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.balance(address),
    queryFn: () => live.getBalance(address),
    enabled: !!address && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

/**
 * Fetch computor list for an epoch
 */
export function useComputorList(
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      GetComputorsListForEpochResponse,
      Error,
      GetComputorsListForEpochResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { query } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.computorList(epoch),
    queryFn: () => query.getComputorsListForEpoch(epoch),
    enabled: epoch > 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data doesn't change
    ...options,
  });
}

// ===== Query Client Hooks =====

/**
 * Fetch entity transaction information by address
 */
export function useEntity(
  address: string,
  options?: Omit<
    UseQueryOptions<
      GetTransactionsForIdentityResponse,
      Error,
      GetTransactionsForIdentityResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { query } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.entity(address),
    queryFn: () =>
      query.getTransactionsForIdentity(address, {
        pagination: { offset: 0, size: 100 },
      }),
    enabled: !!address && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

// ===== Archive Client Hooks =====

/**
 * Fetch archived tick information
 */
export function useArchivedTick(
  tickNumber: number,
  options?: Omit<
    UseQueryOptions<GetTickDataResponse, Error, GetTickDataResponse, QueryKey>,
    "queryKey" | "queryFn"
  >,
) {
  const { archive } = useQubic();

  return useQuery({
    queryKey: qubicQueryKeys.archivedTick(tickNumber),
    queryFn: () => archive.getTickData(tickNumber),
    enabled: tickNumber > 0 && options?.enabled !== false,
    staleTime: Infinity, // Archived data doesn't change
    ...options,
  });
}

// ===== Mutation Hooks =====

/**
 * Broadcast a transaction to the network
 */
export function useBroadcastTransaction(
  options?: UseMutationOptions<
    BroadcastTransactionResponse,
    Error,
    { encodedTransaction: string }
  >,
) {
  const { live } = useQubic();

  return useMutation({
    mutationFn: ({ encodedTransaction }) =>
      live.broadcastTransaction({ encodedTransaction }),
    ...options,
  });
}

/**
 * Execute a smart contract procedure call
 */
export function useProcedureCall(
  options?: UseMutationOptions<
    any,
    Error,
    {
      call: ProcedureCall;
      transaction: ProcedureTransactionOverrides;
    }
  >,
) {
  const { live } = useQubic();

  return useMutation({
    mutationFn: async ({ call, transaction }) => {
      // This hook is for procedure execution
      // Actual implementation depends on how procedures are executed
      // You may need to integrate with wallet for signing
      throw new Error(
        "Procedure call requires wallet integration. Use useWalletConnect hooks instead.",
      );
    },
    ...options,
  });
}

// ===== Utility Hooks =====

/**
 * Poll current tick at specified interval
 */
export function useTickPoller(intervalMs = 1000) {
  return useCurrentTick({
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
  });
}

/**
 * Poll balance at specified interval
 */
export function useBalancePoller(address: string, intervalMs = 5000) {
  return useBalance(address, {
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
  });
}
