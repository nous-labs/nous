// Authentication utilities for Qubic - MetaMask, Vault, and Seed support

import { bytesToHex, hexToBytes } from "../utils/encoding.ts";

// ===== Types =====

export type AuthMethod = "metamask" | "vault" | "seed" | "walletconnect";

export interface AuthAccount {
  publicId: string;
  label?: string;
  method: AuthMethod;
}

export interface MetaMaskAuthOptions {
  snapId?: string;
  accountIdx?: number;
  coinType?: number;
}

export interface VaultAuthOptions {
  file: File;
  password: string;
}

export interface SeedAuthOptions {
  seed: string;
  label?: string;
}

export interface WalletConnectAuthOptions {
  projectId: string;
  metadata?: any;
  chainId?: string;
}

export interface IVaultSeed {
  publicId: string;
  alias?: string;
  encryptedSeed: string;
}

export interface IVaultConfig {
  seeds: IVaultSeed[];
  publicKey?: JsonWebKey;
}

export interface IEncryptedVaultFile {
  cipher: string;
  iv: string;
  salt: string;
}

export interface IVaultFile {
  privateKey: string;
  configuration: IVaultConfig;
}

export interface AuthSession {
  account: AuthAccount;
  privateKey?: string; // Base26 encoded for Qubic
  signTransaction: (tx: Uint8Array, offset: number) => Promise<Uint8Array>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  getPrivateKey?: () => Promise<string>;
  disconnect?: () => Promise<void>;
}

// ===== Account Creation =====

export interface CreateAccountResult {
  publicId: string;
  privateKey: string; // Base26 encoded seed
  seed: string; // Same as privateKey for Qubic
}

export interface CreateAccountFromEntropyOptions {
  entropy?: Uint8Array; // Optional custom entropy
  length?: number; // Seed length (default: 55)
}

// ===== Errors =====

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ===== Base26 Conversion (for MetaMask BIP44 keys) =====

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export function hexToBase26(hexString: string): string {
  const cleaned = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const num = BigInt("0x" + cleaned);

  if (num === 0n) return "a";

  let result = "";
  let n = num;

  while (n > 0n) {
    const remainder = n % 26n;
    result = ALPHABET[Number(remainder)] + result;
    n = n / 26n;
  }

  return result;
}

export function base26ToHex(base26String: string): string {
  let num = 0n;

  for (let i = 0; i < base26String.length; i++) {
    num *= 26n;
    const char = base26String[i];
    if (!char) throw new AuthError(`Invalid character at position ${i}`);
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new AuthError(`Invalid base26 character: ${char}`);
    }
    num += BigInt(idx);
  }

  return "0x" + num.toString(16);
}

// ===== MetaMask Snap Integration =====

const DEFAULT_SNAP_ID = "npm:@qubic-lib/qubic-mm-snap";
const DEFAULT_COIN_TYPE = 83293;

export interface MetaMaskProvider {
  request<T = unknown>(args: { method: string; params?: any }): Promise<T>;
}

function getMetaMaskProvider(): MetaMaskProvider | null {
  if (typeof window === "undefined") return null;

  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;

  return ethereum as MetaMaskProvider;
}

export async function isMetaMaskAvailable(): Promise<boolean> {
  const provider = getMetaMaskProvider();
  return provider !== null;
}

export async function isSnapInstalled(
  snapId: string = DEFAULT_SNAP_ID,
): Promise<boolean> {
  const provider = getMetaMaskProvider();
  if (!provider) return false;

  try {
    const snaps = await provider.request<Record<string, any>>({
      method: "wallet_getSnaps",
    });
    return snaps[snapId] !== undefined;
  } catch {
    return false;
  }
}

export async function installSnap(
  snapId: string = DEFAULT_SNAP_ID,
): Promise<void> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new AuthError(
      "MetaMask is not available. Please install MetaMask browser extension.",
    );
  }

  try {
    await provider.request({
      method: "wallet_requestSnaps",
      params: {
        [snapId]: {},
      },
    });
  } catch (error: any) {
    throw new AuthError(
      `Failed to install Qubic Snap: ${error.message}`,
      "SNAP_INSTALL_FAILED",
    );
  }
}

