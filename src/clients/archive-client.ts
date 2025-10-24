// Archive service client for historical Qubic network data

import { BaseClient, type ClientConfig } from "./base-client.ts";
import type {
  GetLatestTickResponse,
  GetStatusResponse,
  GetComputorsResponse,
  GetTransactionResponse,
  GetTransactionResponseV2,
  GetTransactionStatusResponse,
  GetTickTransactionsResponse,
  GetTickTransactionsResponseV2,
  GetTickApprovedTransactionsResponse,
  GetTickDataResponse,
  GetChainHashResponse,
  GetQuorumTickDataResponse,
  GetTransferTransactionsPerTickResponse,
  GetIdentityTransfersInTickRangeResponseV2,
  GetEpochTickListResponseV2,
  GetEmptyTickListResponseV2,
  GetSendManyTransactionResponseV2,
  GetHealthCheckResponse,
} from "../types/responses.ts";

/**
 * Configuration for Archive client
 */
export interface ArchiveClientConfig extends Partial<ClientConfig> {
  /** Base URL for the API (default: https://rpc.qubic.org) */
  baseUrl?: string;
}

/**
 * Client for interacting with Qubic Archive API
 * Provides access to historical network data, transactions, and tick information
 */
export class ArchiveClient extends BaseClient {
  constructor(config?: ArchiveClientConfig) {
    super({
      baseUrl: config?.baseUrl ?? "https://rpc.qubic.org",
      headers: config?.headers,
      timeout: config?.timeout,
      fetchFn: config?.fetchFn,
    });
  }

  // ===== Status and Health =====

  /**
   * Get latest tick number
   * @returns Latest tick information
   * @deprecated Use getLastProcessedTick from QueryClient or getTickInfo from LiveClient instead
   */
  async getLatestTick(): Promise<GetLatestTickResponse> {
    return this.get<GetLatestTickResponse>("/v1/latestTick");
  }

  /**
   * Get archive status with processed ticks information
   * @returns Archive status
   * @deprecated Use getLastProcessedTick or getProcessedTickIntervals from QueryClient instead
   */
  async getStatus(): Promise<GetStatusResponse> {
    return this.get<GetStatusResponse>("/v1/status");
  }

  /**
   * Get health check status
   * @returns Health status
   * @deprecated Will be removed soon
   */
  async getHealthCheck(): Promise<GetHealthCheckResponse> {
    return this.get<GetHealthCheckResponse>("/v1/healthcheck");
  }

  // ===== Computors =====

  /**
   * Get computors list for an epoch
   * @param epoch - Epoch number
   * @returns Computors list
   * @deprecated Use getComputorsListForEpoch from QueryClient instead
   */
  async getComputors(epoch: number): Promise<GetComputorsResponse> {
    return this.get<GetComputorsResponse>(`/v1/epochs/${epoch}/computors`);
  }

  // ===== Transaction Operations =====

  /**
   * Get transaction by ID
   * @param txId - Transaction ID
   * @returns Transaction details
   * @deprecated Use getTransactionByHash from QueryClient instead
   */
  async getTransaction(txId: string): Promise<GetTransactionResponse> {
    return this.get<GetTransactionResponse>(`/v1/transactions/${txId}`);
  }

  /**
   * Get transaction by ID (v2 with additional metadata)
   * @param txId - Transaction ID
   * @returns Transaction details with timestamp and moneyFlew flag
   * @deprecated Use getTransactionByHash from QueryClient instead
   */
  async getTransactionV2(txId: string): Promise<GetTransactionResponseV2> {
    return this.get<GetTransactionResponseV2>(`/v2/transactions/${txId}`);
  }

  /**
   * Get transaction status
   * @param txId - Transaction ID
   * @returns Transaction status
   * @deprecated Use getTransactionByHash from QueryClient instead
   */
  async getTransactionStatus(
    txId: string
  ): Promise<GetTransactionStatusResponse> {
    return this.get<GetTransactionStatusResponse>(`/v1/tx-status/${txId}`);
  }

  /**
   * Get SendMany transaction details
   * @param txId - Transaction ID
   * @returns SendMany transaction details
   * @deprecated Will be removed soon
   */
  async getSendManyTransaction(
    txId: string
  ): Promise<GetSendManyTransactionResponseV2> {
    return this.get<GetSendManyTransactionResponseV2>(
      `/v2/transactions/${txId}/sendmany`
    );
  }

  // ===== Tick Transactions =====

  /**
   * Get all transactions for a tick
   * @param tickNumber - Tick number
   * @returns List of transactions
   * @deprecated Use getTransactionsForTick from QueryClient instead
   */
  async getTickTransactions(
    tickNumber: number
  ): Promise<GetTickTransactionsResponse> {
    return this.get<GetTickTransactionsResponse>(
      `/v1/ticks/${tickNumber}/transactions`
    );
  }

  /**
   * Get all transactions for a tick (v2 with additional metadata)
   * @param tickNumber - Tick number
   * @param params - Filter parameters
   * @returns List of transactions with metadata
   * @deprecated Use getTransactionsForTick from QueryClient instead
   */
  async getTickTransactionsV2(
    tickNumber: number,
    params?: {
      transfers?: boolean;
      approved?: boolean;
    }
  ): Promise<GetTickTransactionsResponseV2> {
    return this.get<GetTickTransactionsResponseV2>(
      `/v2/ticks/${tickNumber}/transactions`,
      params
    );
  }

