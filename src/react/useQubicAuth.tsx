import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthMethod,
  AuthSession,
  AuthAccount,
  MetaMaskAuthOptions,
  VaultAuthOptions,
  SeedAuthOptions,
  WalletConnectAuthOptions,
  CreateAccountResult,
} from "../wallet/auth.ts";

import {
  authenticate,
  detectAvailableAuthMethods,
  isMetaMaskAvailable,
  isSnapInstalled,
  AuthError,
  connectWalletConnect,
  createAccount,
  generateSeed,
  isValidSeed,
} from "../wallet/auth.ts";

export interface QubicAuthActions {
  connectWithMetaMask: (options?: MetaMaskAuthOptions) => Promise<AuthSession>;
  connectWithVault: (
    file: File,
    password: string,
    publicId?: string,
  ) => Promise<AuthSession>;
  connectWithSeed: (seed: string, label?: string) => Promise<AuthSession>;
  disconnect: () => void;
  clearError: () => void;
  refreshAvailableMethods: () => Promise<void>;
}

// ===== Types =====

export interface QubicAuthState {
  session: AuthSession | null;
  account: AuthAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  availableMethods: AuthMethod[];
}

export interface QubicAuthActions {
  connectWithMetaMask: (options?: MetaMaskAuthOptions) => Promise<AuthSession>;
  connectWithVault: (
    file: File,
    password: string,
    publicId?: string,
  ) => Promise<AuthSession>;
  connectWithSeed: (seed: string, label?: string) => Promise<AuthSession>;
  disconnect: () => void;
  clearError: () => void;
  refreshAvailableMethods: () => Promise<void>;
}

export interface QubicAuthContextValue
  extends QubicAuthState,
    QubicAuthActions {
  signTransaction: (tx: Uint8Array, offset: number) => Promise<Uint8Array>;
  getPrivateKey: () => Promise<string | undefined>;
}

// ===== Context =====

const QubicAuthContext = createContext<QubicAuthContextValue | undefined>(
  undefined,
);

// ===== Provider Props =====

export interface QubicAuthProviderProps {
  children: ReactNode;
  persistSession?: boolean;
  storageKey?: string;
  onSessionChange?: (session: AuthSession | null) => void;
  onError?: (error: Error) => void;
}

// ===== Session Storage =====

interface StoredSession {
  account: AuthAccount;
  timestamp: number;
}

function loadStoredSession(key: string): AuthAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: StoredSession = JSON.parse(stored);

    // Only restore MetaMask sessions (vault/seed need re-auth for security)
    if (parsed.account.method === "metamask") {
      return parsed.account;
    }

    return null;
  } catch {
    return null;
  }
}

function saveSession(key: string, account: AuthAccount): void {
  if (typeof window === "undefined") return;

  try {
    const stored: StoredSession = {
      account,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(stored));
  } catch (error) {
    console.warn("Failed to persist session:", error);
  }
}

