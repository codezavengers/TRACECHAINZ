import type {
  InvestigationCase,
  TransactionGraph,
  JourneyStep,
  EvidenceRecord,
  Alert,
  WatchedWallet,
  VaspRecord,
  ProviderHealth,
  Role,
  SessionUser,
  Chain,
  FraudTypology,
  CaseStatus,
  RiskBand,
  GraphNode,
  GraphEdge,
  UserProfile,
  WatchlistWallet,
  VaspDirectoryEntry,
  BlockchainProviderStatus,
} from "@/lib/types";
import { synchronousHash } from "./crypto";

export interface CaseInvestigationData {
  graph: TransactionGraph;
  journey: JourneyStep[];
  evidence: EvidenceRecord[];
  vaspAttribution: {
    vasp: VaspRecord;
    confidence: number;
    depositAddress: string;
    identifiedHop: number;
    recommendedAction: string;
    kycSubpoenaReady: boolean;
  } | null;
  patterns: {
    name: string;
    severity: "HIGH" | "CRITICAL" | "MEDIUM";
    description: string;
    confidence: number;
  }[];
}

export const SEEDED_VASPS: VaspRecord[] = [
  {
    id: "vasp-binance",
    name: "Binance Global",
    type: "EXCHANGE",
    jurisdiction: "Multiple (Cayman / UAE / France)",
    kycLevel: "HIGH",
    cooperationLevel: "HIGH",
    note: "Responds to LEA freezing orders within 4–12 hours via Kodak LE portal.",
  },
  {
    id: "vasp-okx",
    name: "OKX Exchange",
    type: "EXCHANGE",
    jurisdiction: "Seychelles / Bahamas",
    kycLevel: "HIGH",
    cooperationLevel: "HIGH",
    note: "High cooperation with INTERPOL / CBI requests. Dedicated compliance team.",
  },
  {
    id: "vasp-kraken",
    name: "Kraken (Payward Inc.)",
    type: "EXCHANGE",
    jurisdiction: "United States (FinCEN / state licenses)",
    kycLevel: "HIGH",
    cooperationLevel: "HIGH",
    note: "Complies rapidly with 18 U.S.C. § 981 / 2703 subpoenas & international mutual legal assistance treaties (MLAT).",
  },
  {
    id: "vasp-kucoin",
    name: "KuCoin",
    type: "EXCHANGE",
    jurisdiction: "Seychelles",
    kycLevel: "MEDIUM",
    cooperationLevel: "MEDIUM",
    note: "Requires formal court order / official LEA email domain verification. 24–48h response.",
  },
  {
    id: "vasp-huobi",
    name: "HTX (Huobi)",
    type: "EXCHANGE",
    jurisdiction: "Seychelles",
    kycLevel: "MEDIUM",
    cooperationLevel: "MEDIUM",
    note: "Medium cooperation. Requires international police liaison channel.",
  },
  {
    id: "vasp-bybit",
    name: "Bybit Fintech",
    type: "EXCHANGE",
    jurisdiction: "United Arab Emirates (Dubai)",
    kycLevel: "HIGH",
    cooperationLevel: "HIGH",
    note: "Regulated under Dubai VARA. Active compliance desk for fast freeze execution.",
  },
  {
    id: "vasp-coinbase",
    name: "Coinbase Global",
    type: "EXCHANGE",
    jurisdiction: "United States",
    kycLevel: "HIGH",
    cooperationLevel: "HIGH",
    note: "Gold-standard KYC verification. Turnaround time under 2 hours for urgent freeze directives.",
  },
];

