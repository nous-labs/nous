// Smart contract helper utilities for Qubic

import type { QubicLiveClient } from "../clients/qubic-live-client.ts";
import type { QuerySmartContractResponse } from "../types/common.ts";
import {
  hexToBase64,
  base64ToHex,
  encodeInt64LE,
  decodeInt64LE,
  encodeInt32LE,
  decodeInt32LE,
  encodeInt16LE,
  decodeInt16LE,
  bytesToHex,
  hexToBytes,
  concatHex,
  sliceHex,
  getHexByteLength,
  padHex,
} from "./encoding.ts";
import { identityBytesToString, identityToBytes } from "./identity.ts";

/**
 * Smart contract query builder for simplified contract interactions
 */
export class SmartContractQuery {
  protected contractIndex: number;
  protected inputType: number;
  protected dataHex: string = "";

  constructor(contractIndex: number, inputType: number) {
    this.contractIndex = contractIndex;
    this.inputType = inputType;
  }

  /**
   * Add raw hex data to the query
   */
  addHex(hex: string): this {
    this.dataHex = concatHex(this.dataHex, hex);
    return this;
  }

  /**
   * Add a byte value
   */
  addByte(value: number): this {
    return this.addHex(value.toString(16).padStart(2, "0"));
  }

  /**
   * Add a 16-bit integer (little-endian)
   */
  addInt16(value: number): this {
    return this.addHex(encodeInt16LE(value));
  }

  /**
   * Add a 32-bit integer (little-endian)
   */
  addInt32(value: number): this {
    return this.addHex(encodeInt32LE(value));
  }

  /**
   * Add a 64-bit integer (little-endian)
   */
  addInt64(value: number | bigint): this {
    return this.addHex(encodeInt64LE(value));
  }

  /**
   * Add a string as UTF-8 bytes
   */
  addString(str: string, byteLength?: number): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let hex = bytesToHex(bytes);

    if (byteLength !== undefined) {
      hex = padHex(hex, byteLength, false);
    }

    return this.addHex(hex);
  }

  /**
   * Add padding zeros
   */
  addPadding(byteLength: number): this {
    return this.addHex("0".repeat(byteLength * 2));
  }

  /**
   * Add an identity address (encoded to 32-byte public key form)
   */
  addIdentity(identity: string): this {
    const bytes = identityToBytes(identity);
    return this.addHex(bytesToHex(bytes));
  }

  /**
   * Get the built request data as base64
   */
  toBase64(): string {
    return hexToBase64(this.dataHex);
  }

  /**
   * Get the raw hex payload
   */
  toHex(): string {
    return this.dataHex;
  }

  /**
   * Get the input size in bytes
   */
  getInputSize(): number {
    return getHexByteLength(this.dataHex);
  }

  /**
   * Build the query request object
   */
  build(): {
    contractIndex: number;
    inputType: number;
    inputSize: number;
    requestData: string;
  } {
    return {
      contractIndex: this.contractIndex,
      inputType: this.inputType,
      inputSize: this.getInputSize(),
      requestData: this.toBase64(),
    };
  }

  /**
   * Execute the query using a QubicLiveClient
   */
  async execute(client: QubicLiveClient): Promise<QuerySmartContractResponse> {
    return client.querySmartContract(this.build());
  }
}

/**
 * Smart contract response parser for decoding contract responses
 */
export class SmartContractResponse {
  private dataHex: string;
  private offset: number = 0;

  constructor(responseData: string) {
    // Response data can be base64 or hex
    this.dataHex =
      responseData.includes("+") || responseData.includes("/")
        ? base64ToHex(responseData)
        : responseData;
  }

  /**
   * Get the current offset position
   */
  getOffset(): number {
    return this.offset;
  }

  /**
   * Set the offset position
   */
  setOffset(offset: number): this {
    this.offset = offset;
    return this;
  }

