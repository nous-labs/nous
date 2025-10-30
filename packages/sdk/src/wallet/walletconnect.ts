import type { SignClientTypes, SessionTypes } from "@walletconnect/types";
import type SignClient from "@walletconnect/sign-client";
const SignClientImpl = require("@walletconnect/sign-client").default;

import type { QubicLiveClient } from "../clients/qubic-live-client";
import { hexToBase64 } from "../utils/encoding";
import type {
  ProcedureCall,
  ProcedureTransactionOverrides,
} from "../utils/procedures";
import { procedureCallToTransaction } from "../utils/procedures";
import type { WalletAccount, SignTransactionResult } from "./index";
import { WalletIntegrationError } from "./index";

const DEFAULT_CHAIN_ID = "qubic:mainnet";
const DEFAULT_METHODS = [
  "qubic_requestAccounts",
  "qubic_signTransaction",
  "qubic_sign",
  "qubic_sendQubic",
];
const DEFAULT_EVENTS = ["accountsChanged", "amountChanged"];
const DEFAULT_STORAGE_KEY = "qts.walletconnect.topic";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SessionStore {
  get(): string | null;
  set(value: string): void;
  clear(): void;
}

class MemorySessionStore implements SessionStore {
  private value: string | null = null;
  get() {
    return this.value;
  }
  set(value: string) {
    this.value = value;
  }
  clear() {
    this.value = null;
  }
}

class BrowserSessionStore implements SessionStore {
  constructor(
    private storage: StorageLike,
    private key: string,
  ) {}

  get() {
    return this.storage.getItem(this.key);
  }
  set(value: string) {
    this.storage.setItem(this.key, value);
  }
  clear() {
    this.storage.removeItem(this.key);
  }
}

function resolveStorage(
  storage?: StorageLike,
  key: string = DEFAULT_STORAGE_KEY,
): SessionStore {
  const globalObj =
    typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
  const candidate =
    storage ??
    (globalObj?.localStorage as StorageLike | undefined) ??
    (globalObj?.window?.localStorage as StorageLike | undefined);

  if (candidate) {
    try {
      return new BrowserSessionStore(candidate, key);
    } catch {
      return new MemorySessionStore();
    }
  }

  return new MemorySessionStore();
}

export interface WalletConnectAdapterOptions {
  projectId: string;
  metadata?: SignClientTypes.Metadata;
  chainId?: string;
  methods?: string[];
  events?: string[];
  relayUrl?: string;
  storage?: StorageLike;
  storageKey?: string;
}

export interface WalletConnectConnection {
  uri: string;
  approve(): Promise<WalletAccount[]>;
}

export interface SignProcedureOptions {
  call: ProcedureCall;
  transaction: ProcedureTransactionOverrides;
  walletParams?: Record<string, unknown>;
}

export interface SignAndBroadcastProcedureOptions extends SignProcedureOptions {
  client: QubicLiveClient;
  broadcastParams?: Record<string, unknown>;
}

type WalletConnectClient = SignClient;

export class WalletConnectAdapter {
  private client: WalletConnectClient;
  private session?: SessionTypes.Struct;
  private readonly chainId: string;
  private readonly methods: string[];
  private readonly events: string[];
  private readonly store: SessionStore;

  private constructor(
    client: WalletConnectClient,
    private readonly options: WalletConnectAdapterOptions,
  ) {
    this.client = client;
    this.chainId = options.chainId ?? DEFAULT_CHAIN_ID;
    this.methods = options.methods ?? DEFAULT_METHODS;
    this.events = options.events ?? DEFAULT_EVENTS;
    this.store = resolveStorage(options.storage, options.storageKey);

    this.client.on("session_delete", this.handleSessionClose);
    this.client.on("session_expire", this.handleSessionClose);
  }

  static async init(
    options: WalletConnectAdapterOptions,
  ): Promise<WalletConnectAdapter> {
    const client = await SignClientImpl.init({
      projectId: options.projectId,
      relayUrl: options.relayUrl,
      metadata:
        options.metadata ??
        ({
          name: "Qubic App",
          description: "Qubic TypeScript SDK WalletConnect integration",
          url: "https://github.com/nvlabs/qts",
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        } satisfies SignClientTypes.Metadata),
    });

    const adapter = new WalletConnectAdapter(client, options);
    adapter.restoreSession();
    return adapter;
  }

  get isConnected(): boolean {
    return Boolean(this.session);
  }

  private handleSessionClose = () => {
    this.session = undefined;
    this.store.clear();
  };

  private restoreSession() {
    const topic = this.store.get();
    if (!topic) return;

    const existing = this.client.session.get(topic);
    if (existing) {
      this.session = existing;
    } else {
      this.store.clear();
    }
  }

  private setSession(session: SessionTypes.Struct) {
    this.session = session;
    this.store.set(session.topic);
  }

