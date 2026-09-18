import type { Role } from "@/lib/types";

export const PERMISSIONS = {
  createCase: (role: Role): boolean => role === "ADMIN" || role === "INVESTIGATOR",
  updateStatus: (role: Role): boolean => role === "ADMIN" || role === "INVESTIGATOR",
  issueFreezeRequest: (role: Role): boolean => role === "ADMIN" || role === "INVESTIGATOR",
  addNotes: (role: Role): boolean => role !== "VIEWER",
  manageUsers: (role: Role): boolean => role === "ADMIN",
  deleteRecords: (role: Role): boolean => role === "ADMIN",
  viewIntelligence: (_role: Role): boolean => true,
  runAIAnalysis: (_role: Role): boolean => true,
  exportReports: (_role: Role): boolean => true,
};

export const ROLE_BADGE_STYLE: Record<Role, { color: string; label: string }> = {
  ADMIN: { color: "var(--risk-critical)", label: "Administrator" },
  INVESTIGATOR: { color: "var(--primary)", label: "Lead Investigator" },
  ANALYST: { color: "var(--live)", label: "Forensic Analyst" },
  VIEWER: { color: "var(--muted-foreground)", label: "Court / Viewer" },
};
