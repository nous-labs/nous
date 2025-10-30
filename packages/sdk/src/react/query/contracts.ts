/**
 * React Query hooks for Qubic smart contracts and procedures
 * @module react/query/contracts
 */

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useQubic } from "../providers";
import { useWalletConnect } from "../providers";
import {
  SmartContractQuery,
  createQuery,
  parseResponse,
} from "../../utils/smart-contract";
import {
  createProcedure,
  defineProcedure,
  procedureCallToTransaction,
  type ProcedureCall,
  type ProcedureTransactionOverrides,
  type DefinedProcedure,
} from "../../utils/procedures";
import type { QuerySmartContractResponse } from "../../types/common";

// ===== Query Keys =====

export const contractQueryKeys = {
  all: ["contract"] as const,
  queries: () => [...contractQueryKeys.all, "query"] as const,
  query: (contractIndex: number, inputType: number, input: string) =>
    [...contractQueryKeys.queries(), contractIndex, inputType, input] as const,
  procedures: () => [...contractQueryKeys.all, "procedure"] as const,
  procedure: (contractIndex: number, procedureIndex: number) =>
    [...contractQueryKeys.procedures(), contractIndex, procedureIndex] as const,
} as const;

// ===== Smart Contract Query Hooks =====

/**
 * Execute a smart contract query
 */
export function useContractQuery<T = QuerySmartContractResponse>(
  query: SmartContractQuery,

  options?: Omit<
    UseQueryOptions<QuerySmartContractResponse, Error, T, QueryKey>,
    "queryKey" | "queryFn"
  > & {
    select?: (data: QuerySmartContractResponse) => T;
  },
) {
  const { live } = useQubic();

  const built = query.build();
  const queryKey = contractQueryKeys.query(
    built.contractIndex,
    built.inputType,
    query.toHex(),
  );

  return useQuery({
    queryKey,
    queryFn: () => query.execute(live),
    staleTime: 5000, // 5 seconds default
    ...options,
  });
}

/**
 * Execute a smart contract query with automatic parsing
 */
export function useContractQueryWithParser<T>(
  query: SmartContractQuery,
  parser: (response: QuerySmartContractResponse) => T,
  options?: Omit<
    UseQueryOptions<QuerySmartContractResponse, Error, T, QueryKey>,
    "queryKey" | "queryFn" | "select"
  >,
) {
  return useContractQuery(query, {
    ...options,
    select: parser,
  });
}

/**
 * Build a contract query from scratch
 */
export function useContractQueryBuilder(
  contractIndex: number,
  inputType: number,
  buildQuery: (builder: SmartContractQuery) => void,
  options?: Omit<
    UseQueryOptions<
      QuerySmartContractResponse,
      Error,
      QuerySmartContractResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const query = createQuery(contractIndex, inputType);
  buildQuery(query);
  return useContractQuery(query, options);
}

// ===== Procedure Hooks =====

/**
 * Build a procedure call (without executing)
 */
export function useProcedureBuilder<TParams>(
  procedure: DefinedProcedure<TParams>,
) {
  return {
    build: (params: TParams) => procedure.build(params),
    encode: (params: TParams) => procedure.encode(params),
    toTransaction: (
      params: TParams,
      overrides: ProcedureTransactionOverrides,
    ) => procedureCallToTransaction(procedure.build(params), overrides),
  };
}

/**
 * Execute a procedure with WalletConnect
 */
export function useExecuteProcedure<TParams>(
  options?: UseMutationOptions<
    unknown,
    Error,
    {
      procedure: DefinedProcedure<TParams>;
      params: TParams;
      transaction: ProcedureTransactionOverrides;
      walletParams?: Record<string, unknown>;
      broadcastParams?: Record<string, unknown>;
    }
  >,
) {
  const { live } = useQubic();
  const wallet = useWalletConnect();

  return useMutation({
    mutationFn: async ({
      procedure,
      params,
      transaction,
      walletParams,
      broadcastParams,
    }) => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      const call = procedure.build(params);
      return wallet.adapter.signAndBroadcastProcedure({
        call,
        transaction,
        walletParams,
        broadcastParams,
        client: live,
      });
    },
    ...options,
  });
}

/**
 * Sign a procedure (without broadcasting)
 */
export function useSignProcedure<TParams>(
  options?: UseMutationOptions<
    any,
    Error,
    {
      procedure: DefinedProcedure<TParams>;
      params: TParams;
      transaction: ProcedureTransactionOverrides;
      walletParams?: Record<string, unknown>;
    }
  >,
) {
  const wallet = useWalletConnect();

  return useMutation({
    mutationFn: async ({ procedure, params, transaction, walletParams }) => {
      if (!wallet.adapter) {
        throw new Error("WalletConnect adapter not initialized");
      }
      const call = procedure.build(params);
      return wallet.adapter.signProcedure({
        call,
        transaction,
        walletParams,
      });
    },
    ...options,
  });
}

// ===== Common Contract Hooks =====

/**
 * Query QX contract (contract index 3)
 */
export function useQXQuery<T = QuerySmartContractResponse>(
  inputType: number,
  buildQuery: (builder: SmartContractQuery) => void,
  options?: Omit<
    UseQueryOptions<QuerySmartContractResponse, Error, T, QueryKey>,
    "queryKey" | "queryFn"
  > & {
    select?: (data: QuerySmartContractResponse) => T;
  },
) {
  const query = createQuery(3, inputType);
  buildQuery(query);
  return useContractQuery(query, options);
}

/**
 * Query Qearn contract (contract index 6)
 */
export function useQearnQuery<T = QuerySmartContractResponse>(
  inputType: number,
  buildQuery: (builder: SmartContractQuery) => void,
  options?: Omit<
    UseQueryOptions<QuerySmartContractResponse, Error, T, QueryKey>,
    "queryKey" | "queryFn"
  > & {
    select?: (data: QuerySmartContractResponse) => T;
  },
) {
  const query = createQuery(6, inputType);
  buildQuery(query);
  return useContractQuery(query, options);
}

/**
 * Query Quottery contract (contract index 7)
 */
export function useQuotteryQuery<T = QuerySmartContractResponse>(
  inputType: number,
  buildQuery: (builder: SmartContractQuery) => void,
  options?: Omit<
    UseQueryOptions<QuerySmartContractResponse, Error, T, QueryKey>,
    "queryKey" | "queryFn"
  > & {
    select?: (data: QuerySmartContractResponse) => T;
  },
) {
  const query = createQuery(7, inputType);
  buildQuery(query);
  return useContractQuery(query, options);
}

/**
 * Query Random contract (contract index 8)
 */
export function useRandomQuery<T = QuerySmartContractResponse>(
  inputType: number,
  buildQuery: (builder: SmartContractQuery) => void,
  options?: Omit<
    UseQueryOptions<QuerySmartContractResponse, Error, T, QueryKey>,
    "queryKey" | "queryFn"
  > & {
    select?: (data: QuerySmartContractResponse) => T;
  },
) {
  const query = createQuery(8, inputType);
  buildQuery(query);
  return useContractQuery(query, options);
}

// ===== Helper Types =====

export interface ContractQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ProcedureExecutionParams<TParams> {
  procedure: DefinedProcedure<TParams>;
  params: TParams;
  from: string;
  to: string;
  amount?: string;
}
