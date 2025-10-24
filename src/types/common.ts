// Common types used across Qubic APIs

/**
 * Standard RPC error response
 */
export interface RpcStatus {
  code: number;
  message: string;
  details?: Array<{
    "@type": string;
    [key: string]: any;
  }>;
}

/**
 * API error type
 */
export interface QubicApiError extends Error {
  status?: number;
  code?: number;
  details?: any[];
}

/**
 * Pagination request parameters
 */
export interface PaginationRequest {
  offset?: number;
  size?: number;
}

/**
 * Pagination response metadata
 */
export interface PaginationResponse {
  totalRecords?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  nextPage?: number;
  previousPage?: number;
}

/**
 * Hits information for search results
 */
export interface Hits {
  total: number;
  from: number;
  size: number;
}

/**
 * Range filter for queries
 */
export interface Range {
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
}

/**
 * Tick information
 */
export interface TickInfo {
  tick: number;
  duration: number;
  epoch: number;
  initialTick: number;
}

/**
 * Processed tick information
 */
export interface ProcessedTick {
  tickNumber: number;
  epoch: number;
}

/**
 * Processed tick interval
 */
export interface ProcessedTickInterval {
  epoch: number;
  firstTick: number;
  lastTick: number;
}

/**
 * Balance information for an identity
 */
export interface Balance {
  id: string;
  balance: string;
  validForTick: number;
  latestIncomingTransferTick: number;
  latestOutgoingTransferTick: number;
  incomingAmount: string;
  outgoingAmount: string;
  numberOfIncomingTransfers: number;
  numberOfOutgoingTransfers: number;
}

/**
 * Transaction structure
 */
export interface Transaction {
  hash?: string;
  txId?: string;
  sourceId?: string;
  source?: string;
  destId?: string;
  destination?: string;
  amount: string;
  tickNumber: number;
  timestamp?: string;
  inputType: number;
  inputSize: number;
  inputHex?: string;
  inputData?: string;
  signatureHex?: string;
  signature?: string;
  moneyFlew?: boolean;
}

/**
 * Transaction with additional metadata
 */
export interface TransactionData {
  transaction: Transaction;
  timestamp: string;
  moneyFlew: boolean;
}

/**
 * Tick data structure
 */
export interface TickData {
  tickNumber: number;
  epoch: number;
  computorIndex: number;
  timestamp: string;
  varStruct: string;
  timeLock: string;
  transactionIds?: string[];
  transactionHashes?: string[];
  contractFees: string[];
  signatureHex?: string;
  signature?: string;
}

/**
 * Asset information
 */
export interface AssetInfo {
  tick: number;
  universeIndex: number;
}

/**
 * Asset issuance data
 */
export interface AssetIssuanceData {
  issuerIdentity: string;
  type: number;
  name: string;
  numberOfDecimalPlaces: number;
  unitOfMeasurement: number[];
}

/**
 * Asset issuance with metadata
 */
export interface AssetIssuance {
  data: AssetIssuanceData;
  tick: number;
  universeIndex: number;
}

/**
 * Asset ownership data
 */
export interface AssetOwnershipData {
  ownerIdentity: string;
  type: number;
  managingContractIndex: number;
  issuanceIndex: number;
  numberOfUnits: string;
}

/**
 * Asset ownership with metadata
 */
export interface AssetOwnership {
  data: AssetOwnershipData;
  tick: number;
  universeIndex: number;
}

/**
 * Asset possession data
 */
export interface AssetPossessionData {
  possessorIdentity: string;
  type: number;
  managingContractIndex: number;
  ownershipIndex: number;
  numberOfUnits: string;
}

/**
 * Asset possession with metadata
 */
export interface AssetPossession {
  data: AssetPossessionData;
  tick: number;
  universeIndex: number;
}

/**
 * Issued asset
 */
export interface IssuedAsset {
  data: AssetIssuanceData;
  info: AssetInfo;
}

/**
 * Owned asset with issuance info
 */
export interface OwnedAsset {
  data: {
    ownerIdentity: string;
    type: number;
    padding?: number;
    managingContractIndex: number;
    issuanceIndex: number;
    numberOfUnits: string;
    issuedAsset?: AssetIssuanceData;
  };
  info: AssetInfo;
}

/**
 * Possessed asset with ownership info
 */
export interface PossessedAsset {
  data: {
    possessorIdentity: string;
    type: number;
    padding?: number;
    managingContractIndex: number;
    issuanceIndex: number;
    numberOfUnits: string;
    ownedAsset?: {
      ownerIdentity: string;
      type: number;
      padding?: number;
      managingContractIndex: number;
      issuanceIndex: number;
      numberOfUnits: string;
      issuedAsset?: AssetIssuanceData;
    };
  };
  info: AssetInfo;
}

/**
 * Computors list for an epoch
 */
export interface ComputorsList {
  epoch: number;
  tickNumber?: number;
  identities: string[];
  signature?: string;
  signatureHex?: string;
}

/**
 * Smart contract query request
 */
export interface QuerySmartContractRequest {
  contractIndex: number;
  inputType: number;
  inputSize: number;
  requestData: string;
}

/**
 * Smart contract query response
 */
export interface QuerySmartContractResponse {
  responseData: string;
}

/**
 * Broadcast transaction request
 */
export interface BroadcastTransactionRequest {
  encodedTransaction: string;
}

/**
 * Broadcast transaction response
 */
export interface BroadcastTransactionResponse {
  peersBroadcasted: number;
  encodedTransaction: string;
  transactionId: string;
}
