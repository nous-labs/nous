"use client";

import { useQubic, useQubicAuth } from "@nouslabs/react";
import { useQuery } from "@tanstack/react-query";

export function WalletBalance() {
  const { live } = useQubic();
  const { account } = useQubicAuth();
  const identity = account?.publicId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["balance", identity],
    enabled: Boolean(identity),
    queryFn: async () => {
      if (!identity) return null;
      const { balance } = await live.getBalance(identity);
      return balance;
    },
    refetchInterval: 10_000,
  });

  if (!identity) {
    return <p className="text-sm text-slate-400">Connect a wallet to see balance information.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Fetching balance...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-400">Failed to load balance.</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-400">No balance data yet.</p>;
  }

  const formatted = Number(data.balance ?? 0).toLocaleString();

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Identity</p>
        <p className="text-sm text-slate-200">{identity}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Balance</p>
        <p className="text-2xl font-semibold text-emerald-300">{formatted} QUBIC</p>
      </div>
      <p className="text-xs text-slate-500">Valid for tick {data.validForTick}</p>
    </div>
  );
}
