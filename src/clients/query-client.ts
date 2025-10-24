// Query service client for advanced querying of Qubic network data

import { BaseClient, type ClientConfig } from "./base-client.ts";
import type {
  PaginationRequest,
  Range,
  ProcessedTickInterval,
  Transaction,
} from "../types/common.ts";
import type {
  GetLastProcessedTickResponse,
  GetComputorsListForEpochResponse,
  GetTickDataResponse,
  GetTransactionsForTickResponse,
  GetTransactionsForIdentityResponse,
} from "../types/responses.ts";

/**
 * Configuration for Query client
 */
export interface QueryClientConfig extends Partial<ClientConfig> {
  /** Base URL for the API (default: https://api.qubic.org) */
  baseUrl?: string;
}

/**
 * Request for getting computors list for an epoch
 */
export interface GetComputorsListForEpochRequest {
  epoch: number;
}

/**
 * Request for getting tick data
 */
export interface GetTickDataRequest {
  tickNumber: number;
}

/**
 * Request for getting transaction by hash
 */
export interface GetTransactionByHashRequest {
  hash: string;
}

/**
 * Request for getting transactions for a tick
 */
export interface GetTransactionsForTickRequest {
  tickNumber: number;
}

/**
 * Request for getting transactions for an identity
 */
export interface GetTransactionsForIdentityRequest {
  identity: string;
  filters?: Record<string, string>;
  ranges?: Record<string, Range>;
  pagination?: PaginationRequest;
}

/**
 * Client for interacting with Qubic Archive Query API
 * Provides advanced querying capabilities for historical data
 */
export class QueryClient extends BaseClient {
  constructor(config?: QueryClientConfig) {
    super({
      baseUrl: config?.baseUrl ?? "https://api.qubic.org",
      headers: config?.headers,
      timeout: config?.timeout,
      fetchFn: config?.fetchFn,
    });
  }

  // ===== Tick Information =====

  /**
   * Get the last processed tick in the archive
   * @returns Last processed tick number
   */
  async getLastProcessedTick(): Promise<GetLastProcessedTickResponse> {
    return this.get<GetLastProcessedTickResponse>("/getLastProcessedTick");
  }

  /**
   * Get processed tick intervals showing which ranges of ticks are available in the archive
   * @returns Array of processed tick intervals
   */
  async getProcessedTickIntervals(): Promise<ProcessedTickInterval[]> {
    return this.get<ProcessedTickInterval[]>("/getProcessedTicksIntervals");
  }

  /**
   * Get detailed data for a specific tick
   * @param tickNumber - Tick number to query
   * @returns Tick data including transactions and metadata
   */
  async getTickData(tickNumber: number): Promise<GetTickDataResponse> {
    return this.post<GetTickDataResponse, GetTickDataRequest>(
      "/getTickData",
      { tickNumber }
    );
  }

  // ===== Computors =====

  /**
   * Get computors lists for a specific epoch
   * @param epoch - Epoch number
   * @returns List of computors for the epoch
   */
  async getComputorsListForEpoch(
    epoch: number
  ): Promise<GetComputorsListForEpochResponse> {
    return this.post<
      GetComputorsListForEpochResponse,
      GetComputorsListForEpochRequest
    >("/getComputorListsForEpoch", { epoch });
  }

  // ===== Transaction Operations =====

  /**
   * Get a transaction by its hash
   * @param hash - Transaction hash
   * @returns Transaction details
   */
  async getTransactionByHash(hash: string): Promise<Transaction> {
    return this.post<Transaction, GetTransactionByHashRequest>(
      "/getTransactionByHash",
      { hash }
    );
  }

  /**
   * Get all transactions for a specific tick
   * @param tickNumber - Tick number
   * @returns Array of transactions
   */
  async getTransactionsForTick(tickNumber: number): Promise<Transaction[]> {
    return this.post<Transaction[], GetTransactionsForTickRequest>(
      "/getTransactionsForTick",
      { tickNumber }
    );
  }

  /**
   * Get transactions for a specific identity with advanced filtering
   * @param identity - Identity address
   * @param options - Filter and pagination options
   * @returns Transactions with pagination metadata
   */
  async getTransactionsForIdentity(
    identity: string,
    options?: {
      filters?: Record<string, string>;
      ranges?: Record<string, Range>;
      pagination?: PaginationRequest;
    }
  ): Promise<GetTransactionsForIdentityResponse> {
    return this.post<
      GetTransactionsForIdentityResponse,
      GetTransactionsForIdentityRequest
    >("/getTransactionsForIdentity", {
      identity,
      filters: options?.filters,
      ranges: options?.ranges,
      pagination: options?.pagination,
    });
  }

  /**
   * Get transactions for an identity with tick range filter
   * @param identity - Identity address
   * @param startTick - Start tick number (inclusive)
   * @param endTick - End tick number (inclusive)
   * @param pagination - Pagination options
   * @returns Transactions within the tick range
   */
  async getTransactionsForIdentityInRange(
    identity: string,
    startTick?: number,
    endTick?: number,
    pagination?: PaginationRequest
  ): Promise<GetTransactionsForIdentityResponse> {
    const ranges: Record<string, Range> = {};

    if (startTick !== undefined || endTick !== undefined) {
      ranges.tickNumber = {};
      if (startTick !== undefined) {
        ranges.tickNumber.gte = String(startTick);
      }
      if (endTick !== undefined) {
        ranges.tickNumber.lte = String(endTick);
      }
    }

    return this.getTransactionsForIdentity(identity, {
      ranges,
      pagination,
    });
  }

  /**
   * Get paginated transactions for an identity
   * @param identity - Identity address
   * @param offset - Pagination offset
   * @param size - Number of results per page
   * @returns Paginated transactions
   */
  async getTransactionsForIdentityPaginated(
    identity: string,
    offset: number = 0,
    size: number = 20
  ): Promise<GetTransactionsForIdentityResponse> {
    return this.getTransactionsForIdentity(identity, {
      pagination: { offset, size },
    });
  }
}