async function invokeSnap<T = any>(
  snapId: string,
  method: string,
  params?: any,
): Promise<T> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new AuthError("MetaMask provider not available");
  }

  return provider.request<T>({
    method: "wallet_invokeSnap",
    params: {
      snapId,
      request: {
        method,
        params,
      },
    },
  });
}

export async function getMetaMaskPublicId(
  options?: MetaMaskAuthOptions,
): Promise<string> {
  const snapId = options?.snapId ?? DEFAULT_SNAP_ID;
  const accountIdx = options?.accountIdx ?? 0;

  const installed = await isSnapInstalled(snapId);
  if (!installed) {
    await installSnap(snapId);
  }

  return invokeSnap<string>(snapId, "getPublicId", {
    accountIdx,
    confirm: false,
  });
}

export async function signTransactionWithMetaMask(
  tx: Uint8Array,
  offset: number,
  options?: MetaMaskAuthOptions,
): Promise<Uint8Array> {
  const snapId = options?.snapId ?? DEFAULT_SNAP_ID;
  const accountIdx = options?.accountIdx ?? 0;

  // Convert tx to base64
  const base64Tx = btoa(String.fromCharCode(...tx));

  const result = await invokeSnap<{ signedTx: string }>(
    snapId,
    "signTransaction",
    {
      base64Tx,
      offset,
      accountIdx,
      confirm: true,
    },
  );

  // Convert base64 signature back to bytes
  const binaryString = atob(result.signedTx);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

export async function createMetaMaskSession(
  options?: MetaMaskAuthOptions,
): Promise<AuthSession> {
  const publicId = await getMetaMaskPublicId(options);

  return {
    account: {
      publicId,
      method: "metamask",
      label: `MetaMask Account ${options?.accountIdx ?? 0}`,
    },
    signTransaction: async (tx: Uint8Array, offset: number) => {
      return signTransactionWithMetaMask(tx, offset, options);
    },
  };
}

// ===== Vault File Integration =====

const RSA_ALG = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: "SHA-256" },
};

const AES_ALG = {
  name: "AES-GCM",
  length: 256,
  iv: new Uint8Array(12).fill(0),
};

const ENC_ALG = {
  name: "RSA-OAEP",
};

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getVaultFileKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const passwordBytes = stringToBytes(password);
  const initialKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    initialKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function decryptVault(
  encryptedData: IEncryptedVaultFile,
  password: string,
): Promise<IVaultFile> {
  const salt = base64ToBytes(encryptedData.salt);
  const key = await getVaultFileKey(password, salt);
  const iv = base64ToBytes(encryptedData.iv);
  const cipher = base64ToBytes(encryptedData.cipher);

  const contentBytes = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      cipher as BufferSource,
    ),
  );

  const decryptedVault = bytesToString(contentBytes);
  return JSON.parse(decryptedVault);
}

async function importKey(password: string): Promise<CryptoKey> {
  const pw = stringToBytes(password);
  return crypto.subtle.importKey(
    "raw",
    pw as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
}

async function deriveKey(pwKey: CryptoKey): Promise<CryptoKey> {
  const salt = new Uint8Array(16).fill(0);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    pwKey,
    AES_ALG,
    true,
    ["wrapKey", "unwrapKey"],
  );
}

async function importEncryptedPrivateKey(
  wrappedKey: ArrayBuffer,
  password: string,
): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  const pwKey = await importKey(password);
  const wrapKey = await deriveKey(pwKey);

  const privateKey = await crypto.subtle.unwrapKey(
    "jwk",
    wrappedKey,
    wrapKey,
    AES_ALG,
    RSA_ALG,
    true,
    ["decrypt"],
  );

  const jwkPrivate = await crypto.subtle.exportKey("jwk", privateKey);
  delete jwkPrivate.d;
  jwkPrivate.key_ops = ["encrypt"];

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwkPrivate,
    RSA_ALG,
    true,
    ["encrypt"],
  );

  return { privateKey, publicKey };
}

function isVaultFile(data: any): data is IEncryptedVaultFile {
  return (
    data !== undefined &&
    typeof data === "object" &&
    typeof data.cipher === "string" &&
    typeof data.iv === "string" &&
    typeof data.salt === "string"
  );
}