  /**
   * Skip bytes
   */
  skip(byteLength: number): this {
    this.offset += byteLength;
    return this;
  }

  /**
   * Read raw hex data
   */
  readHex(byteLength: number): string {
    const hex = sliceHex(this.dataHex, this.offset, this.offset + byteLength);
    this.offset += byteLength;
    return hex;
  }

  /**
   * Read a byte value
   */
  readByte(): number {
    const hex = this.readHex(1);
    return parseInt(hex, 16);
  }

  /**
   * Read a 16-bit integer (little-endian)
   */
  readInt16(): number {
    const hex = this.readHex(2);
    return decodeInt16LE(hex);
  }

  /**
   * Read a 32-bit integer (little-endian)
   */
  readInt32(): number {
    const hex = this.readHex(4);
    return decodeInt32LE(hex);
  }

  /**
   * Read a 64-bit integer (little-endian)
   */
  readInt64(): bigint {
    const hex = this.readHex(8);
    return decodeInt64LE(hex);
  }

  /**
   * Read a string
   */
  readString(byteLength: number): string {
    const hex = this.readHex(byteLength);
    const bytes = hexToBytes(hex);
    const decoder = new TextDecoder();
    // Remove null bytes
    const text = decoder.decode(bytes);
    return text.replace(/\0/g, "");
  }

  /**
   * Read an identity (32-byte public key converted to the 60-char form)
   */
  readIdentity(): string {
    const bytes = hexToBytes(this.readHex(32));

    if (!bytes || bytes.length !== 32 || bytes.every((b) => b === 0)) {
      return "";
    }

    try {
      return identityBytesToString(bytes);
    } catch (err) {
      console.warn(
        "Skipping invalid identity (not 32 bytes or checksum failed):",
        bytes,
        err instanceof Error ? err.message : err,
      );
      return "";
    }
  }

  /**
   * Read remaining data as hex
   */
  readRemaining(): string {
    return sliceHex(this.dataHex, this.offset);
  }

  /**
   * Get the full response data as hex
   */
  toHex(): string {
    return this.dataHex;
  }

  /**
   * Get the full response data as bytes
   */
  toBytes(): Uint8Array {
    return hexToBytes(this.dataHex);
  }

  /**
   * Check if there's more data to read
   */
  hasMore(): boolean {
    return this.offset < getHexByteLength(this.dataHex);
  }

  /**
   * Get remaining byte count
   */
  remainingBytes(): number {
    return getHexByteLength(this.dataHex) - this.offset;
  }
}

/**
 * Helper function to create a smart contract query
 */
export function createQuery(
  contractIndex: number,
  inputType: number,
): SmartContractQuery {
  return new SmartContractQuery(contractIndex, inputType);
}

/**
 * Helper function to parse a smart contract response
 */
export function parseResponse(responseData: string): SmartContractResponse {
  return new SmartContractResponse(responseData);
}

/**
 * Query a smart contract with simplified parameters
 */
export async function queryContract(
  client: QubicLiveClient,
  contractIndex: number,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  const inputSize =
    requestData.includes("+") || requestData.includes("/")
      ? base64ToHex(requestData).length / 2
      : requestData.length / 2;

  return client.querySmartContract({
    contractIndex,
    inputType,
    inputSize,
    requestData,
  });
}

/**
 * Common Qubic contract indices
 * Based on https://github.com/qubic/core/tree/main/src/contracts
 */
export const QUBIC_CONTRACTS = {
  QX: 1,
  QUOTTERY: 2,
  QTRY: 2,
  RANDOM: 3,
  QUTIL: 4,
  MYLASTMATCH: 5,
  MLM: 5,
  GQMP: 6,
  GQMPROP: 6,
  SUPPLYWATCHER: 7,
  SWATCH: 7,
  CCF: 8,
  QEARN: 9,
  QVAULT: 10,
  MSVAULT: 11,
  QBAY: 12,
  QSWAP: 13,
  NOSTROMO: 14,
  NOST: 14,
  QDRAW: 15,
  RANDOMLOTTERY: 16,
  RL: 16,
  QBOND: 17,
} as const;

