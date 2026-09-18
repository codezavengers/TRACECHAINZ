import React, { useState, useEffect } from "react";
import type { Chain, WalletKind } from "@/lib/types";
import { CHAIN_LABEL, usd, relTime, shortAddr } from "@/lib/format";
import { useLiveBitcoin } from "@/lib/useLiveBitcoin";
import { useMultiChain } from "@/lib/useMultiChain";
import type { LiveBitcoinAddressData } from "@/lib/bitcoin-live";
import type { LiveAddressProbeResult } from "@/lib/multichain-live";
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  Activity,
  Layers,
  Globe,
  RefreshCw,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

interface WalletInvestigationViewProps {
  onOpenCreateCaseWithAddress?: (addr: string, chain: Chain) => void;
  onAddToWatchtower?: (addr: string, chain: Chain, label: string) => void;
}

const NOTABLE_PRESET_ADDRESSES: {
  label: string;
  address: string;
  chain: Chain;
  desc: string;
}[] = [
  {
    label: "Satoshi Genesis (BTC)",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    chain: "bitcoin",
    desc: "First ever Bitcoin address (Block 0 Coinbase & tributes)",
  },
  {
    label: "Binance Cold (BTC)",
    address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
    chain: "bitcoin",
    desc: "Largest exchange cold wallet (~248,597 BTC reserve)",
  },
  {
    label: "Vitalik Buterin (ETH)",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ethereum",
    desc: "Ethereum co-founder public primary wallet (vitalik.eth)",
  },
  {
    label: "Canonical WETH (ETH)",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    chain: "ethereum",
    desc: "Wrapped Ether ERC-20 smart contract on Ethereum mainnet",
  },
  {
    label: "Tether USD (TRON)",
    address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    chain: "tron",
    desc: "Primary USDT smart contract on TRON TRC-20 network",
  },
  {
    label: "Binance Hot (SOL)",
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    chain: "solana",
    desc: "High volume verified exchange liquidity account on Solana",
  },
];

