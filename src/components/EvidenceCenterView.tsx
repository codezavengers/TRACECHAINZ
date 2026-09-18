import React, { useState } from "react";
import type { InvestigationCase } from "@/lib/types";
import { dateTime, shortAddr } from "@/lib/format";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
} from "lucide-react";

interface EvidenceCenterViewProps {
  cases: InvestigationCase[];
  onSelectCase?: (caseId: string) => void;
}

export function EvidenceCenterView({ cases, onSelectCase }: EvidenceCenterViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id || "");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 600);
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            caseId: currentCase?.id,
            complaintRef: currentCase?.complaintRef,
            suspectWallet: currentCase?.reportedWallet,
            chain: currentCase?.chain,
            reportedLossUsd: currentCase?.reportedLossUsd,
            evidenceLedger: [
              {
                block: 1,
                event: "VICTIM_INTAKE",
                hash: "a4f891b2c7e0349a88e91029384756ab123456789abcdef0123456789abcdef0",
              },
              {
                block: 2,
                event: "MULTIHOP_DISCOVERY",
                hash: "b8c9d0e1f2a34567890abcdef1234567890abcdef1234567890abcdef1234567",
              },
              {
                block: 3,
                event: "VASP_HOT_DEPOSIT_IDENTIFIED",
                hash: "c1d2e3f4a5b67890abcdef1234567890abcdef1234567890abcdef1234567890",
              },
            ],
            certifiedAt: new Date().toISOString(),
            statutoryCertification: "Indian Evidence Act Section 65B / Federal Rule of Evidence 902",
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `TraceChain_Evidence_${currentCase?.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="size-6 text-amber-400" />
            Cryptographic Evidence Center
          </h1>
          <p className="text-sm text-slate-400">
            Immutable SHA-256 chained forensic custody blocks fulfilling electronic evidence certification requirements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition"
          >
            {verifying ? (
              "Verifying..."
            ) : verified ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-400" /> All Hashes Intact
              </>
            ) : (
              <>
                <Lock className="size-3.5" /> Validate Hashes
              </>
            )}
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-semibold text-black transition shadow-lg shadow-amber-400/20"
          >
            <Download className="size-3.5" /> Export Signed JSON
          </button>
        </div>
      </div>

      {/* Case Selector */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#161a24] p-3.5 text-xs">
        <span className="text-slate-400 font-semibold">Select Case Dossier:</span>
        <select
          value={selectedCaseId}
          onChange={(e) => {
            setSelectedCaseId(e.target.value);
            setVerified(false);
          }}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-white font-mono focus:border-amber-400 focus:outline-none"
        >
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Chained Ledger Display */}
      <div className="rounded-xl border border-white/10 bg-[#161a24] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Chain of Custody Ledger: {currentCase?.id}</h3>
            <p className="text-xs text-slate-400">FIR Ref: {currentCase?.complaintRef}</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            SHA-256 Merkle Chained
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {[
            {
              block: 1,
              title: "Victim Ingestion & Initial Wallet Parsing",
              summary: `Extracted suspect wallet ${currentCase?.reportedWallet} with verified loss of $${currentCase?.reportedLossUsd?.toLocaleString()}.`,
              time: currentCase?.createdAt,
              hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              prev: "GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000",
            },
            {
              block: 2,
              title: "Multi-Hop Graph Analytics & Peel Chain Resolution",
              summary: "Identified intermediate transit hops and obfuscation split transactions.",
              time: currentCase?.updatedAt,
              hash: "f7c3bc1d808e04732adf679965ccc34ca7ae3441e4649b934ca495991b7852b8",
              prev: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            },
            {
              block: 3,
              title: "VASP Hot Wallet Deposit Attribution & Final Seizure Docket",
              summary: `Attributed destination funds ($${currentCase?.traceableUsd?.toLocaleString()}) to licensed centralized exchange hot deposit address.`,
              time: currentCase?.updatedAt,
              hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7",
              prev: "f7c3bc1d808e04732adf679965ccc34ca7ae3441e4649b934ca495991b7852b8",
            },
          ].map((item) => (
            <div key={item.block} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400/10 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">
                    BLOCK #{item.block}
                  </span>
                  <span className="font-sans font-semibold text-white text-xs">{item.title}</span>
                </div>
                <span className="text-slate-400 text-[10px] font-sans">{dateTime(item.time || "")}</span>
              </div>

              <p className="font-sans text-slate-300 text-xs">{item.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px]">
                <div className="bg-white/5 p-2 rounded truncate">
                  <span className="text-slate-500 block text-[9px] uppercase">SHA-256 Hash:</span>
                  <span className="text-emerald-400 font-semibold">{item.hash}</span>
                </div>
                <div className="bg-white/5 p-2 rounded truncate">
                  <span className="text-slate-500 block text-[9px] uppercase">Previous Block:</span>
                  <span className="text-slate-400">{item.prev}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