  async connect(): Promise<WalletConnectConnection> {
    const { uri, approval } = await this.client.connect({
      requiredNamespaces: {
        qubic: {
          chains: [this.chainId],
          methods: this.methods,
          events: this.events,
        },
      },
    });

    return {
      uri: uri ?? "",
      approve: async () => {
        const session = await approval();
        this.setSession(session);
        return this.getAccountsFromSession(session);
      },
    };
  }

  async disconnect() {
    if (!this.session) return;
    await this.client.disconnect({
      topic: this.session.topic,
      reason: { code: 6000, message: "User disconnected" },
    });
    this.handleSessionClose();
  }

  private getAccountsFromSession(
    session: SessionTypes.Struct | undefined,
  ): WalletAccount[] {
    if (!session) return [];
    const namespaceAccounts = session.namespaces?.qubic?.accounts ?? [];
    const accounts: WalletAccount[] = [];
    for (const entry of namespaceAccounts) {
      const parts = entry.split(":");
      const identity = parts[2];
      if (!identity) continue;
      accounts.push({ identity, raw: entry });
    }
    return accounts;
  }

  async requestAccounts(
    params?: Record<string, unknown>,
  ): Promise<WalletAccount[]> {
    const session = this.requireSession();
    const response = await this.client.request<unknown>({
      topic: session.topic,
      chainId: this.chainId,
      request: {
        method: "qubic_requestAccounts",
        params: {
          nonce: Date.now().toString(),
          ...(params ?? {}),
        },
      },
    });

    return this.normaliseAccounts(response);
  }

  private normaliseAccounts(payload: unknown): WalletAccount[] {
    if (!Array.isArray(payload)) {
      return this.getAccountsFromSession(this.session);
    }

    const accounts: WalletAccount[] = [];
    for (const item of payload) {
      if (typeof item === "string") {
        accounts.push({ identity: item, raw: item });
        continue;
      }
      if (typeof item === "object" && item !== null) {
        const identity =
          (item as any).identity ?? (item as any).address ?? (item as any).id;
        if (!identity || typeof identity !== "string") {
          continue;
        }
        accounts.push({
          identity,
          label:
            (item as any).label ?? (item as any).alias ?? (item as any).name,
          publicKey: (item as any).publicKey,
          raw: item,
        });
      }
    }

    return accounts.length > 0
      ? accounts
      : this.getAccountsFromSession(this.session);
  }

  async signMessage(
    payload: string,
    params?: Record<string, unknown>,
  ): Promise<string> {
    const session = this.requireSession();
    const response = await this.client.request<string | { signature?: string }>(
      {
        topic: session.topic,
        chainId: this.chainId,
        request: {
          method: "qubic_sign",
          params: {
            payload,
            nonce: Date.now().toString(),
            ...(params ?? {}),
          },
        },
      },
    );

    if (typeof response === "string") return response;
    if (response?.signature) return response.signature;
    throw new WalletIntegrationError(
      "WalletConnect: missing signature in response",
    );
  }

  async signTransaction(
    tx: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): Promise<SignTransactionResult> {
    const session = this.requireSession();
    const response = await this.client.request<
      string | { signedTransaction?: string; format?: "hex" | "base64" }
    >({
      topic: session.topic,
      chainId: this.chainId,
      request: {
        method: "qubic_signTransaction",
        params: {
          ...tx,
          nonce: Date.now().toString(),
          ...(params ?? {}),
        },
      },
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
      "WalletConnect: missing signed transaction in response",
    );
  }

  async signProcedure(options: SignProcedureOptions) {
    const transaction = procedureCallToTransaction(
      options.call,
      options.transaction,
    );
    return this.signTransaction(transaction, options.walletParams);
  }

  async signAndBroadcast(options: {
    client: QubicLiveClient;
    transaction: Record<string, unknown>;
    walletParams?: Record<string, unknown>;
    broadcastParams?: Record<string, unknown>;
  }) {
    const signed = await this.signTransaction(
      options.transaction,
      options.walletParams,
    );
    const encoded =
      signed.format === "base64"
        ? signed.signedTransaction
        : hexToBase64(signed.signedTransaction);

    if (
      options.broadcastParams &&
      Object.keys(options.broadcastParams).length > 0
    ) {
      return options.client.broadcastTransaction({
        encodedTransaction: encoded,
        ...(options.broadcastParams as Record<string, unknown>),
      } as any);
    }

    return options.client.broadcast(encoded);
  }

  async signAndBroadcastProcedure(options: SignAndBroadcastProcedureOptions) {
    const transaction = procedureCallToTransaction(
      options.call,
      options.transaction,
    );
    return this.signAndBroadcast({
      client: options.client,
      transaction,
      walletParams: options.walletParams,
      broadcastParams: options.broadcastParams,
    });
  }

  private requireSession(): SessionTypes.Struct {
    if (!this.session) {
      throw new WalletIntegrationError("WalletConnect session not established");
    }
    return this.session;
  }
}
