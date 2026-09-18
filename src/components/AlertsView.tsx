import React, { useState } from "react";
import type { Alert, Severity } from "@/lib/types";
import { relTime } from "@/lib/format";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  BellRing,
  Clock,
} from "lucide-react";

interface AlertsViewProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onSelectCase?: (caseId: string) => void;
}

export function AlertsView({ alerts, onAcknowledge, onSelectCase }: AlertsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<Severity | "ALL">("ALL");

  const filtered = alerts.filter((a) => {
    if (filterSeverity !== "ALL" && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BellRing className="size-6 text-amber-400" />
            Fraud Telemetry Alert Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time notifications triggered by VASP deposit activity, bridge hops, mixer interactions, and large-value movements.
          </p>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#161a24] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Severities ({alerts.length})</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#161a24] p-12 text-center text-slate-400">
            <CheckCircle2 className="size-8 mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-white">All alerts acknowledged</p>
            <p className="text-xs text-slate-400">No unacknowledged telemetry triggers found for this filter.</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4.5 transition-all text-xs space-y-3 ${
                alert.severity === "CRITICAL"
                  ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                  : alert.severity === "HIGH"
                    ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                    : "border-white/10 bg-[#161a24] hover:bg-[#1a202c]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    }`}
                  >
                    {alert.severity} · {alert.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="size-3" /> {relTime(alert.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-medium transition"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-400" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>

              <p className="text-slate-200 text-sm font-medium leading-relaxed">{alert.message}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                {alert.walletAddress && <span>Target Wallet: {alert.walletAddress}</span>}
                {alert.caseId && (
                  <button
                    onClick={() => onSelectCase?.(alert.caseId!)}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 font-sans"
                  >
                    Jump to Case #{alert.caseId} <ArrowUpRight className="size-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
