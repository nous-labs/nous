// Response types for Qubic API endpoints

import type {
  Balance,
  TickInfo,
  Transaction,
  TransactionData,
  TickData,
  AssetIssuance,
  AssetOwnership,
  AssetPossession,
  IssuedAsset,
  OwnedAsset,
  PossessedAsset,
  ComputorsList,
  QuerySmartContractResponse,
  BroadcastTransactionResponse,
  ProcessedTick,
  ProcessedTickInterval,
  PaginationResponse,
  Hits,
} from "./common";

// ===== QubicLiveService Responses =====

export interface GetBalanceResponse {
  balance: Balance;
}

export interface GetTickInfoResponse {
  tickInfo: TickInfo;
}

export interface GetBlockHeightResponse {
  blockHeight: TickInfo;
}

export interface GetIssuedAssetsByFilterResponse {
  assets: AssetIssuance[];
}

export interface GetIssuedAssetByUniverseIndexResponse {
  data: {
    issuerIdentity: string;
    type: number;
    name: string;
    numberOfDecimalPlaces: number;
    unitOfMeasurement: number[];
  };
  tick: number;
  universeIndex: number;
}

export interface GetOwnedAssetsByFilterResponse {
  assets: AssetOwnership[];
}

export interface GetOwnedAssetByUniverseIndexResponse {
  data: {
    ownerIdentity: string;
    type: number;
    managingContractIndex: number;
    issuanceIndex: number;
    numberOfUnits: string;
  };
  tick: number;
  universeIndex: number;
}

export interface GetPossessedAssetsByFilterResponse {
  assets: AssetPossession[];
}

export interface GetPossessedAssetByUniverseIndexResponse {
  data: {
    possessorIdentity: string;
    type: number;
    managingContractIndex: number;
    ownershipIndex: number;
    numberOfUnits: string;
  };
  tick: number;
  universeIndex: number;
}

export interface GetIssuedAssetsResponse {
  issuedAssets: IssuedAsset[];
}

export interface GetOwnedAssetsResponse {
  ownedAssets: OwnedAsset[];
}

export interface GetPossessedAssetsResponse {
  possessedAssets: PossessedAsset[];
}

// ===== ArchiveService Responses =====

export interface GetLatestTickResponse {
  latestTick: number;
}

export interface GetStatusResponse {
  lastProcessedTick: ProcessedTick;
  lastProcessedTicksPerEpoch: Record<string, number>;
  skippedTicks: Array<{
    startTick: number;
    endTick: number;
  }>;
  processedTickIntervalsPerEpoch: Array<{
    epoch: number;
    intervals: Array<{
      initialProcessedTick: number;
      lastProcessedTick: number;
    }>;
  }>;
  emptyTicksPerEpoch: Record<string, number>;
}

export interface GetComputorsResponse {
  computors: ComputorsList;
}

export interface GetTransactionResponse {
  transaction: Transaction;
}

export interface GetTransactionResponseV2 {
  transaction: Transaction;
  timestamp: string;
  moneyFlew: boolean;
}

export interface GetTransactionStatusResponse {
  transactionStatus: {
    txId: string;
    moneyFlew: boolean;
  };
}

export interface GetTickTransactionsResponse {
  transactions: Transaction[];
}

export interface GetTickTransactionsResponseV2 {
  transactions: TransactionData[];
}

export interface GetTickApprovedTransactionsResponse {
  approvedTransactions: Transaction[];
}

export interface GetTickDataResponse {
  tickData: TickData;
}

export interface GetChainHashResponse {
  hexDigest: string;
}

export interface GetQuorumTickDataResponse {
  quorumTickData: {
    quorumTickStructure: {
      epoch: number;
      tickNumber: number;
      timestamp: string;
      prevResourceTestingDigestHex: string;
      prevSpectrumDigestHex: string;
      prevUniverseDigestHex: string;
      prevComputerDigestHex: string;
      txDigestHex: string;
      prevTransactionBodyHex: string;
    };
    quorumDiffPerComputor: Record<
      string,
      {
        saltedResourceTestingDigestHex: string;
        saltedSpectrumDigestHex: string;
        saltedUniverseDigestHex: string;
        saltedComputerDigestHex: string;
        expectedNextTickTxDigestHex: string;
        signatureHex: string;
        saltedTransactionBodyHex: string;
      }
    >;
  };
}

export interface GetTransferTransactionsPerTickResponse {
  transferTransactionsPerTick: Array<{
    tickNumber: number;
    identity: string;
    transactions: Transaction[];
  }>;
}

export interface GetIdentityTransfersInTickRangeResponseV2 {
  pagination: PaginationResponse;
  transactions: Array<{
    tickNumber: number;
    identity: string;
    transactions: TransactionData[];
  }>;
}

export interface GetEpochTickListResponseV2 {
  pagination: PaginationResponse;
  ticks: Array<{
    tickNumber: number;
    isEmpty: boolean;
  }>;
}

export interface GetEmptyTickListResponseV2 {
  pagination: PaginationResponse;
  emptyTicks: number[];
}

export interface GetSendManyTransactionResponseV2 {
  transaction: {
    sourceId: string;
    tickNumber: number;
    transfers: Array<{
      destId: string;
      amount: string;
    }>;
    totalAmount: string;
    signatureHex: string;
    txId: string;
  };
  timestamp: string;
  moneyFlew: boolean;
}

export interface GetHealthCheckResponse {
  status: boolean;
}

// ===== ArchiveQueryService Responses =====

export interface GetLastProcessedTickResponse {
  tickNumber: number;
}

export interface GetProcessedTickIntervalsResponse {
  processedTicksIntervals: ProcessedTickInterval[];
}

export interface GetComputorsListForEpochResponse {
  computorsLists: ComputorsList[];
}

export interface GetTransactionsForTickResponse {
  transactions: Transaction[];
}

export interface GetTransactionsForIdentityResponse {
  validForTick: number;
  hits: Hits;
  transactions: Transaction[];
}

export interface GetTransactionByHashResponse {
  transaction: Transaction;
}