export const QUBIC_CONTRACT_ADDRESSES = {
  QX: "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID",
  QUOTTERY: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACNKL",
  QTRY: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACNKL",
  RANDOM: "DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANMIG",
  QUTIL: "EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVWRF",
  MYLASTMATCH: "FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYWJB",
  MLM: "FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYWJB",
  GQMP: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQGNM",
  GQMPROP: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQGNM",
  SUPPLYWATCHER: "HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHYCM",
  SWATCH: "HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHYCM",
  CCF: "IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABXSH",
  QEARN: "JAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKHO",
  QVAULT: "KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXIUO",
  MSVAULT: "LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKPTJ",
  QBAY: "MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWLWD",
  QSWAP: "NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAML",
  NOSTROMO: "OAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZTPD",
  NOST: "OAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZTPD",
  QDRAW: "PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYVRC",
  RANDOMLOTTERY: "QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPIYE",
  RL: "QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPIYE",
  QBOND: "RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADKAH",
} as const;

/**
 * Helper to query Quottery contract
 */
export async function queryQuottery(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(
    client,
    QUBIC_CONTRACTS.QUOTTERY,
    inputType,
    requestData,
  );
}

/**
 * Helper to query Qutil contract
 */
export async function queryQutil(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QUTIL, inputType, requestData);
}

/**
 * Helper to query QX (exchange) contract
 */
export async function queryQX(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QX, inputType, requestData);
}

/**
 * Helper to query Random contract
 */
export async function queryRandom(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.RANDOM, inputType, requestData);
}

/**
 * Helper to query MyLastMatch contract
 */
export async function queryMyLastMatch(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(
    client,
    QUBIC_CONTRACTS.MYLASTMATCH,
    inputType,
    requestData,
  );
}

/**
 * Helper to query GQMP (General Quorum Proposal) contract
 */
export async function queryGQMP(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.GQMP, inputType, requestData);
}

/**
 * Helper to query Qbay (marketplace) contract
 */
export async function queryQbay(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QBAY, inputType, requestData);
}

/**
 * Helper to query Qdraw contract
 */
export async function queryQdraw(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QDRAW, inputType, requestData);
}

/**
 * Helper to query Qearn contract
 */
export async function queryQearn(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QEARN, inputType, requestData);
}

/**
 * Helper to query Qswap contract
 */
export async function queryQswap(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QSWAP, inputType, requestData);
}

/**
 * Helper to query Qvault contract
 */
export async function queryQvault(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QVAULT, inputType, requestData);
}

/**
 * Helper to query Qbond contract
 */
export async function queryQbond(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.QBOND, inputType, requestData);
}

/**
 * Helper to query MsVault (multi-signature vault) contract
 */
export async function queryMsVault(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.MSVAULT, inputType, requestData);
}

/**
 * Helper to query Nostromo contract
 */
export async function queryNostromo(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(
    client,
    QUBIC_CONTRACTS.NOSTROMO,
    inputType,
    requestData,
  );
}

/**
 * Helper to query RandomLottery contract
 */
export async function queryRandomLottery(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(
    client,
    QUBIC_CONTRACTS.RANDOMLOTTERY,
    inputType,
    requestData,
  );
}

/**
 * Helper to query SupplyWatcher contract
 */
export async function querySupplyWatcher(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(
    client,
    QUBIC_CONTRACTS.SUPPLYWATCHER,
    inputType,
    requestData,
  );
}

/**
 * Helper to query CCF (Computor Controlled Fund) contract
 */
export async function queryCCF(
  client: QubicLiveClient,
  inputType: number,
  requestData: string,
): Promise<QuerySmartContractResponse> {
  return queryContract(client, QUBIC_CONTRACTS.CCF, inputType, requestData);
}
