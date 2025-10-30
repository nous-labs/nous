// @nouslabs/react - React hooks and providers for Qubic blockchain

export { useQubicAuth, QubicAuthProvider } from "./useQubicAuth";
export {
  QubicProvider,
  useQubic,
  WalletConnectProvider,
  useWalletConnect,
} from "./providers";

export * from "./query/hooks";
export { QubicQueryProvider } from "./query/provider";
export * from "./query/contracts-easy";
export * from "./query/contracts";
export * from "./query/walletconnect";

export type {
  AuthSession,
  AuthAccount,
  AuthError,
  MetaMaskAuthOptions,
  VaultAuthOptions,
  SeedAuthOptions,
  WalletConnectAuthOptions,
  CreateAccountResult,
  WalletConnectAdapterOptions,
  SignTransactionResult,
  WalletAccount,
} from "@nouslabs/sdk";
