// QubicLive service client for real-time Qubic network data

import { BaseClient, type ClientConfig } from "./base-client";
import type {
  QuerySmartContractRequest,
  QuerySmartContractResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
} from "../types/common";
import type {
  GetBalanceResponse,
  GetTickInfoResponse,
  GetBlockHeightResponse,
  GetIssuedAssetsByFilterResponse,
  GetIssuedAssetByUniverseIndexResponse,
  GetOwnedAssetsByFilterResponse,
  GetOwnedAssetByUniverseIndexResponse,
  GetPossessedAssetsByFilterResponse,
  GetPossessedAssetByUniverseIndexResponse,
  GetIssuedAssetsResponse,
  GetOwnedAssetsResponse,
  GetPossessedAssetsResponse,
} from "../types/responses";

/**
 * Configuration for QubicLive client
 */
export interface QubicLiveClientConfig extends Partial<ClientConfig> {
  /** Base URL for the API (default: https://rpc.qubic.org) */
  baseUrl?: string;
}

/**
 * Client for interacting with Qubic Live API
 * Provides real-time access to network state, balances, assets, and smart contracts
 */
export class QubicLiveClient extends BaseClient {
  constructor(config?: QubicLiveClientConfig) {
    super({
      baseUrl: config?.baseUrl ?? "https://rpc.qubic.org",
      headers: config?.headers,
      timeout: config?.timeout,
      fetchFn: config?.fetchFn,
    });
  }

  // ===== Tick Information =====

  /**
   * Get current tick information
   * @returns Current tick info including tick number, duration, epoch
   */
  async getTickInfo(): Promise<GetTickInfoResponse> {
    return this.get<GetTickInfoResponse>("/v1/tick-info");
  }

  /**
   * Get block height (deprecated, use getTickInfo instead)
   * @returns Block height information
   * @deprecated Use getTickInfo() instead
   */
  async getBlockHeight(): Promise<GetBlockHeightResponse> {
    return this.get<GetBlockHeightResponse>("/v1/block-height");
  }

  // ===== Balance Operations =====

  /**
   * Get balance for an identity
   * @param id - Identity address
   * @returns Balance information
   */
  async getBalance(id: string): Promise<GetBalanceResponse> {
    return this.get<GetBalanceResponse>(`/v1/balances/${id}`);
  }

  // ===== Asset Issuance Operations =====

  /**
   * Get issued assets by filter
   * @param params - Filter parameters
   * @returns List of issued assets
   */
  async getIssuedAssetsByFilter(params?: {
    issuerIdentity?: string;
    assetName?: string;
  }): Promise<GetIssuedAssetsByFilterResponse> {
    return this.get<GetIssuedAssetsByFilterResponse>(
      "/v1/assets/issuances",
      params
    );
  }

  /**
   * Get issued asset by universe index
   * @param index - Universe index
   * @returns Asset issuance details
   */
  async getIssuedAssetByUniverseIndex(
    index: number
  ): Promise<GetIssuedAssetByUniverseIndexResponse> {
    return this.get<GetIssuedAssetByUniverseIndexResponse>(
      `/v1/assets/issuances/${index}`
    );
  }

  /**
   * Get all assets issued by an identity
   * @param identity - Issuer identity address
   * @returns List of issued assets
   */
  async getIssuedAssets(identity: string): Promise<GetIssuedAssetsResponse> {
    return this.get<GetIssuedAssetsResponse>(`/v1/assets/${identity}/issued`);
  }

  // ===== Asset Ownership Operations =====

  /**
   * Get owned assets by filter
   * @param params - Filter parameters
   * @returns List of owned assets
   */
  async getOwnedAssetsByFilter(params?: {
    issuerIdentity?: string;
    assetName?: string;
    ownerIdentity?: string;
    ownershipManagingContract?: number;
  }): Promise<GetOwnedAssetsByFilterResponse> {
    return this.get<GetOwnedAssetsByFilterResponse>(
      "/v1/assets/ownerships",
      params
    );
  }

