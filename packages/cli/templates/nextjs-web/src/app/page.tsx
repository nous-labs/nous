import { ConnectButtons } from "../components/ConnectButtons";
import { WalletBalance } from "../components/WalletBalance";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 text-slate-100">
      <section className="space-y-4">
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">
          Qubic Toolkit
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">Qubic Next.js Starter</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
          This project scaffolds a Qubic-ready application with @nouslabs/sdk, React Query, and WalletConnect already
          configured. Connect with a seed or scan a WalletConnect QR code to get started.
        </p>
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-900/40">
          <h2 className="mb-4 text-lg font-semibold text-white">Connect</h2>
          <ConnectButtons />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-900/40">
          <WalletBalance />
        </div>
      </section>
    </main>
  );
}
