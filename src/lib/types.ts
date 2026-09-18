export * from "../../lib/types";
import type { SessionUser, WatchedWallet, ProviderHealth, VaspRecord, Role, RiskBand } from "../../lib/types";

export type UserProfile = SessionUser & {
  agency?: string;
  badgeNumber?: string;
  clearance?: string;
  jurisdiction?: string;
};

export type WatchlistWallet = WatchedWallet & {
  riskScore: number;
  balanceUsd?: number;
  lastCheckedAt?: string;
  createdAt?: string;
};

export type BlockchainProviderStatus = ProviderHealth & {
  blockHeight: number;
};

export type VaspDirectoryEntry = VaspRecord & {
  legalEntity: string;
  complianceRating: number;
  kycStandard: string;
  responseLatencyHours: number;
  registeredFiu: boolean;
  contactEmail: string;
  subpoenaFormat: string;
};

export type Severity = RiskBand;
