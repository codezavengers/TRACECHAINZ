import React from "react";
import type { Role, UserProfile } from "@/lib/types";
import { ROLE_BADGE_STYLE, PERMISSIONS } from "@/lib/permissions";
import {
  Settings,
  Users,
  Shield,
  KeyRound,
  Check,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface SettingsViewProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
}

export function SettingsView({ currentUser, availableUsers, onSwitchUser }: SettingsViewProps) {
  const roles: Role[] = ["ADMIN", "INVESTIGATOR", "ANALYST", "VIEWER"];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="size-6 text-amber-400" />
          Settings & Role-Based Access Control (RBAC)
        </h1>
        <p className="text-sm text-slate-400">
          Manage officer credentials, switch forensic clearance tiers, and inspect system cryptographic custody integrity.
        </p>
      </div>

      {/* Active User Card */}
      <div className="rounded-2xl border border-white/10 bg-[#161a24] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{currentUser.name}</h2>
              <p className="text-xs text-slate-400">{currentUser.agency} · {currentUser.email}</p>
            </div>
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              color: ROLE_BADGE_STYLE[currentUser.role].color,
              backgroundColor: `color-mix(in oklch, ${ROLE_BADGE_STYLE[currentUser.role].color} 18%, transparent)`,
              border: `1px solid color-mix(in oklch, ${ROLE_BADGE_STYLE[currentUser.role].color} 30%, transparent)`,
            }}
          >
            {ROLE_BADGE_STYLE[currentUser.role].label}
          </span>
        </div>

        <div className="pt-2 text-xs text-slate-400 flex items-center gap-4 flex-wrap">
          <span>Badge # <strong className="text-slate-200">{currentUser.badgeNumber}</strong></span>
          <span>•</span>
          <span>Clearance Level: <strong className="text-amber-400 font-mono">{currentUser.clearance}</strong></span>
          <span>•</span>
          <span>Jurisdiction: <strong className="text-slate-200">{currentUser.jurisdiction}</strong></span>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="rounded-xl border border-white/10 bg-[#161a24] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="size-4 text-amber-400" />
          Switch Active Investigator Profile
        </h3>
        <p className="text-xs text-slate-400">
          Select any seeded persona to test permission boundaries across Administrators, Lead Investigators, Forensic Analysts, and Court Viewers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {availableUsers.map((u) => {
            const isSelected = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                onClick={() => onSwitchUser(u)}
                className={`rounded-xl border p-3.5 transition cursor-pointer text-xs space-y-2 ${
                  isSelected
                    ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                    : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-[#1a202c]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate">{u.name}</span>
                  {isSelected && <Check className="size-3.5 text-amber-400 shrink-0" />}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{u.agency}</div>
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    color: ROLE_BADGE_STYLE[u.role].color,
                    backgroundColor: `color-mix(in oklch, ${ROLE_BADGE_STYLE[u.role].color} 15%, transparent)`,
                  }}
                >
                  {u.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-xl border border-white/10 bg-[#161a24] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="size-4 text-amber-400" />
          RBAC Functional Clearance Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-2.5 px-3">System Permission</th>
                <th className="py-2.5 px-3 text-center">ADMIN</th>
                <th className="py-2.5 px-3 text-center">INVESTIGATOR</th>
                <th className="py-2.5 px-3 text-center">ANALYST</th>
                <th className="py-2.5 px-3 text-center">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {[
                { perm: "Create & Register New Investigations", key: "createCase" },
                { perm: "Update Case Status & Classification", key: "updateStatus" },
                { perm: "Issue VASP Emergency Freeze Subpoena", key: "issueFreezeRequest" },
                { perm: "Append Case Notes & Observations", key: "addNotes" },
                { perm: "Inspect Forensic Graph & Fund Ledger", key: "viewIntelligence" },
                { perm: "Execute TRACE-AI Copilot Queries", key: "runAIAnalysis" },
                { perm: "Export Signed SHA-256 Court Dossiers", key: "exportReports" },
                { perm: "Manage Officer Credentials & Users", key: "manageUsers" },
              ].map((row) => (
                <tr key={row.key} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-200">{row.perm}</td>
                  {roles.map((r) => {
                    const hasAccess = (PERMISSIONS as any)[row.key](r);
                    return (
                      <td key={r} className="py-2.5 px-3 text-center">
                        {hasAccess ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