  /**
   * Get owned asset by universe index
   * @param index - Universe index
   * @returns Asset ownership details
   */
  async getOwnedAssetByUniverseIndex(
    index: number
  ): Promise<GetOwnedAssetByUniverseIndexResponse> {
    return this.get<GetOwnedAssetByUniverseIndexResponse>(
      `/v1/assets/ownerships/${index}`
    );
  }

  /**
   * Get all assets owned by an identity
   * @param identity - Owner identity address
   * @returns List of owned assets
   */
  async getOwnedAssets(identity: string): Promise<GetOwnedAssetsResponse> {
    return this.get<GetOwnedAssetsResponse>(`/v1/assets/${identity}/owned`);
  }

  // ===== Asset Possession Operations =====

  /**
   * Get possessed assets by filter
   * @param params - Filter parameters
   * @returns List of possessed assets
   */
  async getPossessedAssetsByFilter(params?: {
    issuerIdentity?: string;
    assetName?: string;
    ownerIdentity?: string;
    possessorIdentity?: string;
    ownershipManagingContract?: number;
    possessionManagingContract?: number;
  }): Promise<GetPossessedAssetsByFilterResponse> {
    return this.get<GetPossessedAssetsByFilterResponse>(
      "/v1/assets/possessions",
      params
    );
  }

  /**
   * Get possessed asset by universe index
   * @param index - Universe index
   * @returns Asset possession details
   */
  async getPossessedAssetByUniverseIndex(
    index: number
  ): Promise<GetPossessedAssetByUniverseIndexResponse> {
    return this.get<GetPossessedAssetByUniverseIndexResponse>(
      `/v1/assets/possessions/${index}`
    );
  }

  /**
   * Get all assets possessed by an identity
   * @param identity - Possessor identity address
   * @returns List of possessed assets
   */
  async getPossessedAssets(
    identity: string
  ): Promise<GetPossessedAssetsResponse> {
    return this.get<GetPossessedAssetsResponse>(
      `/v1/assets/${identity}/possessed`
    );
  }

  // ===== Smart Contract Operations =====

  /**
   * Query a smart contract
   * @param request - Smart contract query request
   * @returns Smart contract response data
   */
  async querySmartContract(
    request: QuerySmartContractRequest
  ): Promise<QuerySmartContractResponse> {
    return this.post<QuerySmartContractResponse, QuerySmartContractRequest>(
      "/v1/querySmartContract",
      request
    );
  }

  /**
   * Query a smart contract with simplified parameters
   * @param contractIndex - Contract index
   * @param inputType - Input type identifier
   * @param requestData - Request data (base64 or hex encoded)
   * @param inputSize - Optional input size (calculated from requestData if not provided)
   * @returns Smart contract response data
   */
  async queryContract(
    contractIndex: number,
    inputType: number,
    requestData: string,
    inputSize?: number
  ): Promise<QuerySmartContractResponse> {
    const size = inputSize ?? Math.ceil(requestData.length / 2);
    return this.querySmartContract({
      contractIndex,
      inputType,
      inputSize: size,
      requestData,
    });
  }

  // ===== Transaction Operations =====

  /**
   * Broadcast a transaction to the network
   * @param request - Broadcast transaction request
   * @returns Broadcast result with transaction ID
   */
  async broadcastTransaction(
    request: BroadcastTransactionRequest
  ): Promise<BroadcastTransactionResponse> {
    return this.post<
      BroadcastTransactionResponse,
      BroadcastTransactionRequest
    >("/v1/broadcast-transaction", request);
  }

  /**
   * Broadcast a transaction with simplified parameters
   * @param encodedTransaction - Encoded transaction string
   * @returns Broadcast result with transaction ID
   */
  async broadcast(
    encodedTransaction: string
  ): Promise<BroadcastTransactionResponse> {
    return this.broadcastTransaction({ encodedTransaction });
  }
}
