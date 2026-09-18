import React from "react";
import type { InvestigationCase, Alert } from "@/lib/types";
import { usd, relTime, titleFromTypology, riskColorVar } from "@/lib/format";
import { useLiveBitcoin } from "@/lib/useLiveBitcoin";
import {
  ShieldAlert,
  Coins,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  FilePlus2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Activity,
  Layers,
  Globe,
  RefreshCw,
  Zap,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface DashboardViewProps {
  cases: InvestigationCase[];
  alerts: Alert[];
  onSelectCase: (caseId: string) => void;
  onNavigate: (view: string) => void;
  onOpenCreateCase: () => void;
}

export function DashboardView({
  cases,
  alerts,
  onSelectCase,
  onNavigate,
  onOpenCreateCase,
}: DashboardViewProps) {
  const totalReportedLoss = cases.reduce((acc, c) => acc + (c.reportedLossUsd || 0), 0);
  const totalTraceable = cases.reduce((acc, c) => acc + (c.traceableUsd || 0), 0);
  const activeCasesCount = cases.filter((c) => c.status !== "CLOSED").length;
  const criticalCases = cases.filter((c) => c.riskBand === "CRITICAL");
  const unackAlerts = alerts.filter((a) => !a.acknowledged);
  const { data: btcData, isLoading: btcLoading, refresh: refreshBtc } = useLiveBitcoin();

  const statusCounts: Record<string, number> = {};
  cases.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with SIH PS 26183 badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-950/40 via-[#1a1d26] to-[#141720] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            SIH PS 26183 · Automated Blockchain Forensics
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Cryptocurrency Fraud & VASP Identification
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Real-time identification of fraud-linked cryptocurrency exchanges from victim-reported suspect
            wallet addresses through automated multi-hop transaction graph analytics, peel-chain decomposition,
            and legal freeze package generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={onOpenCreateCase}
            className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-sm font-semibold text-black transition shadow-lg shadow-amber-400/20"
          >
            <FilePlus2 className="size-4" />
            New Investigation
          </button>
          <button
            onClick={() => onNavigate("cases")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition"
          >
            <FolderKanban className="size-4" />
            View All Cases ({cases.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Total Reported Exposure</span>
            <Coins className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{usd(totalReportedLoss)}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">{cases.length}</span> victim cases logged
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Traceable Flow Identified</span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{usd(totalTraceable)}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold font-mono">
              {((totalTraceable / (totalReportedLoss || 1)) * 100).toFixed(0)}%
            </span>{" "}
            traceability rate to CEX endpoints
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Active Threat Cases</span>
            <Activity className="size-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{activeCasesCount}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-rose-400 font-semibold">{criticalCases.length}</span> critical risk cases
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Active Monitoring Alerts</span>
            <AlertTriangle className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{unackAlerts.length}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-slate-200">{alerts.length}</span> cumulative telemetry alerts
          </div>
        </div>
      </div>

      {/* Live Bitcoin Mainnet Telemetry Panel */}
      <div className="rounded-2xl border border-amber-500/20 bg-[#161a24] p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Globe className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Live Bitcoin Mainnet Telemetry & Valuation
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className={`size-1.5 rounded-full bg-emerald-400 ${btcLoading ? "animate-ping" : "animate-pulse"}`} />
                  {btcData?.isLive ? "INTERNET STREAM LIVE" : "CONNECTING"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct public mainnet feed via mempool.space & blockchain.info REST APIs · zero-auth live forensic telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refreshBtc()}
              disabled={btcLoading}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition disabled:opacity-50"
              title="Refresh live Bitcoin data from internet"
            >
              <RefreshCw className={`size-3.5 text-amber-400 ${btcLoading ? "animate-spin" : ""}`} />
              <span>Refresh Feed</span>
            </button>
            <button
              onClick={() => onNavigate("wallet")}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-3 py-1.5 text-xs font-semibold text-black transition shadow-sm"
            >
              <span>Probe Live BTC Address</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold uppercase tracking-wider">Live BTC Spot Price</span>
              <Zap className="size-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">
              ${btcData?.priceUsd ? btcData.priceUsd.toLocaleString() : "80,676"}
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>₹{btcData?.priceInr ? (btcData.priceInr / 100000).toFixed(2) : "77.45"} Lakhs INR</span>
              <span className="text-slate-500">€{btcData?.priceEur?.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold uppercase tracking-wider">Mainnet Tip Height</span>
              <Activity className="size-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              #{btcData?.tipHeight ? btcData.tipHeight.toLocaleString() : "967,574"}
            </div>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 font-mono">
              <span className="text-slate-500">Hash:</span>
              <span className="truncate">{btcData?.tipHash ? `${btcData.tipHash.slice(0, 16)}…` : "00000000000…"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold uppercase tracking-wider">Mempool Backlog</span>
              <Clock className="size-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {btcData?.mempoolCount ? btcData.mempoolCount.toLocaleString() : "79,617"}{" "}
              <span className="text-xs font-normal text-slate-400">txs</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              ~{btcData?.mempoolVsize ? (btcData.mempoolVsize / 1024 / 1024).toFixed(1) : "40.8"} MB pending
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold uppercase tracking-wider">Transfer Fee Rates</span>
              <TrendingUp className="size-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {btcData?.fastestFee ?? 3}{" "}
              <span className="text-xs font-normal text-amber-400 font-sans">sat/vB (fast)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>30m: {btcData?.halfHourFee ?? 1} sat/vB</span>
              <span>1h: {btcData?.hourFee ?? 1} sat/vB</span>
            </div>
          </div>
        </div>

        {/* Latest Mined Blocks on Bitcoin Mainnet */}
        {btcData?.latestBlocks && btcData.latestBlocks.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-black/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Latest Confirmed Bitcoin Blocks (Mempool Live Stream)
              </span>
              <span className="text-slate-500">Live block propagation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
              {btcData.latestBlocks.slice(0, 3).map((b) => (
                <div
                  key={b.height}
                  className="rounded-lg border border-white/5 bg-black/40 p-2.5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-amber-300 font-bold">Block #{b.height.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{b.miner || "Mining Pool"}</div>
                  </div>
                  <div className="text-right text-[11px]">
                    <div className="text-white font-semibold">{b.txCount.toLocaleString()} txs</div>
                    <div className="text-[10px] text-slate-500">{(b.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Priority Cases & Live Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Cases */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FolderKanban className="size-4 text-amber-400" />
                Priority Investigation Triage
              </h2>
              <p className="text-xs text-slate-400">
                Ranked by AI Priority Score based on recovery probability, loss magnitude, and VASP freeze opportunity.
              </p>
            </div>
            <button
              onClick={() => onNavigate("cases")}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
            >
              View all <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className="group rounded-xl border border-white/10 bg-[#161a24] p-4 transition-all hover:border-amber-400/40 hover:bg-[#1c2230] cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                        {c.id}
                      </span>
                      <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition truncate">
                        {c.title}
                      </h3>
                    </div>

                    <p className="font-mono text-xs text-slate-400 truncate">
                      Suspect: {c.reportedWallet}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 pt-0.5">
                      <span className="capitalize px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {c.chain}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span>{titleFromTypology(c.typology)}</span>
                      <span className="text-slate-500">•</span>
                      <span>Updated {relTime(c.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 text-right gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <span className="text-sm font-bold font-mono text-white">{usd(c.reportedLossUsd)}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-bold font-mono px-2 py-0.5 rounded"
                        style={{
                          color: riskColorVar(c.riskBand),
                          backgroundColor: `color-mix(in oklch, ${riskColorVar(c.riskBand)} 15%, transparent)`,
                        }}
                      >
                        {c.riskBand} ({c.riskScore})
                      </span>
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        P{c.priorityScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Live Alert Feed & Quick Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400" />
                Live Fraud Telemetry
              </h3>
              <button
                onClick={() => onNavigate("alerts")}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  onClick={() => a.caseId && onSelectCase(a.caseId)}
                  className={`rounded-lg border p-3 transition text-xs space-y-1.5 cursor-pointer ${
                    a.severity === "CRITICAL"
                      ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        a.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-400/20 text-amber-300"
                      }`}
                    >
                      {a.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400">{relTime(a.createdAt)}</span>
                  </div>
                  <p className="text-slate-300 font-medium leading-snug">{a.message}</p>
                  {a.caseId && (
                    <div className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold pt-0.5">
                      Case #{a.caseId} <ArrowUpRight className="size-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tools Box */}
          <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              Forensic Copilot Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onNavigate("wallet")}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-left text-xs text-white transition"
              >
                <span>🔎 Rapid Wallet Address Lookup & Validator</span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate("crosschain")}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-left text-xs text-white transition"
              >
                <span>🌉 Cross-Chain Bridge Transit Radar</span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate("assistant")}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-left text-xs text-white transition"
              >
                <span>🤖 TRACE AI Legal & Intelligence Assistant</span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate("actionpack")}
                className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-left text-xs text-white transition"
              >
                <span>📑 Draft VASP Subpoena / Freeze Notice</span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