export async function unlockVault(options: VaultAuthOptions): Promise<{
  config: IVaultConfig;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}> {
  const binaryData = await options.file.arrayBuffer();
  const textData = new TextDecoder().decode(binaryData);

  let vaultFile: IEncryptedVaultFile;
  try {
    vaultFile = JSON.parse(textData);
  } catch {
    throw new AuthError("Invalid vault file format", "INVALID_VAULT_FORMAT");
  }

  if (!isVaultFile(vaultFile)) {
    throw new AuthError(
      "Invalid vault file structure",
      "INVALID_VAULT_STRUCTURE",
    );
  }

  let decryptedVault: IVaultFile;
  try {
    decryptedVault = await decryptVault(vaultFile, options.password);
  } catch {
    throw new AuthError(
      "Failed to decrypt vault - incorrect password",
      "DECRYPT_FAILED",
    );
  }

  const privKeyBuffer = base64ToArrayBuffer(decryptedVault.privateKey);
  const { privateKey, publicKey } = await importEncryptedPrivateKey(
    privKeyBuffer,
    options.password,
  );

  return {
    config: decryptedVault.configuration,
    privateKey,
    publicKey,
  };
}

export async function getVaultAccounts(
  options: VaultAuthOptions,
): Promise<AuthAccount[]> {
  const { config } = await unlockVault(options);
  return config.seeds.map((seed) => ({
    publicId: seed.publicId,
    label: seed.alias,
    method: "vault" as const,
  }));
}

export async function createVaultSession(
  options: VaultAuthOptions,
  publicId?: string,
): Promise<AuthSession> {
  const { config, privateKey } = await unlockVault(options);

  // If no publicId specified, use the first seed
  const targetSeed = publicId
    ? config.seeds.find((s) => s.publicId === publicId)
    : config.seeds[0];

  if (!targetSeed) {
    throw new AuthError(
      publicId ? `Seed not found: ${publicId}` : "No seeds in vault",
      "SEED_NOT_FOUND",
    );
  }

  // Decrypt the seed
  const encryptedSeedBuffer = base64ToArrayBuffer(targetSeed.encryptedSeed);
  const decryptedSeedBuffer = await crypto.subtle.decrypt(
    ENC_ALG,
    privateKey,
    encryptedSeedBuffer,
  );
  const seedString = bytesToString(new Uint8Array(decryptedSeedBuffer));

  return {
    account: {
      publicId: targetSeed.publicId,
      label: targetSeed.alias,
      method: "vault",
    },
    privateKey: seedString,
    signTransaction: async (tx: Uint8Array, offset: number) => {
      // Transaction signing would need qubic-ts-library crypto functions
      // This is a placeholder - actual implementation would use K12 and Schnorr
      throw new AuthError(
        "Transaction signing requires qubic-ts-library integration",
        "NOT_IMPLEMENTED",
      );
    },
    getPrivateKey: async () => seedString,
  };
}

// ===== Private Seed Authentication =====

export async function createSeedSession(
  options: SeedAuthOptions,
): Promise<AuthSession> {
  const seed = options.seed.trim();

  if (!seed || seed.length < 55) {
    throw new AuthError(
      "Invalid seed - must be at least 55 characters",
      "INVALID_SEED",
    );
  }

  // Validate it's base26 (a-z)
  if (!/^[a-z]+$/.test(seed)) {
    throw new AuthError(
      "Invalid seed format - must contain only lowercase letters (a-z)",
      "INVALID_SEED_FORMAT",
    );
  }

  // TODO: Derive publicId from seed using qubic-ts-library
  // For now, this requires qubic-ts-library integration
  const publicId = "DERIVED_FROM_SEED"; // Placeholder

  return {
    account: {
      publicId,
      label: options.label ?? "Seed Account",
      method: "seed",
    },
    privateKey: seed.padStart(55, "z"),
    signTransaction: async (tx: Uint8Array, offset: number) => {
      throw new AuthError(
        "Transaction signing requires qubic-ts-library integration",
        "NOT_IMPLEMENTED",
      );
    },
    getPrivateKey: async () => seed,
  };
}

// ===== WalletConnect Integration =====

import type { WalletConnectAdapter } from "./walletconnect.ts";

let walletConnectInstance: WalletConnectAdapter | null = null;

