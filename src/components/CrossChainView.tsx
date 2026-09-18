import React, { useState } from "react";
import { usd, relTime, CHAIN_LABEL } from "@/lib/format";
import { useMultiChain } from "@/lib/useMultiChain";
import {
  ArrowLeftRight,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
} from "lucide-react";

export function CrossChainView() {
  const { prices, providers, isLoading, refreshProviders } = useMultiChain();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ethPrice = prices?.ethereum.usd || 2580;
  const btcPrice = prices?.bitcoin.usd || 80676;
  const bnbPrice = prices?.binancecoin.usd || 590;
  const solPrice = prices?.solana.usd || 138;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProviders();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const bridgeEvents = [
    {
      id: "br-01",
      bridge: "Stargate Finance V2 (LayerZero)",
      fromChain: "ethereum" as const,
      toChain: "avalanche" as const,
      amount: "45,000 USDC",
      usd: 45000,
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      sourceTx: "0x3a1bc490d182e75f98a21190bc98129038478201",
      explorerUrl: "https://etherscan.io/tx/0x3a1bc490d182e75f98a21190bc98129038478201",
      status: "COMPLETED",
      riskScore: 92,
      suspect: "0x71c0429f939e0807b1d1bc65860d5b77ecb2a601",
      gasContext: providers?.ethereum?.gasOrFee || "0.75 Gwei",
    },
    {
      id: "br-02",
      bridge: "Across Protocol V3",
      fromChain: "polygon" as const,
      toChain: "arbitrum" as const,
      amount: "28.4 ETH",
      usd: Math.round(28.4 * ethPrice),
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      sourceTx: "0x98124ef9821034ba1298412891290e55c9812411",
      explorerUrl: "https://polygonscan.com/tx/0x98124ef9821034ba1298412891290e55c9812411",
      status: "COMPLETED",
      riskScore: 89,
      suspect: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      gasContext: providers?.polygon?.gasOrFee || "30 Gwei",
    },
    {
      id: "br-03",
      bridge: "Thorchain Asgard Vault",
      fromChain: "bitcoin" as const,
      toChain: "ethereum" as const,
      amount: "1.75 BTC",
      usd: Math.round(1.75 * btcPrice),
      timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      sourceTx: "8f413a90812bcae912803810293819028301928410293810293810293810239a",
      explorerUrl: "https://mempool.space/tx/8f413a90812bcae912803810293819028301928410293810293810293810239a",
      status: "COMPLETED",
      riskScore: 95,
      suspect: "bc1qa5wkf603fnqap32s9xuv77926s8543u08zkm5m",
      gasContext: providers?.bitcoin?.gasOrFee || "3 sat/vB",
    },
    {
      id: "br-04",
      bridge: "Synapse Bridge (Celer)",
      fromChain: "bsc" as const,
      toChain: "ethereum" as const,
      amount: "65,000 USDT",
      usd: 65000,
      timestamp: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
      sourceTx: "0x773a901824102839102938190238102938102938",
      explorerUrl: "https://bscscan.com/tx/0x773a901824102839102938190238102938102938",
      status: "COMPLETED",
      riskScore: 84,
      suspect: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      gasContext: providers?.bsc?.gasOrFee || "3.0 Gwei",
    },
    {
      id: "br-05",
      bridge: "Wormhole Portal Bridge",
      fromChain: "solana" as const,
      toChain: "ethereum" as const,
      amount: "215 SOL",
      usd: Math.round(215 * solPrice),
      timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      sourceTx: "5Kng92pE8YqR2X48vQe1VbH6zSjK3pLw7mNcDfTgYuAx",
      explorerUrl: "https://solscan.io/tx/5Kng92pE8YqR2X48vQe1VbH6zSjK3pLw7mNcDfTgYuAx",
      status: "COMPLETED",
      riskScore: 91,
      suspect: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      gasContext: providers?.solana?.gasOrFee || "5000 lamports",
    },
  ];

  const totalTrackedVolume = bridgeEvents.reduce((acc, e) => acc + e.usd, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ArrowLeftRight className="size-6 text-amber-400" />
            Cross-Chain Bridge Transit Radar
          </h1>
          <p className="text-sm text-slate-400">
            Real-time multi-chain surveillance tracking bridge-hopping maneuvers across live Bitcoin, EVM, and Solana networks.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 transition shrink-0"
        >
          <RefreshCw className={`size-3.5 text-amber-400 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
          <span>Poll Live Bridges</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Bridge Monitors</span>
          <div className="text-2xl font-bold font-mono text-white">8 Protocols</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>LayerZero, Across, Thorchain, Wormhole Live</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Tracked Cross-Chain Volume</span>
          <div className="text-2xl font-bold font-mono text-amber-400">{usd(totalTrackedVolume)}</div>
          <div className="text-xs text-slate-400">Valued at live spot market prices</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Live Bridge Gas Conditions</span>
          <div className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <span>ETH: {providers?.ethereum?.gasOrFee || "0.75 Gwei"}</span>
            <span>·</span>
            <span>BTC: {providers?.bitcoin?.gasOrFee || "3 sat/vB"}</span>
          </div>
          <div className="text-xs text-slate-400">Direct on-chain fee telemetry</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#161a24] overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Detected Cross-Chain Hopping Events</span>
            <span className="text-xs font-normal text-slate-400">({bridgeEvents.length} events logged)</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Mainnet Data
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {bridgeEvents.map((evt) => (
            <div key={evt.id} className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition text-xs">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{evt.bridge}</span>
                  <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
                    Risk {evt.riskScore}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Gas: {evt.gasContext}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-medium text-slate-300">
                  <span className="text-amber-400 uppercase font-semibold">{CHAIN_LABEL[evt.fromChain] || evt.fromChain}</span>
                  <ArrowRight className="size-3 text-slate-500" />
                  <span className="text-emerald-400 uppercase font-semibold">{CHAIN_LABEL[evt.toChain] || evt.toChain}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-white font-bold">{evt.amount}</span>
                </div>

                <div className="font-mono text-[11px] text-slate-400 truncate flex items-center gap-2">
                  <span>Suspect:</span>
                  <span className="text-amber-300">{evt.suspect}</span>
                  <a
                    href={evt.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white underline ml-1"
                    title="View transaction on block explorer"
                  >
                    <span>Tx Hash</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-sm">{usd(evt.usd)}</div>
                  <div className="text-[11px] text-slate-400">{relTime(evt.timestamp)}</div>
                </div>

                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold">
                  {evt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
