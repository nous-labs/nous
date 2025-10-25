// Qubic TypeScript SDK - Main Entry Point
// A comprehensive TypeScript library for Qubic blockchain integration

// ===== Clients =====
import { QubicLiveClient } from "./clients/qubic-live-client.ts";
import { ArchiveClient } from "./clients/archive-client.ts";
import { QueryClient } from "./clients/query-client.ts";

export { QubicLiveClient } from "./clients/qubic-live-client.ts";
export type { QubicLiveClientConfig } from "./clients/qubic-live-client.ts";

export { ArchiveClient } from "./clients/archive-client.ts";
export type { ArchiveClientConfig } from "./clients/archive-client.ts";

export { QueryClient } from "./clients/query-client.ts";
export type { QueryClientConfig } from "./clients/query-client.ts";

export { BaseClient } from "./clients/base-client.ts";
export type { ClientConfig } from "./clients/base-client.ts";

// ===== Types =====
export type * from "./types/index.ts";

// ===== Utilities =====
export {
  hexToBase64,
  base64ToHex,
  bytesToBase64,
  base64ToBytes,
  bytesToHex,
  hexToBytes,
  stringToHex,
  hexToString,
  padHex,
  encodeInt64LE,
  decodeInt64LE,
  encodeInt32LE,
  decodeInt32LE,
  encodeInt16LE,
  decodeInt16LE,
  encodeByte,
  decodeByte,
  zeros,
  concatHex,
  sliceHex,
  getHexByteLength,
  isValidHex,
  isValidBase64,
} from "./utils/encoding.ts";

export {
  SmartContractQuery,
  SmartContractResponse,
  createQuery,
  parseResponse,
  queryContract,
  QUBIC_CONTRACTS,
  queryQuottery,
  queryQutil,
  queryQX,
  queryRandom,
  queryMyLastMatch,
  queryGQMP,
  queryQbay,
  queryQdraw,
  queryQearn,
  queryQswap,
  queryQvault,
  queryQbond,
  queryMsVault,
  queryNostromo,
  queryRandomLottery,
  querySupplyWatcher,
  queryCCF,
} from "./utils/smart-contract.ts";

// ===== Wallet helpers =====
export * from "./wallet/index.ts";
export * from "./wallet/walletconnect.ts";

// ===== React helpers =====
export * from "./react/index.ts";

// ===== Default Export =====
/**
 * Create a new Qubic client with all services
 */
export function createQubicClient(config?: {
  liveUrl?: string;
  archiveUrl?: string;
  queryUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}) {
  return {
    live: new QubicLiveClient({
      baseUrl: config?.liveUrl,
      timeout: config?.timeout,
      headers: config?.headers,
    }),
    archive: new ArchiveClient({
      baseUrl: config?.archiveUrl,
      timeout: config?.timeout,
      headers: config?.headers,
    }),
    query: new QueryClient({
      baseUrl: config?.queryUrl,
      timeout: config?.timeout,
      headers: config?.headers,
    }),
  };
}

// Default instance for convenience
export const qubic = createQubicClient();
// Export validation utilities
export * from "./utils/validation.ts";
export * from "./utils/procedures.ts";