  /**
   * Get transfer transactions for a tick
   * @param tickNumber - Tick number
   * @returns List of transfer transactions
   * @deprecated Use getTransactionsForTick from QueryClient instead
   */
  async getTickTransferTransactions(
    tickNumber: number
  ): Promise<GetTickTransactionsResponse> {
    return this.get<GetTickTransactionsResponse>(
      `/v1/ticks/${tickNumber}/transfer-transactions`
    );
  }

  /**
   * Get approved transactions for a tick
   * @param tickNumber - Tick number
   * @returns List of approved transactions
   * @deprecated Use getTransactionsForTick from QueryClient instead
   */
  async getTickApprovedTransactions(
    tickNumber: number
  ): Promise<GetTickApprovedTransactionsResponse> {
    return this.get<GetTickApprovedTransactionsResponse>(
      `/v1/ticks/${tickNumber}/approved-transactions`
    );
  }

  // ===== Identity Transactions =====

  /**
   * Get transfer transactions for an identity in a tick range
   * @param identity - Identity address
   * @param params - Query parameters
   * @returns Transfer transactions
   * @deprecated Use getTransactionsForIdentity from QueryClient instead
   */
  async getTransferTransactionsPerTick(
    identity: string,
    params?: {
      startTick?: number;
      endTick?: number;
    }
  ): Promise<GetTransferTransactionsPerTickResponse> {
    return this.get<GetTransferTransactionsPerTickResponse>(
      `/v1/identities/${identity}/transfer-transactions`,
      params
    );
  }

  /**
   * Get identity transfers in tick range (v2 with pagination)
   * @param identity - Identity address
   * @param params - Query parameters
   * @returns Transfer transactions with pagination
   * @deprecated Use getTransactionsForIdentity from QueryClient instead
   */
  async getIdentityTransfersInTickRangeV2(
    identity: string,
    params?: {
      startTick?: number;
      endTick?: number;
      scOnly?: boolean;
      desc?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<GetIdentityTransfersInTickRangeResponseV2> {
    return this.get<GetIdentityTransfersInTickRangeResponseV2>(
      `/v2/identities/${identity}/transfers`,
      params
    );
  }

  // ===== Tick Data =====

  /**
   * Get tick data
   * @param tickNumber - Tick number
   * @returns Tick data
   * @deprecated Use getTickData from QueryClient instead
   */
  async getTickData(tickNumber: number): Promise<GetTickDataResponse> {
    return this.get<GetTickDataResponse>(`/v1/ticks/${tickNumber}/tick-data`);
  }

  /**
   * Get chain hash for a tick
   * @param tickNumber - Tick number
   * @returns Chain hash
   * @deprecated Will be removed soon
   */
  async getChainHash(tickNumber: number): Promise<GetChainHashResponse> {
    return this.get<GetChainHashResponse>(
      `/v1/ticks/${tickNumber}/chain-hash`
    );
  }

  /**
   * Get chain hash for a tick (v2)
   * @param tickNumber - Tick number
   * @returns Chain hash
   * @deprecated Will be removed soon
   */
  async getTickChainHashV2(tickNumber: number): Promise<GetChainHashResponse> {
    return this.get<GetChainHashResponse>(`/v2/ticks/${tickNumber}/hash`);
  }

  /**
   * Get store hash for a tick
   * @param tickNumber - Tick number
   * @returns Store hash
   * @deprecated Will be removed soon
   */
  async getStoreHash(tickNumber: number): Promise<GetChainHashResponse> {
    return this.get<GetChainHashResponse>(
      `/v1/ticks/${tickNumber}/store-hash`
    );
  }

  /**
   * Get store hash for a tick (v2)
   * @param tickNumber - Tick number
   * @returns Store hash
   * @deprecated Will be removed soon
   */
  async getTickStoreHashV2(tickNumber: number): Promise<GetChainHashResponse> {
    return this.get<GetChainHashResponse>(
      `/v2/ticks/${tickNumber}/store-hash`
    );
  }

  /**
   * Get quorum tick data
   * @param tickNumber - Tick number
   * @returns Quorum tick data
   * @deprecated Will be removed soon
   */
  async getQuorumTickData(
    tickNumber: number
  ): Promise<GetQuorumTickDataResponse> {
    return this.get<GetQuorumTickDataResponse>(
      `/v1/ticks/${tickNumber}/quorum-tick-data`
    );
  }

  /**
   * Get quorum tick data (v2)
   * @param tickNumber - Tick number
   * @returns Quorum tick data
   * @deprecated Will be removed soon
   */
  async getTickQuorumDataV2(
    tickNumber: number
  ): Promise<GetQuorumTickDataResponse> {
    return this.get<GetQuorumTickDataResponse>(
      `/v2/ticks/${tickNumber}/quorum-data`
    );
  }

  // ===== Epoch Operations =====

  /**
   * Get tick list for an epoch (v2 with pagination)
   * @param epoch - Epoch number
   * @param params - Pagination parameters
   * @returns List of ticks with status
   * @deprecated Will be removed soon
   */
  async getEpochTickListV2(
    epoch: number,
    params?: {
      page?: number;
      pageSize?: number;
      desc?: boolean;
    }
  ): Promise<GetEpochTickListResponseV2> {
    return this.get<GetEpochTickListResponseV2>(
      `/v2/epochs/${epoch}/ticks`,
      params
    );
  }

  /**
   * Get empty tick list for an epoch (v2 with pagination)
   * @param epoch - Epoch number
   * @param params - Pagination parameters
   * @returns List of empty tick numbers
   * @deprecated Will be removed soon
   */
  async getEmptyTickListV2(
    epoch: number,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<GetEmptyTickListResponseV2> {
    return this.get<GetEmptyTickListResponseV2>(
      `/v2/epochs/${epoch}/empty-ticks`,
      params
    );
  }
}