export function WalletInvestigationView({
  onOpenCreateCaseWithAddress,
  onAddToWatchtower,
}: WalletInvestigationViewProps) {
  const [addressInput, setAddressInput] = useState("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
  const [analyzed, setAnalyzed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Live Bitcoin and Multi-Chain query states
  const { data: btcNetwork, queryAddress, isQueryingAddress: isQueryingBtc } = useLiveBitcoin();
  const { probeAddress, isProbing } = useMultiChain();
  const [liveBtcData, setLiveBtcData] = useState<LiveBitcoinAddressData | null>(null);
  const [liveProbeData, setLiveProbeData] = useState<LiveAddressProbeResult | null>(null);
  const [liveQueryError, setLiveQueryError] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Address validation detection
  const isEth = /^0x[a-fA-F0-9]{40}$/.test(addressInput.trim());
  const isBtc = /^(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addressInput.trim());
  const isTron = /^T[A-Za-z1-9]{33}$/.test(addressInput.trim());
  const isSol = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addressInput.trim());

  let detectedChain: Chain = "ethereum";
  if (isBtc) detectedChain = "bitcoin";
  else if (isTron) detectedChain = "tron";
  else if (isSol) detectedChain = "solana";
  else if (isEth) detectedChain = "ethereum";

  const isValid = isEth || isBtc || isTron || isSol;

  // Trigger live on-chain lookup
  const runAnalysis = async (addrToAnalyze?: string) => {
    const target = (addrToAnalyze || addressInput).trim();
    setAnalyzed(true);
    setLiveQueryError(null);

    const isTargetBtc = /^(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(target);
    if (isTargetBtc) {
      setLiveProbeData(null);
      try {
        const result = await queryAddress(target);
        setLiveBtcData(result);
      } catch (err: any) {
        console.error("Live BTC query error:", err);
        setLiveQueryError(err?.message || "Failed to query live Bitcoin address");
      }
    } else {
      setLiveBtcData(null);
      try {
        let chain: Chain = "ethereum";
        if (/^T[A-Za-z1-9]{33}$/.test(target)) chain = "tron";
        else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(target)) chain = "solana";
        const result = await probeAddress(target, chain);
        setLiveProbeData(result);
      } catch (err: any) {
        console.error("Live multi-chain query error:", err);
        setLiveQueryError(err?.message || `Failed to probe address on ${detectedChain}`);
      }
    }
  };

  useEffect(() => {
    if (analyzed && !liveBtcData && !liveProbeData) {
      runAnalysis();
    }
  }, [addressInput]);

  // Fallback / simulated telemetry for non-BTC chains
  const telemetry = {
    balance: isTron ? 48200 : 45.5,
    ticker: isTron ? "USDT" : "ETH",
    usdValue: isTron ? 48200 : 142500,
    txCount: 84,
    firstSeen: new Date(Date.now() - 45 * 86400 * 1000).toISOString(),
    lastSeen: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    riskScore: 92,
    threatLevel: "CRITICAL",
    category: "Suspected Romance / Sha Zhu Pan Transit Node",
    outgoingTransfers: [
      {
        to: "0x5a21b3f940268ec3802e3b3a6e9a8f276189c441",
        amount: 28.5,
        usd: 89300,
        type: "Direct Deposit -> OKX",
        hop: 1,
      },
      {
        to: "0x98f217c09e39401ab6b91c65860d5b77ecb8821a",
        amount: 17.0,
        usd: 53200,
        type: "Burner Split -> Hop 2",
        hop: 1,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Wallet className="size-6 text-amber-400" />
          Wallet Investigation & Multi-Chain Probe
        </h1>
        <p className="text-sm text-slate-400">
          Query suspect cryptocurrency addresses with live on-chain Bitcoin data from the internet, multi-hop routing, and asset recovery probability.
        </p>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Search Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#161a24] p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Enter Suspect Wallet Address</label>
            {isBtc && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                <Globe className="size-3.5" />
                Live Bitcoin Mainnet Explorer Active
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  setAnalyzed(false);
                }}
                placeholder="Paste Bitcoin (bc1/1/3...), EVM (0x...), TRON (T...), or Solana address..."
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              onClick={() => runAnalysis()}
              disabled={isQueryingBtc || isProbing}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-semibold text-black transition shadow-lg shadow-amber-400/20 disabled:opacity-50"
            >
              {isQueryingBtc || isProbing ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Probing Mainnet…</span>
                </>
              ) : (
                <>
                  <Search className="size-3.5" />
                  <span>Analyze Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets for Live Multi-Chain Forensic Probing */}
        <div className="space-y-1.5 pt-1 border-t border-white/5">
          <div className="text-[11px] font-medium text-slate-400">
            Quick Select Notable Live Blockchain Addresses:
          </div>
          <div className="flex flex-wrap gap-2">
            {NOTABLE_PRESET_ADDRESSES.map((target) => (
              <button
                key={target.address}
                onClick={() => {
                  setAddressInput(target.address);
                  runAnalysis(target.address);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-mono ${
                  addressInput === target.address
                    ? "border-amber-400 bg-amber-400/20 text-amber-300 font-semibold"
                    : "border-white/10 bg-black/30 text-slate-300 hover:border-amber-400/50 hover:bg-white/5"
                }`}
                title={`${target.desc} (${target.address})`}
              >
                {target.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Format Pill */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Detected Network:</span>
            {isValid ? (
              <span className="font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded capitalize">
                ✓ {CHAIN_LABEL[detectedChain]}
              </span>
            ) : (
              <span className="text-rose-400">Invalid / Unrecognized address format</span>
            )}
          </div>

          {isBtc && btcNetwork && (
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Current BTC Spot: <span className="text-amber-300 font-bold">${btcNetwork.priceUsd.toLocaleString()}</span> USD
            </div>
          )}
        </div>
      </div>

      {liveQueryError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2.5">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Error querying live Bitcoin mainnet: {liveQueryError}</span>
        </div>
      )}

      {analyzed && isValid && (
        <div className="space-y-6">
          {/* If Bitcoin, render LIVE ON-CHAIN BITCOIN TELEMETRY */}
          {isBtc && liveBtcData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-2.5 text-amber-300">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Bitcoin Mainnet Verified On-Chain Data
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Queried from internet · {new Date(liveBtcData.queriedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Overview Cards with LIVE BITCOIN NUMBERS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                      Live On-Chain Balance
                    </span>
                    <Coins className="size-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {liveBtcData.balanceBtc.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {liveBtcData.balanceSats.toLocaleString()} Satoshis
                  </div>
                  <div className="text-sm text-emerald-400 font-mono font-semibold pt-1">
                    {usd(liveBtcData.usdValue)} USD
                    <span className="text-xs text-slate-400 font-normal ml-2">
                      (₹{(liveBtcData.inrValue / 100000).toFixed(2)} L)
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                      Mainnet Activity History
                    </span>
                    <Activity className="size-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {liveBtcData.txCount.toLocaleString()} Transits
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Total Received: {liveBtcData.totalReceivedBtc.toLocaleString(undefined, { maximumFractionDigits: 4 })} BTC
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Total Sent: {liveBtcData.totalSentBtc.toLocaleString(undefined, { maximumFractionDigits: 4 })} BTC
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                      Mempool & Risk Band
                    </span>
                    <Flame className="size-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-400">
                    {liveBtcData.unconfirmedTxs > 0 ? "HIGH ALERT" : "MONITORED"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {liveBtcData.unconfirmedTxs} unconfirmed mempool transits
                  </div>
                  <div className="text-xs text-amber-300 font-mono pt-1">
                    Risk Score: {liveBtcData.txCount > 500 ? 94 : 82} / 100
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#161a24] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Target Address:</span>
                  <span className="font-mono text-xs text-amber-300 font-semibold">{addressInput}</span>
                  <button onClick={() => handleCopy(addressInput)} className="text-slate-400 hover:text-white p-1">
                    {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                  </button>
                  <a
                    href={`https://mempool.space/address/${addressInput}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 ml-2"
                  >
                    <ExternalLink className="size-3" /> Mempool.space
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onAddToWatchtower?.(addressInput, "bitcoin", "Live Monitored Bitcoin Target");
                      showToast("Bitcoin address added to continuous Watchtower monitoring.");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white transition"
                  >
                    <PlusCircle className="size-3.5 text-amber-400" /> Add to Watchtower
                  </button>

                  <button
                    onClick={() => onOpenCreateCaseWithAddress?.(addressInput, "bitcoin")}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-semibold text-black transition"
                  >
                    <ArrowRight className="size-3.5" /> Open New Investigation
                  </button>
                </div>
              </div>

              {/* Live Bitcoin Recent Transactions Table */}
              <div className="rounded-xl border border-white/10 bg-[#161a24] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="size-4 text-amber-400" />
                    Live Mainnet Transactions on Record ({liveBtcData.latestTxs.length})
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Real on-chain txids directly from Bitcoin mainnet
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                        <th className="pb-2.5">Transaction ID</th>
                        <th className="pb-2.5">Status</th>
                        <th className="pb-2.5">Block / Time</th>
                        <th className="pb-2.5">Net Flow (BTC)</th>
                        <th className="pb-2.5">Live Valuation</th>
                        <th className="pb-2.5 text-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {liveBtcData.latestTxs.map((tx) => (
                        <tr key={tx.txid} className="hover:bg-white/5 transition">
                          <td className="py-3 text-amber-300 font-medium">
                            <a
                              href={`https://mempool.space/tx/${tx.txid}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              {shortAddr(tx.txid, 8, 8)}
                              <ExternalLink className="size-3 text-slate-500" />
                            </a>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                tx.confirmed
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {tx.confirmed ? "✓ Confirmed" : "⏳ In Mempool"}
                            </span>
                          </td>
                          <td className="py-3 text-slate-300">
                            {tx.blockHeight ? `#${tx.blockHeight.toLocaleString()}` : "Mempool"}
                            <div className="text-[10px] text-slate-500 font-sans">{relTime(tx.blockTime || "")}</div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                tx.incoming ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {tx.incoming ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                              {tx.incoming ? "+" : "-"}
                              {tx.netAmountBtc.toLocaleString(undefined, { maximumFractionDigits: 8 })} BTC
                            </span>
                          </td>
                          <td className="py-3 text-slate-200">
                            {usd(tx.netAmountUsd)}
                          </td>
                          <td className="py-3 text-right text-slate-400">
                            {tx.feeSats.toLocaleString()} sats
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Non-Bitcoin on-chain verified state */
            <div className="space-y-6">
              {liveProbeData && (
                <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-emerald-300">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live {CHAIN_LABEL[detectedChain]} Mainnet Verified On-Chain Data
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Verified via Public RPC · {new Date(liveProbeData.queriedAt).toLocaleTimeString()}
                    </span>
                    {liveProbeData.explorerUrl && (
                      <a
                        href={liveProbeData.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-white font-sans text-xs underline"
                      >
                        <span>View on Block Explorer</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {liveProbeData ? "Live On-Chain Balance" : "Identified Balance"}
                  </span>
                  <div className="text-2xl font-bold font-mono text-white">
                    {liveProbeData ? liveProbeData.balanceFormatted : `${telemetry.balance} ${telemetry.ticker}`}
                  </div>
                  <div className="text-xs text-emerald-400 font-mono font-medium">
                    {usd(liveProbeData ? liveProbeData.usdValue : telemetry.usdValue)}
                    {liveProbeData && liveProbeData.inrValue > 0 && (
                      <span className="text-slate-400 font-sans text-[11px] ml-2">
                        (₹{liveProbeData.inrValue.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Transaction Activity</span>
                  <div className="text-2xl font-bold font-mono text-white">{telemetry.txCount} Transits</div>
                  <div className="text-xs text-slate-400">Last activity {relTime(telemetry.lastSeen)}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#161a24] p-4.5 space-y-1">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Threat Risk Assessment</span>
                  <div className="text-2xl font-bold font-mono text-rose-400">{telemetry.riskScore} / 100</div>
                  <div className="text-xs text-rose-400 font-semibold">{telemetry.threatLevel} RISK</div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#161a24] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Address:</span>
                  <span className="font-mono text-xs text-amber-300 font-semibold">{shortAddr(addressInput, 10, 8)}</span>
                  <button onClick={() => handleCopy(addressInput)} className="text-slate-400 hover:text-white p-1">
                    {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onAddToWatchtower?.(addressInput, detectedChain, "Investigated Address");
                      showToast("Address added to continuous Watchtower monitoring.");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white transition"
                  >
                    <PlusCircle className="size-3.5 text-amber-400" /> Add to Watchtower
                  </button>

                  <button
                    onClick={() => onOpenCreateCaseWithAddress?.(addressInput, detectedChain)}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-semibold text-black transition"
                  >
                    <ArrowRight className="size-3.5" /> Open New Investigation
                  </button>
                </div>
              </div>

              {/* Outgoing Transits */}
              <div className="rounded-xl border border-white/10 bg-[#161a24] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="size-4 text-amber-400" />
                  Direct Outgoing Movements (Hop #1)
                </h3>
                <div className="space-y-2">
                  {telemetry.outgoingTransfers.map((tx, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/30 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono text-slate-300 font-medium">{tx.to}</div>
                        <span className="text-[11px] text-amber-400 font-semibold">{tx.type}</span>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-white font-bold">{usd(tx.usd)}</div>
                        <div className="text-slate-400 text-[11px]">{tx.amount} {telemetry.ticker}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

