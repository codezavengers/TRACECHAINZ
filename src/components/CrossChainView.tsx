import React from "react";
import { usd, relTime } from "@/lib/format";
import {
  ArrowLeftRight,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight,
} from "lucide-react";

export function CrossChainView() {
  const bridgeEvents = [
    {
      id: "br-01",
      bridge: "Stargate Finance (LayerZero)",
      fromChain: "Ethereum",
      toChain: "Avalanche C-Chain",
      amount: "45,000 USDC",
      usd: 45000,
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      sourceTx: "0x3a1b...c981",
      targetTx: "0x8821...a3d1",
      status: "COMPLETED",
      riskScore: 92,
      suspect: "0x71c0429f939e0807b1d1bc65860d5b77ecb2a601",
    },
    {
      id: "br-02",
      bridge: "Across Protocol V3",
      fromChain: "Polygon PoS",
      toChain: "Arbitrum One",
      amount: "28.4 ETH",
      usd: 88040,
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      sourceTx: "0x9812...771a",
      targetTx: "0x4421...e55c",
      status: "COMPLETED",
      riskScore: 89,
      suspect: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    },
    {
      id: "br-03",
      bridge: "Thorchain Asgard Vault",
      fromChain: "Bitcoin",
      toChain: "Ethereum",
      amount: "1.75 BTC",
      usd: 112000,
      timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
      sourceTx: "8f41...239a",
      targetTx: "0x1192...b66a",
      status: "COMPLETED",
      riskScore: 95,
      suspect: "bc1qa5wkf603fnqap32s9xuv77926s8543u08zkm5m",
    },
    {
      id: "br-04",
      bridge: "Synapse Bridge",
      fromChain: "Binance Smart Chain",
      toChain: "Ethereum",
      amount: "65,000 USDT",
      usd: 65000,
      timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      sourceTx: "0x773a...110c",
      targetTx: "0x55aa...33b9",
      status: "COMPLETED",
      riskScore: 84,
      suspect: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ArrowLeftRight className="size-6 text-amber-400" />
          Cross-Chain Bridge Transit Radar
        </h1>
        <p className="text-sm text-slate-400">
          Telemetry surveillance detecting bridge-hopping maneuvers used by threat actors to sever linear transaction graphs across heterogeneous chains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Bridge Monitors</span>
          <div className="text-2xl font-bold font-mono text-white">8 Protocols</div>
          <div className="text-xs text-slate-400">LayerZero, Across, Stargate, Thorchain</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Tracked Cross-Chain Volume</span>
          <div className="text-2xl font-bold font-mono text-amber-400">{usd(310040)}</div>
          <div className="text-xs text-slate-400">Past 24 hours of detected bridge hops</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Correlation Precision</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">97.4%</div>
          <div className="text-xs text-slate-400">Temporal & value-matching heuristic</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#161a24] overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Detected Cross-Chain Hopping Events</h3>
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
                </div>

                <div className="flex items-center gap-2 font-medium text-slate-300">
                  <span className="text-amber-400">{evt.fromChain}</span>
                  <ArrowRight className="size-3 text-slate-500" />
                  <span className="text-emerald-400">{evt.toChain}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-white font-bold">{evt.amount}</span>
                </div>

                <div className="font-mono text-[11px] text-slate-400 truncate">
                  Suspect: <span className="text-amber-300">{evt.suspect}</span>
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
