// Basic tests for Qubic TypeScript SDK

import { describe, test, expect } from "bun:test";
import {
  createQubicClient,
  QubicLiveClient,
  QueryClient,
  ArchiveClient,
  hexToBase64,
  base64ToHex,
  encodeInt64LE,
  decodeInt64LE,
  createQuery,
  parseResponse,
  QUBIC_CONTRACTS,
} from "../index.ts";

describe("Client Initialization", () => {
  test("should create unified client", () => {
    const client = createQubicClient();
    expect(client).toBeDefined();
    expect(client.live).toBeInstanceOf(QubicLiveClient);
    expect(client.query).toBeInstanceOf(QueryClient);
    expect(client.archive).toBeInstanceOf(ArchiveClient);
  });

  test("should create QubicLiveClient", () => {
    const client = new QubicLiveClient();
    expect(client).toBeInstanceOf(QubicLiveClient);
  });

  test("should create QueryClient", () => {
    const client = new QueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  test("should create ArchiveClient", () => {
    const client = new ArchiveClient();
    expect(client).toBeInstanceOf(ArchiveClient);
  });

  test("should accept custom configuration", () => {
    const client = new QubicLiveClient({
      baseUrl: "https://custom.example.com",
      timeout: 60000,
    });
    expect(client).toBeInstanceOf(QubicLiveClient);
  });
});

describe("Encoding Utilities", () => {
  test("hexToBase64 should convert correctly", () => {
    const hex = "deadbeef";
    const base64 = hexToBase64(hex);
    expect(base64).toBe("3q2+7w==");
  });

  test("base64ToHex should convert correctly", () => {
    const base64 = "3q2+7w==";
    const hex = base64ToHex(base64);
    expect(hex).toBe("deadbeef");
  });

  test("hexToBase64 and base64ToHex should be reversible", () => {
    const original = "cafebabe";
    const base64 = hexToBase64(original);
    const hex = base64ToHex(base64);
    expect(hex).toBe(original);
  });

  test("encodeInt64LE should encode correctly", () => {
    const value = 0x0102030405060708n;
    const hex = encodeInt64LE(value);
    expect(hex).toBe("0807060504030201");
  });

  test("decodeInt64LE should decode correctly", () => {
    const hex = "0807060504030201";
    const value = decodeInt64LE(hex);
    expect(value).toBe(0x0102030405060708n);
  });

  test("encodeInt64LE and decodeInt64LE should be reversible", () => {
    const original = 1234567890n;
    const hex = encodeInt64LE(original);
    const value = decodeInt64LE(hex);
    expect(value).toBe(original);
  });
});

describe("Smart Contract Utilities", () => {
  test("createQuery should create a query builder", () => {
    const query = createQuery(QUBIC_CONTRACTS.QX, 1);
    expect(query).toBeDefined();
  });

  test("query builder should build data correctly", () => {
    const query = createQuery(4, 1).addByte(0xff).addInt32(12345);

    const built = query.build();
    expect(built.contractIndex).toBe(4);
    expect(built.inputType).toBe(1);
    expect(built.inputSize).toBe(5); // 1 byte + 4 bytes
  });

  test("parseResponse should parse data correctly", () => {
    // Create test data: 0xff (1 byte) + 12345 as int32 (4 bytes LE)
    const hex = "ff39300000"; // 0xff + 0x3039 (12345 in LE)
    const parser = parseResponse(hex);

    const byte = parser.readByte();
    expect(byte).toBe(0xff);

    const int32 = parser.readInt32();
    expect(int32).toBe(12345);
  });

  test("QUBIC_CONTRACTS should have known contracts", () => {
    expect(QUBIC_CONTRACTS.QX).toBe(1);
    expect(QUBIC_CONTRACTS.QUOTTERY).toBe(2);
    expect(QUBIC_CONTRACTS.RANDOM).toBe(3);
    expect(QUBIC_CONTRACTS.QUTIL).toBe(4);
    expect(QUBIC_CONTRACTS.MYLASTMATCH).toBe(5);
    expect(QUBIC_CONTRACTS.GQMP).toBe(6);
    expect(QUBIC_CONTRACTS.SUPPLYWATCHER).toBe(7);
    expect(QUBIC_CONTRACTS.CCF).toBe(8);
    expect(QUBIC_CONTRACTS.QEARN).toBe(9);
    expect(QUBIC_CONTRACTS.QVAULT).toBe(10);
    expect(QUBIC_CONTRACTS.MSVAULT).toBe(11);
    expect(QUBIC_CONTRACTS.QBAY).toBe(12);
    expect(QUBIC_CONTRACTS.QSWAP).toBe(13);
    expect(QUBIC_CONTRACTS.NOSTROMO).toBe(14);
    expect(QUBIC_CONTRACTS.QDRAW).toBe(15);
    expect(QUBIC_CONTRACTS.RANDOMLOTTERY).toBe(16);
    expect(QUBIC_CONTRACTS.QBOND).toBe(17);
  });
});

describe("Smart Contract Query Building", () => {
  test("should build query with multiple data types", () => {
    const query = createQuery(4, 1)
      .addByte(0x01)
      .addInt32(100)
      .addInt64(1000n)
      .addPadding(4);

    const built = query.build();
    expect(built.inputSize).toBe(17); // 1 + 4 + 8 + 4
  });

  test("should convert to base64", () => {
    const query = createQuery(4, 1).addByte(0xff);
    const base64 = query.toBase64();
    expect(base64).toBeDefined();
    expect(typeof base64).toBe("string");
  });
});

describe("Smart Contract Response Parsing", () => {
  test("should parse various data types", () => {
    // Build test data
    const query = createQuery(0, 0)
      .addByte(0x42)
      .addInt32(123456)
      .addInt64(9876543210n);

    const hex = query.build().requestData;
    const decoded = base64ToHex(hex);
    const parser = parseResponse(decoded);

    expect(parser.readByte()).toBe(0x42);
    expect(parser.readInt32()).toBe(123456);
    expect(parser.readInt64()).toBe(9876543210n);
  });

  test("should track offset correctly", () => {
    const parser = parseResponse("deadbeef");
    expect(parser.getOffset()).toBe(0);

    parser.readByte();
    expect(parser.getOffset()).toBe(1);

    parser.skip(2);
    expect(parser.getOffset()).toBe(3);
  });

  test("should detect remaining data", () => {
    const parser = parseResponse("deadbeef"); // 4 bytes
    expect(parser.hasMore()).toBe(true);
    expect(parser.remainingBytes()).toBe(4);

    parser.readHex(4);
    expect(parser.hasMore()).toBe(false);
    expect(parser.remainingBytes()).toBe(0);
  });
});

// Integration tests (these will actually call the API)
describe("Live API Integration", () => {
  test.skip("should get tick info", async () => {
    const client = new QubicLiveClient();
    const response = await client.getTickInfo();
    expect(response.tickInfo).toBeDefined();
    expect(response.tickInfo.tick).toBeGreaterThan(0);
  });

  test.skip("should handle API errors gracefully", async () => {
    const client = new QubicLiveClient();
    try {
      await client.getBalance("INVALID");
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    }
  });
});

describe("Query API Integration", () => {
  test.skip("should get last processed tick", async () => {
    const client = new QueryClient();
    const response = await client.getLastProcessedTick();
    expect(response.tickNumber).toBeGreaterThan(0);
  });

  test.skip("should get processed tick intervals", async () => {
    const client = new QueryClient();
    const intervals = await client.getProcessedTickIntervals();
    expect(Array.isArray(intervals)).toBe(true);
  });
});
