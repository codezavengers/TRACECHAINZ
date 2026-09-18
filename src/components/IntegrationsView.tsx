import React from "react";
import type { BlockchainProviderStatus, VaspDirectoryEntry } from "@/lib/types";
import { CHAIN_LABEL } from "@/lib/format";
import { useLiveBitcoin } from "@/lib/useLiveBitcoin";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  Landmark,
  Shield,
  Activity,
  ExternalLink,
  Mail,
  Zap,
  RefreshCw,
} from "lucide-react";

interface IntegrationsViewProps {
  providers: BlockchainProviderStatus[];
  vasps: VaspDirectoryEntry[];
}

export function IntegrationsView({ providers, vasps }: IntegrationsViewProps) {
  const { data: btcData, isLoading: btcLoading, refresh: refreshBtc } = useLiveBitcoin();
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Globe className="size-6 text-amber-400" />
          Blockchain Providers & VASP Directory
        </h1>
        <p className="text-sm text-slate-400">
          Telemetry health of underlying blockchain RPC nodes and global VASP exchange legal compliance escalation registry.
        </p>
      </div>

      {/* RPC Providers Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Activity className="size-4 text-amber-400" />
          Multi-Chain RPC Node Telemetry
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => {
            const isBtc = p.chain === "bitcoin";
            const height = isBtc && btcData?.tipHeight ? btcData.tipHeight : p.blockHeight;
            const latency = isBtc && btcData?.latencyMs ? btcData.latencyMs : p.latencyMs;
            const providerName = isBtc ? "mempool.space + blockchain.info (Live Internet)" : p.provider;

            return (
              <div
                key={p.chain}
                className={`rounded-xl border p-4.5 space-y-3 text-xs ${
                  isBtc
                    ? "border-amber-400/30 bg-[#161a24] shadow-md shadow-amber-400/5"
                    : "border-white/10 bg-[#161a24]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-white text-sm capitalize">
                      {CHAIN_LABEL[p.chain]}
                    </div>
                    {isBtc && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono px-1.5 py-0.5 rounded font-bold">
                        LIVE INTERNET
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "LIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        p.status === "LIVE" ? "bg-emerald-400" : "bg-amber-400"
                      } ${isBtc && btcLoading ? "animate-ping" : ""}`}
                    />
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Latest Height:</span>
                    <span className="text-amber-300 font-bold">#{height.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Round-Trip Latency:</span>
                    <span>{latency} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Provider Protocol:</span>
                    <span className="text-slate-200 truncate max-w-[180px]" title={providerName}>{providerName}</span>
                  </div>
                  {isBtc && btcData && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Spot Price:</span>
                        <span className="text-emerald-400 font-bold">${btcData.priceUsd.toLocaleString()} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Fastest Fee:</span>
                        <span className="text-amber-300">{btcData.fastestFee} sat/vB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Mempool Txs:</span>
                        <span className="text-slate-300">{btcData.mempoolCount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VASP Directory Grid */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Landmark className="size-4 text-amber-400" />
          Global VASP Compliance & Subpoena Registry
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vasps.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-white/10 bg-[#161a24] p-5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">{v.name}</h3>
                  <span className="text-[11px] text-slate-400">{v.legalEntity}</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                  {v.complianceRating}/100 Rating
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 border-t border-white/5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Jurisdiction</span>
                  <span className="font-medium text-slate-200">{v.jurisdiction}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">KYC Standard</span>
                  <span className="font-medium text-emerald-400">{v.kycStandard}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Law Enforcement Response</span>
                  <span className="font-medium text-amber-300">{v.responseLatencyHours} hr SLA</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">FIU Registered</span>
                  <span className="font-medium text-slate-200">{v.registeredFiu ? "✓ Yes (FIU-IND)" : "Offshore"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="size-3.5 text-amber-400" />
                  {v.contactEmail}
                </span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">
                  {v.subpoenaFormat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