export async function createWalletConnectSession(
  options: WalletConnectAuthOptions,
): Promise<AuthSession> {
  // Dynamic import to avoid bundling WalletConnect if not used
  const { WalletConnectAdapter } = await import("./walletconnect.ts");

  const adapter = await WalletConnectAdapter.init({
    projectId: options.projectId,
    metadata: options.metadata,
    chainId: options.chainId,
  });

  walletConnectInstance = adapter;

  // If already connected, get accounts
  if (adapter.isConnected) {
    const accounts = await adapter.requestAccounts();
    if (accounts.length > 0) {
      return {
        account: {
          publicId: accounts[0]!.identity,
          label: accounts[0]!.label,
          method: "walletconnect",
        },
        signTransaction: async (tx: Uint8Array, offset: number) => {
          const hexPayload = bytesToHex(tx);
          const result = await adapter.signTransaction(hexPayload as any, {
            offset,
          });

          // Convert result to bytes
          const signatureHex = result.signedTransaction.startsWith("0x")
            ? result.signedTransaction.slice(2)
            : result.signedTransaction;
          return hexToBytes(signatureHex);
        },
        disconnect: async () => {
          await adapter.disconnect();
          walletConnectInstance = null;
        },
      };
    }
  }

  // Need to connect first
  throw new AuthError(
    "WalletConnect not connected. Call connectWalletConnect() first.",
    "NOT_CONNECTED",
  );
}

export async function connectWalletConnect(
  options: WalletConnectAuthOptions,
): Promise<{
  uri: string;
  waitForApproval: () => Promise<AuthSession>;
}> {
  const { WalletConnectAdapter } = await import("./walletconnect.ts");

  const adapter = await WalletConnectAdapter.init({
    projectId: options.projectId,
    metadata: options.metadata,
    chainId: options.chainId,
  });

  walletConnectInstance = adapter;

  const connection = await adapter.connect();

  return {
    uri: connection.uri,
    waitForApproval: async () => {
      const accounts = await connection.approve();

      if (accounts.length === 0) {
        throw new AuthError("No accounts returned from wallet", "NO_ACCOUNTS");
      }

      return {
        account: {
          publicId: accounts[0]!.identity,
          label: accounts[0]!.label,
          method: "walletconnect",
        },
        signTransaction: async (tx: Uint8Array, offset: number) => {
          const hexPayload = bytesToHex(tx);
          const result = await adapter.signTransaction(hexPayload as any, {
            offset,
          });

          const signatureHex = result.signedTransaction.startsWith("0x")
            ? result.signedTransaction.slice(2)
            : result.signedTransaction;
          return hexToBytes(signatureHex);
        },
        disconnect: async () => {
          await adapter.disconnect();
          walletConnectInstance = null;
        },
      };
    },
  };
}

export function getWalletConnectInstance(): WalletConnectAdapter | null {
  return walletConnectInstance;
}

// ===== Account Creation =====

/**
 * Generate a random seed for Qubic
 * @param length - Seed length in characters (default: 55)
 * @returns Base26 encoded seed (a-z)
 */
export function generateSeed(length: number = 55): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new AuthError(
      "Crypto API not available - use Node.js 15+ or modern browser",
      "NO_CRYPTO",
    );
  }

  const bytes = new Uint8Array(Math.ceil(length * 0.6)); // ~1.67 chars per byte
  crypto.getRandomValues(bytes);

  let seed = "";
  let num = 0n;

  // Convert bytes to BigInt
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]!);
  }

  // Convert to base26
  while (num > 0n && seed.length < length) {
    const remainder = num % 26n;
    seed = ALPHABET[Number(remainder)] + seed;
    num = num / 26n;
  }

  // Pad to exact length
  return seed.padStart(length, "a");
}

/**
 * Create a new Qubic account with a random seed
 * @param options - Optional entropy and length configuration
 * @returns Account details with publicId and private seed
 */
export async function createAccount(
  options?: CreateAccountFromEntropyOptions,
): Promise<CreateAccountResult> {
  const length = options?.length ?? 55;

  let seed: string;

  if (options?.entropy) {
    // Use provided entropy
    let num = 0n;
    for (let i = 0; i < options.entropy.length; i++) {
      num = (num << 8n) | BigInt(options.entropy[i]!);
    }

    seed = "";
    while (num > 0n && seed.length < length) {
      const remainder = num % 26n;
      seed = ALPHABET[Number(remainder)] + seed;
      num = num / 26n;
    }
    seed = seed.padStart(length, "a");
  } else {
    // Generate random seed
    seed = generateSeed(length);
  }

  // TODO: Derive publicId from seed using qubic-ts-library
  // For now, return placeholder - actual implementation would use QubicHelper
  const publicId = "PLACEHOLDER_" + seed.substring(0, 10).toUpperCase();

  return {
    publicId,
    privateKey: seed,
    seed,
  };
}

