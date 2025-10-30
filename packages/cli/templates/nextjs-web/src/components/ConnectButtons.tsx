"use client";

import { useState } from "react";
import { useQubicAuth, useWalletConnect } from "@nouslabs/react";

export function ConnectButtons() {
  const { account, authenticate, disconnect, status, error } = useQubicAuth();
  const { connect, disconnect: disconnectWallet, isConnected } =
    useWalletConnect();
  const [walletConnectUri, setWalletConnectUri] = useState<string | null>(null);

  async function handleSeedLogin() {
    const seed = window.prompt("Enter your 55+ character seed");
    if (!seed) return;
    await authenticate("seed", { seed, label: "Seed Account" });
  }

  async function handleWalletConnect() {
    const { uri, waitForApproval } = await connect();
    setWalletConnectUri(uri);
    await waitForApproval();
    setWalletConnectUri(null);
  }

  if (account) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-300">
          Connected as <strong className="text-slate-100">{account.label ?? account.publicId}</strong>
        </p>
        <button
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
          onClick={async () => {
            await disconnect();
            if (isConnected) {
              await disconnectWallet();
            }
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleSeedLogin}
        disabled={status === "connecting"}
      >
        {status === "connecting" ? "Connecting..." : "Connect with seed"}
      </button>
      <button
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
        onClick={handleWalletConnect}
      >
        Connect with WalletConnect
      </button>
      {walletConnectUri && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
          <small className="block pb-2 text-slate-400">
            Scan this URI with a WalletConnect compatible wallet:
          </small>
          <code className="block max-h-32 overflow-y-auto break-all text-slate-200">{walletConnectUri}</code>
        </div>
      )}
      {error && <p style={{ color: "#ff6b6b" }}>{error.message}</p>}
    </div>
  );
}
