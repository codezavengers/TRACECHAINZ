import React, { useState } from "react";
import type {
  InvestigationCase,
  CaseStatus,
  UserProfile,
  WatchlistWallet,
  Alert,
  Chain,
} from "@/lib/types";
import {
  INITIAL_CASES,
  INITIAL_ALERTS,
  INITIAL_WATCHLIST,
  INITIAL_USERS,
  INITIAL_PROVIDERS,
  INITIAL_VASPS,
} from "@/lib/store";
import { LiveBitcoinProvider } from "@/lib/useLiveBitcoin";
import { MultiChainProvider } from "@/lib/useMultiChain";
import { AppShell } from "@/components/AppShell";
import { DashboardView } from "@/components/DashboardView";
import { CasesListView } from "@/components/CasesListView";
import { CaseDetailView } from "@/components/CaseDetailView";
import { CreateCaseModal } from "@/components/CreateCaseModal";
import { WalletInvestigationView } from "@/components/WalletInvestigationView";
import { WatchtowerView } from "@/components/WatchtowerView";
import { AlertsView } from "@/components/AlertsView";
import { EvidenceCenterView } from "@/components/EvidenceCenterView";
import { ActionPackView } from "@/components/ActionPackView";
import { AssistantView } from "@/components/AssistantView";
import { CrossChainView } from "@/components/CrossChainView";
import { IntegrationsView } from "@/components/IntegrationsView";
import { SettingsView } from "@/components/SettingsView";

export default function App() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [cases, setCases] = useState<InvestigationCase[]>(INITIAL_CASES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [watchlist, setWatchlist] = useState<WatchlistWallet[]>(INITIAL_WATCHLIST);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Navigate to case detail
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentView("case_detail");
  };

  // Update status handler
  const handleUpdateCaseStatus = (caseId: string, newStatus: CaseStatus) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          activity: [
            {
              id: `act-${Date.now()}`,
              actor: currentUser.name,
              action: "STATUS_UPDATED",
              detail: `Investigation status transitioned to ${newStatus}`,
              createdAt: new Date().toISOString(),
            },
            ...c.activity,
          ],
        };
      })
    );
  };

  // Add note handler
  const handleAddNote = (caseId: string, noteText: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const newNote = {
          id: `note-${Date.now()}`,
          author: `${currentUser.name} (${currentUser.role})`,
          body: noteText,
          createdAt: new Date().toISOString(),
        };
        return {
          ...c,
          notes: [newNote, ...c.notes],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Create new case handler
  const handleCreateCase = (newCase: InvestigationCase) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setCurrentView("case_detail");

    // Also trigger alert
    const newAlert: Alert = {
      id: `al-${Date.now()}`,
      caseId: newCase.id,
      walletAddress: newCase.reportedWallet,
      chain: newCase.chain,
      type: "LARGE_DEPOSIT",
      severity: "CRITICAL",
      message: `New investigation ${newCase.id} initiated: ${newCase.title} ($${newCase.reportedLossUsd?.toLocaleString()})`,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  // Acknowledge alert handler
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  // Watchtower handlers
  const handleAddToWatchtower = (item: Partial<WatchlistWallet> & Pick<WatchlistWallet, "address" | "chain">) => {
    const newEntry: WatchlistWallet = {
      id: `watch-${Date.now()}`,
      address: item.address,
      chain: item.chain,
      label: item.label || "Tracked Suspect Address",
      status: item.status || "ACTIVE",
      riskScore: item.riskScore ?? 85,
      balance: item.balance ?? 0,
      usdBalance: item.usdBalance ?? (item.balanceUsd ?? 0),
      balanceUsd: item.balanceUsd ?? (item.usdBalance ?? 0),
      addedAt: item.addedAt || new Date().toISOString(),
      lastActivity: item.lastActivity || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
    };
    setWatchlist((prev) => [newEntry, ...prev]);
  };

  const handleRemoveFromWatchtower = (id: string) => {
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <MultiChainProvider>
      <LiveBitcoinProvider>
        <AppShell
          currentView={currentView}
          onNavigate={(v: string) => {
            setCurrentView(v);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          currentUser={currentUser}
          availableUsers={INITIAL_USERS}
          onSwitchUser={setCurrentUser}
          alerts={alerts}
          onOpenCreateCase={() => setIsCreateModalOpen(true)}
        >
          {currentView === "dashboard" && (
            <DashboardView
              cases={cases}
              alerts={alerts}
              onSelectCase={handleSelectCase}
              onNavigate={(v: string) => setCurrentView(v)}
              onOpenCreateCase={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentView === "cases" && (
            <CasesListView
              cases={cases}
              onSelectCase={handleSelectCase}
              onOpenCreateCase={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentView === "case_detail" && selectedCase && (
            <CaseDetailView
              investigationCase={selectedCase}
              currentRole={currentUser.role}
              onBack={() => setCurrentView("cases")}
              onUpdateStatus={handleUpdateCaseStatus}
              onAddNote={handleAddNote}
            />
          )}

          {currentView === "wallet" && (
            <WalletInvestigationView
              onOpenCreateCaseWithAddress={(addr: string, chain: Chain) => {
                setIsCreateModalOpen(true);
              }}
              onAddToWatchtower={(addr: string, chain: Chain, label: string) => {
                handleAddToWatchtower({
                  address: addr,
                  chain,
                  label,
                  status: "ACTIVE",
                  riskScore: 88,
                  balanceUsd: 14200,
                });
              }}
            />
          )}

          {currentView === "watchtower" && (
            <WatchtowerView
              watchlist={watchlist}
              onAddWallet={handleAddToWatchtower}
              onRemoveWallet={handleRemoveFromWatchtower}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentView === "crosschain" && <CrossChainView />}

          {currentView === "alerts" && (
            <AlertsView
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onSelectCase={handleSelectCase}
            />
          )}

          {currentView === "assistant" && <AssistantView />}

          {currentView === "evidence" && (
            <EvidenceCenterView cases={cases} onSelectCase={handleSelectCase} />
          )}

          {currentView === "actionpack" && <ActionPackView cases={cases} />}

          {currentView === "integrations" && (
            <IntegrationsView providers={INITIAL_PROVIDERS} vasps={INITIAL_VASPS} />
          )}

          {currentView === "settings" && (
            <SettingsView
              currentUser={currentUser}
              availableUsers={INITIAL_USERS}
              onSwitchUser={setCurrentUser}
            />
          )}

          <CreateCaseModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateCase={handleCreateCase}
          />
        </AppShell>
      </LiveBitcoinProvider>
    </MultiChainProvider>
  );
}