/**
 * Validate a Qubic seed format
 * @param seed - Seed to validate
 * @returns True if valid, false otherwise
 */
export function isValidSeed(seed: string): boolean {
  if (!seed || seed.length < 55) return false;
  return /^[a-z]+$/.test(seed);
}

/**
 * Derive public ID from a private seed
 * @param seed - Private seed (base26)
 * @returns Public ID
 */
export async function derivePublicId(seed: string): Promise<string> {
  if (!isValidSeed(seed)) {
    throw new AuthError("Invalid seed format", "INVALID_SEED");
  }

  // TODO: Implement using qubic-ts-library QubicHelper.createIdPackage
  // For now, return placeholder
  throw new AuthError(
    "Public ID derivation requires qubic-ts-library integration",
    "NOT_IMPLEMENTED",
  );
}

/**
 * Create multiple accounts at once
 * @param count - Number of accounts to create
 * @param options - Optional configuration
 * @returns Array of account results
 */
export async function createAccounts(
  count: number,
  options?: CreateAccountFromEntropyOptions,
): Promise<CreateAccountResult[]> {
  const accounts: CreateAccountResult[] = [];

  for (let i = 0; i < count; i++) {
    const account = await createAccount(options);
    accounts.push(account);
  }

  return accounts;
}

/**
 * Import account from mnemonic phrase (BIP39-compatible)
 * @param mnemonic - 12 or 24 word mnemonic phrase
 * @param accountIndex - Account index for derivation
 * @returns Account details
 */
export async function importAccountFromMnemonic(
  mnemonic: string,
  accountIndex: number = 0,
): Promise<CreateAccountResult> {
  // TODO: Implement BIP39 mnemonic to seed derivation
  // This would use the same path as MetaMask: m/44'/83293'/accountIndex'/0/0
  throw new AuthError(
    "Mnemonic import requires BIP39 library integration",
    "NOT_IMPLEMENTED",
  );
}

// ===== Unified Auth Interface =====

export interface UnifiedAuthOptions {
  metamask?: MetaMaskAuthOptions;
  vault?: VaultAuthOptions;
  seed?: SeedAuthOptions;
  walletconnect?: WalletConnectAuthOptions;
}

export async function authenticate(
  method: AuthMethod,
  options: UnifiedAuthOptions,
): Promise<AuthSession> {
  switch (method) {
    case "metamask":
      if (!options.metamask) {
        throw new AuthError("MetaMask options required", "MISSING_OPTIONS");
      }
      return createMetaMaskSession(options.metamask);

    case "vault":
      if (!options.vault) {
        throw new AuthError("Vault options required", "MISSING_OPTIONS");
      }
      return createVaultSession(options.vault);

    case "seed":
      if (!options.seed) {
        throw new AuthError("Seed options required", "MISSING_OPTIONS");
      }
      return createSeedSession(options.seed);

    case "walletconnect":
      if (!options.walletconnect) {
        throw new AuthError(
          "WalletConnect options required",
          "MISSING_OPTIONS",
        );
      }
      return createWalletConnectSession(options.walletconnect);

    default:
      throw new AuthError(`Unknown auth method: ${method}`, "UNKNOWN_METHOD");
  }
}

// ===== Helper Functions =====

export async function detectAvailableAuthMethods(): Promise<AuthMethod[]> {
  const methods: AuthMethod[] = ["seed"]; // Seed is always available

  if (await isMetaMaskAvailable()) {
    methods.push("metamask");
  }

  // Vault is always available if user has a file
  methods.push("vault");

  // WalletConnect is always available (just needs projectId)
  methods.push("walletconnect");

  return methods;
}

export function isAuthSession(value: any): value is AuthSession {
  return (
    value !== null &&
    typeof value === "object" &&
    "account" in value &&
    "signTransaction" in value &&
    typeof value.signTransaction === "function"
  );
}
