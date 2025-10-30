import { expect, test } from "bun:test";
import {
  QubicLiveClient,
  QueryClient,
  QUBIC_CONTRACT_ADDRESSES,
} from "../index.ts";

const shouldSkip =
  process.env.QTS_SKIP_INTEGRATION === "1" || process.env.CI === "1";

const integrationTest = shouldSkip ? test.skip : test;

const KNOWN_CONTRACT_IDENTITY = QUBIC_CONTRACT_ADDRESSES.QX;

integrationTest(
  "QubicLiveClient.getTickInfo returns current tick",
  async () => {
    const client = new QubicLiveClient();
    const response = await client.getTickInfo();
    expect(response.tickInfo.tick).toBeGreaterThan(0);
    expect(response.tickInfo.epoch).toBeGreaterThanOrEqual(0);
  },
  { timeout: 30_000 },
);

integrationTest(
  "QubicLiveClient.getBalance returns a known account",
  async () => {
    const client = new QubicLiveClient();
    const { balance } = await client.getBalance(KNOWN_CONTRACT_IDENTITY);
    expect(balance.id).toBe(KNOWN_CONTRACT_IDENTITY);
    expect(balance.balance).toBeDefined();
  },
  { timeout: 30_000 },
);

integrationTest(
  "QueryClient.getLastProcessedTick returns data",
  async () => {
    const client = new QueryClient();
    const { tickNumber } = await client.getLastProcessedTick();
    expect(tickNumber).toBeGreaterThan(0);
  },
  { timeout: 30_000 },
);

integrationTest(
  "QueryClient.getTransactionsForIdentity returns structured results",
  async () => {
    const client = new QueryClient();
    const response = await client.getTransactionsForIdentity(
      KNOWN_CONTRACT_IDENTITY,
      {
        pagination: { offset: 0, size: 5 },
      },
    );
    expect(response.transactions).toBeDefined();
    expect(Array.isArray(response.transactions)).toBe(true);
  },
  { timeout: 30_000 },
);