function clearStoredSession(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ===== Provider Component =====

export function QubicAuthProvider({
  children,
  persistSession = true,
  storageKey = "qubic-auth-session",
  onSessionChange,
  onError,
}: QubicAuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [availableMethods, setAvailableMethods] = useState<AuthMethod[]>([
    "seed",
    "vault",
    "walletconnect",
  ]);

  // Load available auth methods on mount
  useEffect(() => {
    detectAvailableAuthMethods()
      .then(setAvailableMethods)
      .catch((err) => {
        console.warn("Failed to detect auth methods:", err);
      });
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    if (!persistSession) return;

    const storedAccount = loadStoredSession(storageKey);
    if (!storedAccount) return;

    // Only auto-restore MetaMask sessions
    if (storedAccount.method === "metamask") {
      setIsConnecting(true);

      authenticate("metamask", {
        metamask: {
          accountIdx: 0, // Could store this in session too
        },
      })
        .then((restoredSession) => {
          // Verify it's the same account
          if (restoredSession.account.publicId === storedAccount.publicId) {
            setSession(restoredSession);
            onSessionChange?.(restoredSession);
          } else {
            clearStoredSession(storageKey);
          }
        })
        .catch((err) => {
          console.warn("Failed to restore MetaMask session:", err);
          clearStoredSession(storageKey);
        })
        .finally(() => {
          setIsConnecting(false);
        });
    }
  }, [persistSession, storageKey, onSessionChange]);

  // Handle session changes
  useEffect(() => {
    if (session && persistSession) {
      saveSession(storageKey, session.account);
    }
  }, [session, persistSession, storageKey]);

  const handleError = useCallback(
    (err: Error) => {
      setError(err);
      onError?.(err);
    },
    [onError],
  );

  const connectWithMetaMask = useCallback(
    async (options?: MetaMaskAuthOptions): Promise<AuthSession> => {
      setIsConnecting(true);
      setError(null);

      try {
        const newSession = await authenticate("metamask", {
          metamask: options,
        });

        setSession(newSession);
        onSessionChange?.(newSession);

        return newSession;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("MetaMask connection failed");
        handleError(error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [onSessionChange, handleError],
  );

  const connectWithVault = useCallback(
    async (
      file: File,
      password: string,
      publicId?: string,
    ): Promise<AuthSession> => {
      setIsConnecting(true);
      setError(null);

      try {
        const newSession = await authenticate("vault", {
          vault: { file, password },
        });

        setSession(newSession);
        onSessionChange?.(newSession);

        return newSession;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Vault unlock failed");
        handleError(error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [onSessionChange, handleError],
  );

  const connectWithSeed = useCallback(
    async (seed: string, label?: string): Promise<AuthSession> => {
      setIsConnecting(true);
      setError(null);

      try {
        const newSession = await authenticate("seed", {
          seed: { seed, label },
        });

        setSession(newSession);
        onSessionChange?.(newSession);

        return newSession;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Seed authentication failed");
        handleError(error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [onSessionChange, handleError],
  );

  const connectWithWalletConnect = useCallback(
    async (
      options: WalletConnectAuthOptions,
    ): Promise<{
      uri: string;
      waitForApproval: () => Promise<AuthSession>;
    }> => {
      setIsConnecting(true);
      setError(null);

      try {
        const connection = await connectWalletConnect(options);

        return {
          uri: connection.uri,
          waitForApproval: async () => {
            try {
              const newSession = await connection.waitForApproval();
              setSession(newSession);
              onSessionChange?.(newSession);
              return newSession;
            } finally {
              setIsConnecting(false);
            }
          },
        };
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("WalletConnect connection failed");
        handleError(error);
        setIsConnecting(false);
        throw error;
      }
    },
    [onSessionChange, handleError],
  );

  const disconnect = useCallback(async () => {
    if (session?.disconnect) {
      await session.disconnect();
    }

    setSession(null);
    setError(null);
    onSessionChange?.(null);

    if (persistSession) {
      clearStoredSession(storageKey);
    }
  }, [session, persistSession, storageKey, onSessionChange]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshAvailableMethods = useCallback(async () => {
    try {
      const methods = await detectAvailableAuthMethods();
      setAvailableMethods(methods);
    } catch (err) {
      console.warn("Failed to refresh auth methods:", err);
    }
  }, []);

  const signTransaction = useCallback(
    async (tx: Uint8Array, offset: number): Promise<Uint8Array> => {
      if (!session) {
        throw new AuthError("No active session", "NO_SESSION");
      }

      return session.signTransaction(tx, offset);
    },
    [session],
  );

  const getPrivateKey = useCallback(async (): Promise<string | undefined> => {
    if (!session) return undefined;

    if (session.getPrivateKey) {
      return session.getPrivateKey();
    }

    return session.privateKey;
  }, [session]);

  const value = useMemo<QubicAuthContextValue>(
    () => ({
      // State
      session,
      account: session?.account ?? null,
      isConnected: session !== null,
      isConnecting,
      error,
      availableMethods,

      // Actions
      connectWithMetaMask,
      connectWithVault,
      connectWithSeed,
      connectWithWalletConnect,
      disconnect,
      clearError,
      refreshAvailableMethods,
      signTransaction,
      getPrivateKey,
    }),
    [
      session,
      isConnecting,
      error,
      availableMethods,
      connectWithMetaMask,
      connectWithVault,
      connectWithSeed,
      connectWithWalletConnect,
      disconnect,
      clearError,
      refreshAvailableMethods,
      signTransaction,
      getPrivateKey,
    ],
  );

  return (
    <QubicAuthContext.Provider value={value}>
      {children}
    </QubicAuthContext.Provider>
  );
}

// ===== Hook =====

export function useQubicAuth(): QubicAuthContextValue {
  const context = useContext(QubicAuthContext);

  if (!context) {
    throw new Error("useQubicAuth must be used within QubicAuthProvider");
  }

  return context;
}

// ===== Convenience Hooks =====

export function useQubicAccount(): AuthAccount | null {
  const { account } = useQubicAuth();
  return account;
}

export function useQubicAuthMethod(): AuthMethod | null {
  const { account } = useQubicAuth();
  return account?.method ?? null;
}

export function useIsAuthenticated(): boolean {
  const { isConnected } = useQubicAuth();
  return isConnected;
}

export function useAuthMethods() {
  const { availableMethods, refreshAvailableMethods } = useQubicAuth();

  return {
    availableMethods,
    refresh: refreshAvailableMethods,
    hasMetaMask: availableMethods.includes("metamask"),
    hasVault: availableMethods.includes("vault"),
    hasSeed: availableMethods.includes("seed"),
    hasWalletConnect: availableMethods.includes("walletconnect"),
  };
}

// ===== Account Creation Hooks =====

export interface UseAccountCreationResult {
  createNewAccount: (length?: number) => Promise<CreateAccountResult>;
  generateRandomSeed: (length?: number) => string;
  validateSeed: (seed: string) => boolean;
  isCreating: boolean;
  error: Error | null;
  clearError: () => void;
}

export function useAccountCreation(): UseAccountCreationResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createNewAccount = useCallback(
    async (length: number = 55): Promise<CreateAccountResult> => {
      setIsCreating(true);
      setError(null);

      try {
        const account = await createAccount({ length });
        return account;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Account creation failed");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  const generateRandomSeed = useCallback((length: number = 55): string => {
    try {
      return generateSeed(length);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Seed generation failed");
      setError(error);
      throw error;
    }
  }, []);

  const validateSeed = useCallback((seed: string): boolean => {
    return isValidSeed(seed);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createNewAccount,
    generateRandomSeed,
    validateSeed,
    isCreating,
    error,
    clearError,
  };
}
