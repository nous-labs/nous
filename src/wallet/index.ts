// Wallet integration helpers for browser-injected providers

export * from "./auth.ts";

import type { QubicLiveClient } from "../clients/qubic-live-client.ts";
import { bytesToHex, hexToBase64 } from "../utils/encoding.ts";

const DEFAULT_WALLET_KEYS = [
  "qubic",
  "qubicWallet",
  "QubicWallet",
  "qubicProvider",
  "qubicWindowProvider",
];

const DEFAULT_METHODS = {
  connect: "qubic_connect",
  disconnect: "qubic_disconnect",
  getAccounts: "qubic_accounts",
  signMessage: "qubic_signMessage",
  signTransaction: "qubic_signTransaction",
};

export type WalletEvent = "connect" | "disconnect" | "accountsChanged";

export interface WalletRequestArguments {
  method: string;
  params?: Record<string, unknown>;
}

export interface QubicWalletProvider {
  name?: string;
  version?: string;
  request<T = unknown>(args: WalletRequestArguments): Promise<T>;
  on?(event: WalletEvent, listener: (...args: any[]) => void): void;
  removeListener?(event: WalletEvent, listener: (...args: any[]) => void): void;
}

export interface WalletDetectionResult {
  id: string;
  provider: QubicWalletProvider;
  info: {
    name: string;
    version?: string;
  };
}

export interface DetectWalletOptions {
  keys?: string[];
}

export class WalletIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletIntegrationError";
  }
}

function isWalletProvider(
  candidate: unknown,
): candidate is QubicWalletProvider {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof (candidate as QubicWalletProvider).request === "function"
  );
}

function getGlobalObject(): any {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  return undefined;
}

/**
 * Locate any injected wallet providers on the global object.
 */
export function detectWalletProviders(
  options?: DetectWalletOptions,
): WalletDetectionResult[] {
  const globalObj = getGlobalObject();
  if (!globalObj) return [];

  const keys = options?.keys ?? DEFAULT_WALLET_KEYS;
  const seen = new Set<QubicWalletProvider>();
  const providers: WalletDetectionResult[] = [];

  for (const key of keys) {
    const candidate = globalObj[key as keyof typeof globalObj];
    if (isWalletProvider(candidate) && !seen.has(candidate)) {
      providers.push({
        id: key,
        provider: candidate,
        info: {
          name: candidate.name ?? key,
          version: candidate.version,
        },
      });
      seen.add(candidate);
    }
  }

  return providers;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface WaitForWalletOptions extends DetectWalletOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Wait until a wallet provider becomes available.
 */
export async function waitForWalletProvider(
  options?: WaitForWalletOptions,
): Promise<WalletDetectionResult> {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const intervalMs = options?.intervalMs ?? 200;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const providers = detectWalletProviders(options);
    if (providers.length > 0) return providers[0]!;
    await delay(intervalMs);
  }

  throw new WalletIntegrationError(
    "Timed out waiting for a Qubic wallet provider",
  );
}

export interface WalletAccount {
  identity: string;
  label?: string;
  publicKey?: string;
  raw?: unknown;
}

export interface WalletAdapterOptions {
  methods?: Partial<typeof DEFAULT_METHODS>;
}

export interface SignTransactionResult {
  signedTransaction: string;
  format?: "hex" | "base64";
  raw?: unknown;
}

function ensureHexPayload(data: Uint8Array | string): string {
  if (typeof data === "string") {
    return data.startsWith("0x") ? data.slice(2) : data;
  }
  return bytesToHex(data);
}

function normaliseAccount(account: unknown): WalletAccount {
  if (typeof account === "string") {
    return { identity: account, raw: account };
  }

  if (typeof account === "object" && account !== null) {
    const maybeIdentity =
      (account as any).identity ??
      (account as any).address ??
      (account as any).id;
    if (!maybeIdentity || typeof maybeIdentity !== "string") {
      throw new WalletIntegrationError(
        "Wallet returned an account without identity information",
      );
    }
    return {
      identity: maybeIdentity,
      label: (account as any).label ?? (account as any).name,
      publicKey: (account as any).publicKey ?? (account as any).pubKey,
      raw: account,
    };
  }

  throw new WalletIntegrationError("Unsupported account shape");
}

export class WalletAdapter {
  readonly provider: QubicWalletProvider;
  readonly methods: typeof DEFAULT_METHODS;

  constructor(provider: QubicWalletProvider, options?: WalletAdapterOptions) {
    this.provider = provider;
    this.methods = { ...DEFAULT_METHODS, ...options?.methods };
  }

  private method(key: keyof typeof DEFAULT_METHODS) {
    return this.methods[key];
  }

  async connect(params?: Record<string, unknown>): Promise<WalletAccount[]> {
    const accounts = await this.provider.request<unknown[]>({
      method: this.method("connect"),
      params,
    });
    return (accounts ?? []).map(normaliseAccount);
  }

  async disconnect(params?: Record<string, unknown>): Promise<void> {
    await this.provider.request({
      method: this.method("disconnect"),
      params,
    });
  }

  async getAccounts(
    params?: Record<string, unknown>,
  ): Promise<WalletAccount[]> {
    const accounts = await this.provider.request<unknown[]>({
      method: this.method("getAccounts"),
      params,
    });
    return (accounts ?? []).map(normaliseAccount);
  }

  async signMessage(
    message: Uint8Array | string,
    params?: Record<string, unknown>,
  ): Promise<string> {
    const payload = ensureHexPayload(message);
    const response = await this.provider.request<
      string | { signature?: string }
    >({
      method: this.method("signMessage"),
      params: { payload, ...params },
    });

    if (typeof response === "string") return response;
    if (response?.signature) return response.signature;

    throw new WalletIntegrationError(
      "Wallet did not return a valid signature payload",
    );
  }

  async signTransaction(
    transaction: Uint8Array | string,
    params?: Record<string, unknown>,
  ): Promise<SignTransactionResult> {
    const payload = ensureHexPayload(transaction);
    const response = await this.provider.request<
      string | { signedTransaction?: string; format?: "hex" | "base64" }
    >({
      method: this.method("signTransaction"),
      params: { payload, ...params },
    });

    if (typeof response === "string") {
      return { signedTransaction: response, format: "hex", raw: response };
    }

    if (response?.signedTransaction) {
      return {
        signedTransaction: response.signedTransaction,
        format: response.format ?? "hex",
        raw: response,
      };
    }

    throw new WalletIntegrationError(
      "Wallet did not return a valid signed transaction",
    );
  }

  async signAndBroadcast(options: {
    client: QubicLiveClient;
    transaction: Uint8Array | string;
    broadcastParams?: Record<string, unknown>;
    walletParams?: Record<string, unknown>;
  }) {
    const { client, transaction, walletParams, broadcastParams } = options;
    const signed = await this.signTransaction(transaction, walletParams);
    const encoded =
      signed.format === "base64"
        ? signed.signedTransaction
        : hexToBase64(signed.signedTransaction);

    if (broadcastParams && Object.keys(broadcastParams).length > 0) {
      return client.broadcastTransaction({
        encodedTransaction: encoded,
        ...(broadcastParams as Record<string, unknown>),
      } as any);
    }

    return client.broadcast(encoded);
  }
}
