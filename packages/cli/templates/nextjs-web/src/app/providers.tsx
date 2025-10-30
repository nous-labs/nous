"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { QubicProvider, WalletConnectProvider } from "@nouslabs/react";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  const projectId = useMemo(() => {
    const value = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!value && process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will initialise with a demo project id; replace it with your own for production.",
      );
    }
    return value ?? "demo-project-id";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <QubicProvider
        config={{
          liveUrl: process.env.NEXT_PUBLIC_QUBIC_LIVE_URL,
          queryUrl: process.env.NEXT_PUBLIC_QUBIC_QUERY_URL,
        }}
      >
        <WalletConnectProvider
          options={{
            projectId,
            metadata: {
              name: "Qubic Next.js Starter",
              description: "Next.js scaffold powered by Nous Labs SDK",
              url: "https://localhost:3000",
              icons: ["https://walletconnect.com/walletconnect-logo.png"],
            },
          }}
        >
          {children}
        </WalletConnectProvider>
      </QubicProvider>
    </QueryClientProvider>
  );
}