export const INITIAL_CASES: InvestigationCase[] = [
  {
    id: "TC-1042",
    complaintRef: "NCRP/2026/02/77189",
    title: "Pig Butchering (Sha Zhu Pan) -> OKX Hot Deposit",
    reportedWallet: "0x71c0429f939e0807b1d1bc65860d5b77ecb2a601",
    chain: "ethereum",
    complaintText:
      "Victim induced via WhatsApp romance lure to deposit 45.5 ETH into fraudulent trading platform 'DEX-QuantumAlpha'. Victim was locked out upon attempting withdrawal. Funds rapidly split into 3 transit addresses and deposited into OKX deposit wallet 0x5a21b3f940268ec3802e.",
    extractedWallets: [
      "0x71c0429f939e0807b1d1bc65860d5b77ecb2a601",
      "0x98f217c09e39401ab6b91c65860d5b77ecb8821a",
      "0x5a21b3f940268ec3802e3b3a6e9a8f276189c441",
    ],
    typology: "PIG_BUTCHERING",
    riskScore: 92,
    riskBand: "CRITICAL",
    priorityScore: 94,
    status: "VASP_IDENTIFIED",
    investigator: "Special Agent Vikram Mehta",
    reportedLossUsd: 142500,
    traceableUsd: 138200,
    recoveryProbability: 0.86,
    connectedVictims: 4,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    provenance: "KNOWN_ATTRIBUTION",
    notes: [
      {
        id: "note-1",
        author: "Special Agent Vikram Mehta",
        createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
        body: "Initial intake completed. Address 0x71c... received 45.5 ETH from victim in 2 transactions.",
      },
      {
        id: "note-2",
        author: "Senior Analyst Dev Patel",
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        body: "Attribution engine verified target deposit wallet 0x5a2... matches OKX user deposit cluster. Prepared draft ActionPack freeze notice.",
      },
    ],
    activity: [
      {
        id: "act-1",
        actor: "Special Agent Vikram Mehta",
        action: "CASE_CREATED",
        detail: "Opened case from NCRP complaint reference #77189",
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: "act-2",
        actor: "TraceChain Engine",
        action: "VASP_ATTRIBUTION_MATCH",
        detail: "Target wallet 0x5a21b... linked with 98% confidence to OKX Exchange",
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
      {
        id: "act-3",
        actor: "Senior Analyst Dev Patel",
        action: "STATUS_UPDATE",
        detail: "Updated case status from TRACING to VASP_IDENTIFIED",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TC-1088",
    complaintRef: "CYBER/IN/2026/89402",
    title: "Telegram Part-Time Review Scam -> Binance Hot Wallet",
    reportedWallet: "TQ41vQxX9bW9pLz7Y2N1jK6mM4vR8eT3sA",
    chain: "tron",
    complaintText:
      "Victim recruited on Telegram to complete rating tasks. Transferred 48,000 USDT (TRC-20) to fake merchant escrow account. Funds aggregated into high-volume burner wallet and forwarded into Binance TRON deposit gateway.",
    extractedWallets: [
      "TQ41vQxX9bW9pLz7Y2N1jK6mM4vR8eT3sA",
      "TT7yK4p1wQ8mN9vL2jR6eS3aB5xC8vD1mE",
      "TPkZ8q1wX3yU5vN7mJ9rT2sL4bA6cD8eF0",
    ],
    typology: "TASK_SCAM",
    riskScore: 85,
    riskBand: "HIGH",
    priorityScore: 88,
    status: "ACTION_REQUIRED",
    investigator: "Inspector Ananya Sharma",
    reportedLossUsd: 48000,
    traceableUsd: 46500,
    recoveryProbability: 0.78,
    connectedVictims: 12,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    provenance: "KNOWN_ATTRIBUTION",
    notes: [
      {
        id: "note-1",
        author: "Inspector Ananya Sharma",
        createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
        body: "High velocity fund splitting detected on TRON network. 12 related NCRP complaints share the exact same intermediary burner.",
      },
    ],
    activity: [
      {
        id: "act-1",
        actor: "Inspector Ananya Sharma",
        action: "CASE_CREATED",
        detail: "Ingested Telegram cyber fraud complaint",
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: "act-2",
        actor: "TraceChain Engine",
        action: "CLUSTER_EXPANSION",
        detail: "Identified 11 additional victim complaints connected to transit address TT7yK4...",
        createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TC-0914",
    complaintRef: "LEA/US/DOJ/2026/044",
    title: "LockBit 3.0 Ransomware Payout -> Peel Chain -> Mixer",
    reportedWallet: "bc1qa5wkf603fnqap32s9xuv77926s8543u08zkm5m",
    chain: "bitcoin",
    complaintText:
      "Critical infrastructure hospital network hit with LockBit 3.0 ransomware. Ransom of 5 BTC (~$320,000) paid. Attacker executed classic 7-hop peel chain to disperse UTXOs, with 3.2 BTC funneling toward Tornado Cash/Wasabi tumbler.",
    extractedWallets: [
      "bc1qa5wkf603fnqap32s9xuv77926s8543u08zkm5m",
      "bc1q87x9p32v0018s9xuv77926s8543u08zk8821m",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    ],
    typology: "RANSOMWARE",
    riskScore: 96,
    riskBand: "CRITICAL",
    priorityScore: 98,
    status: "FREEZE_REVIEW",
    investigator: "Special Agent Vikram Mehta",
    reportedLossUsd: 320000,
    traceableUsd: 295000,
    recoveryProbability: 0.42,
    connectedVictims: 1,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    provenance: "HEURISTIC_ANALYSIS",
    notes: [
      {
        id: "note-1",
        author: "Special Agent Vikram Mehta",
        createdAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
        body: "Peel chain algorithm flagged 7 sequential unspent change outputs. Coordinated alert sent to OFAC watchlist.",
      },
    ],
    activity: [
      {
        id: "act-1",
        actor: "Special Agent Vikram Mehta",
        action: "CASE_CREATED",
        detail: "Opened federal ransomware incident",
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
      {
        id: "act-2",
        actor: "TraceChain Engine",
        action: "PEEL_CHAIN_DETECTED",
        detail: "Automated peel chain decomposition identified 7 hops with 0.5 BTC peel amounts",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TC-1150",
    complaintRef: "NCRP/2026/03/12093",
    title: "Fake DEX Phishing Drainer -> Cross-Chain Avalanche Bridge",
    reportedWallet: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    chain: "polygon",
    complaintText:
      "Victim connected wallet to fake Uniswap v4 airdrop portal with Permit2 signature exploit. 87,200 USDC drained on Polygon, swapped to WETH, bridged via Stargate Bridge to Avalanche C-Chain, and deposited to KuCoin.",
    extractedWallets: [
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    ],
    typology: "CROSS_CHAIN_LAUNDERING",
    riskScore: 78,
    riskBand: "HIGH",
    priorityScore: 82,
    status: "TRACING",
    investigator: "Senior Analyst Dev Patel",
    reportedLossUsd: 87200,
    traceableUsd: 84000,
    recoveryProbability: 0.65,
    connectedVictims: 8,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    provenance: "LIVE_BLOCKCHAIN_DATA",
    notes: [],
    activity: [
      {
        id: "act-1",
        actor: "Senior Analyst Dev Patel",
        action: "CASE_CREATED",
        detail: "Ingested Permit2 drainer complaint",
        createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TC-0832",
    complaintRef: "FBI/IC3/2026/00918",
    title: "SIM Swap Executive Extortion -> Kraken Institutional OTC",
    reportedWallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ethereum",
    complaintText:
      "Corporate officer SIM swapped; multi-sig wallet drained of 165 ETH. Attackers moved funds through 2 ephemeral intermediate smart contract proxies directly into a verified Kraken OTC custody deposit account.",
    extractedWallets: [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    ],
    typology: "ORGANIZED_FRAUD",
    riskScore: 95,
    riskBand: "CRITICAL",
    priorityScore: 99,
    status: "FREEZE_REVIEW",
    investigator: "Special Agent Vikram Mehta",
    reportedLossUsd: 510000,
    traceableUsd: 495000,
    recoveryProbability: 0.92,
    connectedVictims: 1,
    createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    provenance: "KNOWN_ATTRIBUTION",
    notes: [
      {
        id: "note-1",
        author: "Special Agent Vikram Mehta",
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        body: "Kraken Legal Compliance confirmed receipt of emergency preserve order #IC3-00918. Account frozen pending court seizure warrant.",
      },
    ],
    activity: [
      {
        id: "act-1",
        actor: "Special Agent Vikram Mehta",
        action: "FREEZE_NOTICE_ISSUED",
        detail: "Transmitted emergency preservation request to legal@kraken.com",
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TC-1205",
    complaintRef: "NCRP/2026/03/44129",
    title: "Ponzi Arbitrage Bot Scam -> KuCoin Rapid Multi-Hop",
    reportedWallet: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    chain: "bsc",
    complaintText:
      "Victims promised 8% daily returns on automated BNB flash loan arbitrage bot. Smart contract had backdoor function `migrateLiquidity()` which drained 110 BNB ($64,500). Laundered across PancakeSwap and transferred to KuCoin deposit tag.",
    extractedWallets: [
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
    ],
    typology: "INVESTMENT_FRAUD",
    riskScore: 70,
    riskBand: "HIGH",
    priorityScore: 76,
    status: "ANALYZING",
    investigator: "Senior Analyst Dev Patel",
    reportedLossUsd: 64500,
    traceableUsd: 61000,
    recoveryProbability: 0.58,
    connectedVictims: 19,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    provenance: "LIVE_BLOCKCHAIN_DATA",
    notes: [],
    activity: [
      {
        id: "act-1",
        actor: "Senior Analyst Dev Patel",
        action: "CASE_CREATED",
        detail: "Complaint ingested from NCRP online portal",
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

// Helper to generate a realistic graph for any case
export function generateCaseInvestigationData(c: InvestigationCase): CaseInvestigationData {
  const isEth = c.chain === "ethereum";
  const isBtc = c.chain === "bitcoin";
  const isTron = c.chain === "tron";
  const ticker = isBtc ? "BTC" : isTron ? "USDT" : "ETH";

  const rootAddr = c.reportedWallet;
  const burner1 = isBtc
    ? "bc1q87x9p32v0018s9xuv77926s8543u08zk8821m"
    : isTron
      ? "TT7yK4p1wQ8mN9vL2jR6eS3aB5xC8vD1mE"
      : "0x98f217c09e39401ab6b91c65860d5b77ecb8821a";

  const burner2 = isBtc
    ? "bc1q99k2l1m4n8p7q6r5s4t3u2v1w0x9y8z7a6b5c4"
    : isTron
      ? "TPkZ8q1wX3yU5vN7mJ9rT2sL4bA6cD8eF0"
      : "0x44b2089f28a7e3698014b9c165860d5b77ecb110";

  const vaspDeposit = isBtc
    ? "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"
    : isTron
      ? "TX9k8w1pQ7mN9vL2jR6eS3aB5xC8vD1mE9"
      : "0x5a21b3f940268ec3802e3b3a6e9a8f276189c441";

  const victimAddr = isBtc
    ? "1BoatSLRHtKNngkdXEeobR76b53LETtpyT"
    : isTron
      ? "TN3W4H6rK2ce4vX9KwEQdF9N7bL8sP1mQ2"
      : "0x1234567890123456789012345678901234567890";

  const nodes: GraphNode[] = [
    {
      id: victimAddr,
      kind: "VICTIM",
      chain: c.chain,
      label: "Victim Wallet (Reported Origin)",
      riskScore: 10,
      usdValue: c.reportedLossUsd,
      depth: 0,
      provenance: "LIVE_BLOCKCHAIN_DATA",
    },
    {
      id: rootAddr,
      kind: "SUSPICIOUS",
      chain: c.chain,
      label: `Suspect Deposit Address (${c.id})`,
      riskScore: c.riskScore,
      usdValue: c.reportedLossUsd,
      depth: 1,
      provenance: "KNOWN_ATTRIBUTION",
    },
    {
      id: burner1,
      kind: "BURNER",
      chain: c.chain,
      label: "Transit Burner Hop #1",
      riskScore: 84,
      usdValue: c.traceableUsd * 0.65,
      depth: 2,
      provenance: "HEURISTIC_ANALYSIS",
    },
    {
      id: burner2,
      kind: "BURNER",
      chain: c.chain,
      label: "Transit Burner Hop #2 (Fan-Out)",
      riskScore: 78,
      usdValue: c.traceableUsd * 0.35,
      depth: 2,
      provenance: "HEURISTIC_ANALYSIS",
    },
    {
      id: vaspDeposit,
      kind: "VASP",
      chain: c.chain,
      label: "Target VASP Deposit (Identified Hot Wallet)",
      riskScore: 92,
      usdValue: c.traceableUsd * 0.95,
      depth: 3,
      attribution: "KNOWN",
      provenance: "KNOWN_ATTRIBUTION",
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: `edge-1-${c.id}`,
      source: victimAddr,
      target: rootAddr,
      kind: "SENT_FUNDS",
      amount: c.reportedLossUsd / 3100,
      asset: ticker,
      usdValue: c.reportedLossUsd,
      timestamp: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
      txHash: synchronousHash(`tx-1-${c.id}`).slice(0, 32),
    },
    {
      id: `edge-2-${c.id}`,
      source: rootAddr,
      target: burner1,
      kind: "SENT_FUNDS",
      amount: (c.traceableUsd * 0.65) / 3100,
      asset: ticker,
      usdValue: c.traceableUsd * 0.65,
      timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
      txHash: synchronousHash(`tx-2-${c.id}`).slice(0, 32),
    },
    {
      id: `edge-3-${c.id}`,
      source: rootAddr,
      target: burner2,
      kind: "SENT_FUNDS",
      amount: (c.traceableUsd * 0.35) / 3100,
      asset: ticker,
      usdValue: c.traceableUsd * 0.35,
      timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
      txHash: synchronousHash(`tx-3-${c.id}`).slice(0, 32),
    },
    {
      id: `edge-4-${c.id}`,
      source: burner1,
      target: vaspDeposit,
      kind: "DEPOSITED",
      amount: (c.traceableUsd * 0.63) / 3100,
      asset: ticker,
      usdValue: c.traceableUsd * 0.63,
      timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      txHash: synchronousHash(`tx-4-${c.id}`).slice(0, 32),
    },
    {
      id: `edge-5-${c.id}`,
      source: burner2,
      target: vaspDeposit,
      kind: "DEPOSITED",
      amount: (c.traceableUsd * 0.32) / 3100,
      asset: ticker,
      usdValue: c.traceableUsd * 0.32,
      timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      txHash: synchronousHash(`tx-5-${c.id}`).slice(0, 32),
    },
  ];

  const graph: TransactionGraph = {
    rootAddress: rootAddr,
    chain: c.chain,
    depth: 3,
    nodes,
    edges,
    provenance: c.provenance,
  };

  const journey: JourneyStep[] = [
    {
      step: 1,
      title: "Victim Initial Inducement",
      address: victimAddr,
      kind: "VICTIM",
      usdValue: c.reportedLossUsd,
      timestamp: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
      description: "Victim initiated transfer under fraudulent deception to reported suspect address.",
    },
    {
      step: 2,
      title: "Suspect Primary Aggregation Node",
      address: rootAddr,
      kind: "SUSPICIOUS",
      usdValue: c.reportedLossUsd,
      timestamp: new Date(Date.now() - 38 * 3600 * 1000).toISOString(),
      description: "Suspect wallet received victim funds. Held temporarily for 118 minutes before automated dispersal.",
    },
    {
      step: 3,
      title: "High-Velocity Fan-Out Laundering",
      address: burner1,
      kind: "BURNER",
      usdValue: c.traceableUsd * 0.65,
      timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
      description: "Funds split across disposable burner addresses to hinder naive blockchain explorer tracing.",
    },
    {
      step: 4,
      title: "Target VASP Exchange Deposit Gateway",
      address: vaspDeposit,
      kind: "VASP",
      usdValue: c.traceableUsd * 0.95,
      timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      description: "Cleaned tranches converged into exchange deposit address. Identified KYC verification threshold.",
      attribution: "KNOWN",
    },
  ];

  // Cryptographic evidence chain with genuine hash linking
  const ev1Hash = synchronousHash(`EVID-1-${c.id}-genesis`);
  const ev2Hash = synchronousHash(`EVID-2-${c.id}-${ev1Hash}`);
  const ev3Hash = synchronousHash(`EVID-3-${c.id}-${ev2Hash}`);

  const evidence: EvidenceRecord[] = [
    {
      id: `ev-1-${c.id}`,
      caseId: c.id,
      type: "COMPLAINT_INTAKE",
      title: "Verified Victim First-Information Report (FIR)",
      contentHash: ev1Hash,
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      createdAt: c.createdAt,
      createdBy: c.investigator,
      provenance: "LIVE_BLOCKCHAIN_DATA",
      summary: `Victim complaint intake logged. Hash of FIR statement: ${ev1Hash.slice(0, 16)}...`,
    },
    {
      id: `ev-2-${c.id}`,
      caseId: c.id,
      type: "BLOCKCHAIN_GRAPH_SNAPSHOT",
      title: "Graph Traversal & Hop Telemetry Snapshot",
      contentHash: ev2Hash,
      prevHash: ev1Hash,
      createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      createdBy: "TraceChain Automated Engine",
      provenance: "HEURISTIC_ANALYSIS",
      summary: `Automated graph traversal identified 5 nodes, 5 edges across 3 trace hops with total volume $${c.traceableUsd.toLocaleString()}.`,
    },
    {
      id: `ev-3-${c.id}`,
      caseId: c.id,
      type: "VASP_ATTRIBUTION_CERTIFICATE",
      title: "VASP Exchange Identification Attestation",
      contentHash: ev3Hash,
      prevHash: ev2Hash,
      createdAt: c.updatedAt,
      createdBy: "Special Agent Vikram Mehta",
      provenance: "KNOWN_ATTRIBUTION",
      summary: `Exchange deposit address ${vaspDeposit} matched against TraceChain VASP entity database with confidence rating 98%.`,
    },
  ];

  const matchedVasp = c.typology === "PIG_BUTCHERING"
    ? SEEDED_VASPS[1] // OKX
    : c.typology === "TASK_SCAM"
      ? SEEDED_VASPS[0] // Binance
      : c.typology === "RANSOMWARE"
        ? SEEDED_VASPS[3] // KuCoin
        : SEEDED_VASPS[2]; // Kraken

  return {
    graph,
    journey,
    evidence,
    vaspAttribution: {
      vasp: matchedVasp,
      confidence: 0.98,
      depositAddress: vaspDeposit,
      identifiedHop: 3,
      recommendedAction: "Issue Immediate Subpoena Freeze Notice (MLAT / 91 CrPC equivalent) to exchange compliance desk.",
      kycSubpoenaReady: true,
    },
    patterns: [
      {
        name: "Rapid Fan-Out & Re-Aggregation",
        severity: "CRITICAL",
        description: "Funds immediately dispersed to 2 burner wallets within 12 minutes of victim transfer, then reunited at exchange gateway.",
        confidence: 0.96,
      },
      {
        name: "Peel Chain UTXO / Tranche Dispersal",
        severity: "HIGH",
        description: "Amounts sliced into round-number values matching typical P2P fiat conversion brackets.",
        confidence: 0.89,
      },
      {
        name: "Exchange Direct Deposit Gateway",
        severity: "HIGH",
        description: "Address belongs to a regulated Centralized Exchange (CEX) with mandatory Tier-2 KYC customer identification.",
        confidence: 0.98,
      },
    ],
  };
}

export const INITIAL_ALERTS: Alert[] = [
  {
    id: "alt-1",
    caseId: "TC-1042",
    walletAddress: "0x5a21b3f940268ec3802e3b3a6e9a8f276189c441",
    chain: "ethereum",
    severity: "CRITICAL",
    type: "VASP_DEPOSIT_DETECTED",
    message: "45.5 ETH ($142,500) received at OKX verified hot deposit gateway. Urgent freeze window active!",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alt-2",
    caseId: "TC-0914",
    walletAddress: "bc1qa5wkf603fnqap32s9xuv77926s8543u08zkm5m",
    chain: "bitcoin",
    severity: "CRITICAL",
    type: "TUMBLER_INTERACTION",
    message: "Outgoing transaction from LockBit suspect address routed toward Tornado/Wasabi mixer pool.",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: "alt-3",
    caseId: "TC-1088",
    walletAddress: "TQ41vQxX9bW9pLz7Y2N1jK6mM4vR8eT3sA",
    chain: "tron",
    severity: "HIGH",
    type: "MULTI_VICTIM_CONVERGENCE",
    message: "3 new victim complaints linked to identical TRON transit wallet within past 6 hours.",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    acknowledged: true,
  },
  {
    id: "alt-4",
    caseId: "TC-1150",
    walletAddress: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    chain: "polygon",
    severity: "MEDIUM",
    type: "CROSS_CHAIN_BRIDGE_EVENT",
    message: "Stargate bridge event observed: 87,200 USDC transferred Polygon -> Avalanche C-Chain.",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    acknowledged: true,
  },
];

export const INITIAL_WATCHTOWER: WatchedWallet[] = [
  {
    id: "watch-1",
    address: "0x5a21b3f940268ec3802e3b3a6e9a8f276189c441",
    chain: "ethereum",
    label: "OKX Deposit Gateway (Case TC-1042)",
    caseId: "TC-1042",
    addedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: "TRIGGERED",
    balance: 45.5,
    usdBalance: 142500,
  },
  {
    id: "watch-2",
    address: "TQ41vQxX9bW9pLz7Y2N1jK6mM4vR8eT3sA",
    chain: "tron",
    label: "Telegram Task Scam Transit (TC-1088)",
    caseId: "TC-1088",
    addedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "ACTIVE",
    balance: 48000,
    usdBalance: 48000,
  },
  {
    id: "watch-3",
    address: "bc1qa5wkf603fnqap32s9xuv77926s8543u08zkm5m",
    chain: "bitcoin",
    label: "LockBit 3.0 Ransomware Primary Root",
    caseId: "TC-0914",
    addedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "TRIGGERED",
    balance: 1.8,
    usdBalance: 115200,
  },
  {
    id: "watch-4",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ethereum",
    label: "SIM Swap Extortion Vault Target",
    caseId: "TC-0832",
    addedAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    status: "DORMANT",
    balance: 165.0,
    usdBalance: 510000,
  },
];

export const INITIAL_PROVIDERS: BlockchainProviderStatus[] = [
  {
    chain: "bitcoin",
    provider: "Bitcoin Core RPC Node",
    status: "LIVE",
    sourceType: "RAW_RPC",
    latencyMs: 142,
    lastSuccess: new Date().toISOString(),
    latestBlock: 884920,
    blockHeight: 884920,
    configured: true,
    liveCapable: true,
    historicalSearch: true,
  },
  {
    chain: "ethereum",
    provider: "Erigon / Geth Mainnet Node",
    status: "LIVE",
    sourceType: "RAW_RPC",
    latencyMs: 48,
    lastSuccess: new Date().toISOString(),
    latestBlock: 21894030,
    blockHeight: 21894030,
    configured: true,
    liveCapable: true,
    historicalSearch: true,
  },
  {
    chain: "polygon",
    provider: "Bor Native RPC",
    status: "LIVE",
    sourceType: "LIVE_API",
    latencyMs: 64,
    lastSuccess: new Date().toISOString(),
    latestBlock: 68120340,
    blockHeight: 68120340,
    configured: true,
    liveCapable: true,
    historicalSearch: true,
  },
  {
    chain: "bsc",
    provider: "BNB Smart Chain RPC Node",
    status: "LIVE",
    sourceType: "RAW_RPC",
    latencyMs: 88,
    lastSuccess: new Date().toISOString(),
    latestBlock: 46210984,
    blockHeight: 46210984,
    configured: true,
    liveCapable: true,
    historicalSearch: true,
  },
  {
    chain: "solana",
    provider: "Solana Mainnet-Beta RPC",
    status: "LIVE",
    sourceType: "LIVE_API",
    latencyMs: 195,
    lastSuccess: new Date().toISOString(),
    latestBlock: 320149582,
    blockHeight: 320149582,
    configured: true,
    liveCapable: true,
    historicalSearch: true,
  },
  {
    chain: "tron",
    provider: "TronGrid JSON-RPC API",
    status: "LIVE",
    sourceType: "LIVE_NATIVE_API",
    latencyMs: 110,
    lastSuccess: new Date().toISOString(),
    latestBlock: 69201490,
    blockHeight: 69201490,
    configured: true,
    liveCapable: true,
    historicalSearch: true,
  },
];

export const DEMO_USERS: SessionUser[] = [
  {
    id: "usr-1",
    name: "Special Agent Vikram Mehta",
    email: "vikram.mehta@cybercrime.gov.in",
    role: "INVESTIGATOR",
  },
  {
    id: "usr-2",
    name: "Inspector Ananya Sharma",
    email: "ananya.sharma@police.gov.in",
    role: "ADMIN",
  },
  {
    id: "usr-3",
    name: "Senior Analyst Dev Patel",
    email: "dev.patel@forensics.agency",
    role: "ANALYST",
  },
  {
    id: "usr-4",
    name: "Prosecutor Rajesh Kumar",
    email: "rajesh.kumar@judiciary.gov.in",
    role: "VIEWER",
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "usr-1",
    name: "Special Agent Vikram Mehta",
    email: "vikram.mehta@cybercrime.gov.in",
    role: "INVESTIGATOR",
    agency: "Central Cyber Crime Command",
    badgeNumber: "IND-CBI-4481",
    clearance: "TOP_SECRET_FORENSICS",
    jurisdiction: "All-India Cyber Jurisdiction",
  },
  {
    id: "usr-2",
    name: "Inspector Ananya Sharma",
    email: "ananya.sharma@police.gov.in",
    role: "ADMIN",
    agency: "State Cyber Investigation Cell",
    badgeNumber: "DL-POL-9921",
    clearance: "CHIEF_ADMIN_LEVEL_5",
    jurisdiction: "National Capital Region",
  },
  {
    id: "usr-3",
    name: "Senior Analyst Dev Patel",
    email: "dev.patel@forensics.agency",
    role: "ANALYST",
    agency: "Blockchain Intelligence Unit",
    badgeNumber: "CERT-IN-1029",
    clearance: "FORENSIC_ANALYST_L3",
    jurisdiction: "Technical Advisory Division",
  },
  {
    id: "usr-4",
    name: "Prosecutor Rajesh Kumar",
    email: "rajesh.kumar@judiciary.gov.in",
    role: "VIEWER",
    agency: "Special Court for Financial Fraud",
    badgeNumber: "JUD-DL-0312",
    clearance: "EVIDENTIARY_VIEW_ONLY",
    jurisdiction: "Judicial Review Branch",
  },
];

export const INITIAL_WATCHLIST: WatchlistWallet[] = INITIAL_WATCHTOWER.map((w) => ({
  ...w,
  riskScore: w.status === "TRIGGERED" ? 92 : w.status === "ACTIVE" ? 85 : 60,
  balanceUsd: w.usdBalance,
  lastCheckedAt: w.lastActivity,
}));

export const INITIAL_VASPS: VaspDirectoryEntry[] = [
  {
    ...SEEDED_VASPS[0],
    legalEntity: "Binance Holdings Ltd.",
    complianceRating: 94,
    kycStandard: "Tier-2 Verified ID + Proof of Address",
    responseLatencyHours: 4,
    registeredFiu: true,
    contactEmail: "compliance-le@binance.com",
    subpoenaFormat: "Kodak LE Portal Submissions",
  },
  {
    ...SEEDED_VASPS[1],
    legalEntity: "Aux Cayes FinTech Co. Ltd (OKX)",
    complianceRating: 92,
    kycStandard: "Facial Biometrics & National ID",
    responseLatencyHours: 6,
    registeredFiu: true,
    contactEmail: "law-enforcement@okx.com",
    subpoenaFormat: "Secured PDF Directive or MLAT",
  },
  {
    ...SEEDED_VASPS[2],
    legalEntity: "Payward Inc. (Kraken)",
    complianceRating: 98,
    kycStandard: "FinCEN Tier-3 Institutional KYC",
    responseLatencyHours: 2,
    registeredFiu: false,
    contactEmail: "subpoenas@kraken.com",
    subpoenaFormat: "18 U.S.C. 981 / International Letters Rogatory",
  },
  {
    ...SEEDED_VASPS[3],
    legalEntity: "Mek Global Limited (KuCoin)",
    complianceRating: 78,
    kycStandard: "Basic ID Verification",
    responseLatencyHours: 24,
    registeredFiu: false,
    contactEmail: "compliance-support@kucoin.com",
    subpoenaFormat: "Official Police Email Domain Requirement",
  },
  {
    ...SEEDED_VASPS[5],
    legalEntity: "Bybit Fintech FZE",
    complianceRating: 91,
    kycStandard: "Dubai VARA Comprehensive KYC",
    responseLatencyHours: 6,
    registeredFiu: true,
    contactEmail: "le-compliance@bybit.com",
    subpoenaFormat: "VARA Mutual Assistance Format",
  },
  {
    ...SEEDED_VASPS[6],
    legalEntity: "Coinbase Inc.",
    complianceRating: 99,
    kycStandard: "US SEC/FinCEN Full KYC",
    responseLatencyHours: 2,
    registeredFiu: false,
    contactEmail: "law-enforcement-requests@coinbase.com",
    subpoenaFormat: "Federal Subpoena / 2703(d) Order",
  },
];

